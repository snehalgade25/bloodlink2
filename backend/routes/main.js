const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const DonationCamp = require('../models/DonationCamp');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const BloodBank = require('../models/BloodBank');
const User = require('../models/User'); // Required for emails
const { sendEmergencyEmail } = require('../utils/emailService');

// Get all hospitals
router.get('/hospitals', async (req, res) => {
    try {
        const hospitals = await Hospital.find();
        res.json(hospitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all blood banks
router.get('/bloodbanks', async (req, res) => {
    try {
        const banks = await BloodBank.find();
        res.json(banks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all donors
router.get('/donors', async (req, res) => {
    try {
        const donors = await Donor.find();
        res.json(donors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single hospital
router.get('/hospital/:id', async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);
        res.json(hospital);
    } catch (err) {
        res.status(404).json({ error: 'Hospital not found' });
    }
});

// Get all camps
router.get('/camps', async (req, res) => {
    try {
        const camps = await DonationCamp.find().sort({ _id: -1 }); // Newest first
        res.json(camps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Organize a new camp
router.post('/camps', async (req, res) => {
    try {
        const { name, date, time, venue, organizer } = req.body;
        console.log('Organizing Camp:', { name, date, time, venue, organizer });
        const newCamp = new DonationCamp({ name, date, time, venue, organizer, registeredDonors: [] });
        await newCamp.save();
        res.status(201).json({ message: 'Camp organized successfully', camp: newCamp });
    } catch (err) {
        console.error('Camp Creation Error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// Process donation pledge (Intent)
router.post('/donate', async (req, res) => {
    try {
        console.log('Donation intent received for:', req.body.username || req.body.name);
        res.status(200).json({ message: 'Donation intent logged successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Process completed donation (Logged from Dashboard/Hospital)
router.post('/donations/log', async (req, res) => {
    try {
        const { username, hospitalName, date } = req.body;
        console.log('Donation logged for:', username, hospitalName);
        
        const donor = await Donor.findOne({ username });
        if (!donor) return res.status(404).json({ error: 'Donor not found' });

        const donationDate = date ? new Date(date) : new Date();

        // Check buffer period (90 days)
        if (donor.donations && donor.donations.length > 0) {
            const sortedDonations = [...donor.donations].sort((a, b) => new Date(b.date) - new Date(a.date));
            const lastDonation = new Date(sortedDonations[0].date);
            const bufferEnds = new Date(lastDonation.getTime() + 90 * 24 * 60 * 60 * 1000);
            
            if (donationDate < bufferEnds) {
                 return res.status(400).json({ error: 'Buffer period not completed. You cannot donate yet.' });
            }
        }

        donor.donations.push({
            date: donationDate,
            hospitalName: hospitalName,
            status: 'Completed'
        });

        await donor.save();

        res.status(200).json({ message: 'Donation logged successfully', donor });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Process blood request
router.post('/request', async (req, res) => {
    try {
        const { bloodGroup, contactInfo, hospitalName, location, reason } = req.body;
        console.log(`[BROADCAST] New request for: ${bloodGroup} at ${location || 'Thane'}`);

        // 1. Save Request
        const bloodRequest = new BloodRequest({
            bloodGroup,
            contactInfo,
            hospitalName,
            location,
            reason
        });
        await bloodRequest.save();

        // 2. Broadcast Notifications (Async)
        // Find matching donors (case-insensitive)
        const matchingDonors = await Donor.find({
            bloodGroup: { $regex: new RegExp(`^${bloodGroup.replace('+', '\\+')}$`, 'i') }
        });

        const usernames = matchingDonors.map(d => d.username);
        console.log(`[BROADCAST] Found ${matchingDonors.length} matching donor profiles.`);

        if (usernames.length > 0) {
            // Find users to get emails
            const donorUsers = await User.find({ username: { $in: usernames } });
            console.log(`[BROADCAST] Identified ${donorUsers.length} user accounts with emails.`);

            donorUsers.forEach(u => {
                if (u.email) {
                    console.log(`[BROADCAST] Triggering email to: ${u.email}`);
                    sendEmergencyEmail(
                        u.email,
                        bloodGroup,
                        hospitalName || 'BloodLink Hospital',
                        location || 'Thane',
                        contactInfo
                    );
                }
            });
        } else {
            console.log(`[BROADCAST] No matching donors found for ${bloodGroup}.`);
        }

        res.status(201).json({ message: 'Emergency broadcasted!' });
    } catch (err) {
        console.error('[BROADCAST ERROR]:', err);
        res.status(400).json({ error: err.message });
    }
});

// Get matching requests for a donor
router.get('/matching-requests/:bloodGroup', async (req, res) => {
    try {
        const { bloodGroup } = req.params;
        // Find matching requests (case-insensitive)
        const requests = await BloodRequest.find({
            bloodGroup: { $regex: new RegExp(`^${bloodGroup.replace('+', '\\+')}$`, 'i') },
            status: 'Open'
        }).sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Statistics
router.get('/stats', async (req, res) => {
    try {
        const [totalDonors, emergencyRequests, upcomingCamps, totalHospitals] = await Promise.all([
            Donor.countDocuments(),
            BloodRequest.countDocuments(),
            DonationCamp.countDocuments(),
            Hospital.countDocuments()
        ]);

        // Get Recent Activities (last 5 entries across collections)
        const recentDonors = await Donor.find().sort({ createdAt: -1 }).limit(3);
        const recentRequests = await BloodRequest.find().sort({ createdAt: -1 }).limit(3);

        // Combine and Sort by raw date first
        const allActivities = [
            ...recentDonors.map(d => ({ type: 'Blood Pledge', entity: d.name, status: 'Interested', rawDate: d.createdAt })),
            ...recentRequests.map(r => ({ type: 'Emergency Broadcast', entity: r.bloodGroup, status: 'Emergency', rawDate: r.createdAt }))
        ].sort((a, b) => (b.rawDate || 0) - (a.rawDate || 0));

        const formatTime = (date) => {
            if (!date) return 'Just now';
            return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        const activities = allActivities.slice(0, 5).map(act => ({
            type: act.type,
            entity: act.entity,
            status: act.status,
            time: formatTime(act.rawDate)
        }));

        res.json({
            totalDonors,
            emergencyRequests,
            upcomingCamps,
            totalHospitals,
            activities
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Register donor for a camp
router.post('/camps/:id/register', async (req, res) => {
    try {
        const { username } = req.body;
        const camp = await DonationCamp.findById(req.params.id);
        if (!camp) return res.status(404).json({ error: 'Camp not found' });

        if (camp.registeredDonors.includes(username)) {
            return res.status(400).json({ error: 'Already registered for this camp' });
        }

        camp.registeredDonors.push(username);
        await camp.save();
        res.json({ message: 'Registered successfully', camp });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Unregister donor from a camp
router.delete('/camps/:id/register', async (req, res) => {
    try {
        const { username } = req.body;
        const camp = await DonationCamp.findById(req.params.id);
        if (!camp) return res.status(404).json({ error: 'Camp not found' });

        camp.registeredDonors = camp.registeredDonors.filter(u => u !== username);
        await camp.save();
        res.json({ message: 'Unregistered successfully', camp });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Volunteer for an emergency request
router.post('/request/:id/volunteer', async (req, res) => {
    try {
        const { username } = req.body;
        const request = await BloodRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        const alreadyVolunteered = request.volunteers.some(v => v.username === username);
        if (alreadyVolunteered) return res.status(400).json({ error: 'You have already volunteered for this request' });

        request.volunteers.push({ username, status: 'Pending' });
        await request.save();
        res.json({ message: 'Volunteered successfully', request });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Hospital: Update volunteer status
router.patch('/request/:requestId/volunteer/:username', async (req, res) => {
    try {
        const { status } = req.body; // 'Accepted', 'Completed', 'Rejected'
        const { requestId, username } = req.params;
        const request = await BloodRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        const volunteer = request.volunteers.find(v => v.username === username);
        if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });

        volunteer.status = status;
        await request.save();
        
        // If status is 'Completed', also log it in the Donor's profile
        if (status === 'Completed') {
             const donor = await Donor.findOne({ username });
             if (donor) {
                 donor.donations.push({
                     date: new Date(),
                     hospitalName: request.hospitalName,
                     status: 'Completed'
                 });
                 await donor.save();
             }
        }

        res.json({ message: `Volunteer status updated to ${status}`, request });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Hospital: Fetch their own requests with volunteers
router.get('/my-requests/:hospitalName', async (req, res) => {
    try {
        const { hospitalName } = req.params;
        const requests = await BloodRequest.find({ hospitalName }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
