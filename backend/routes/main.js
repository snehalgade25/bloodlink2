const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const DonationCamp = require('../models/DonationCamp');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const BloodBank = require('../models/BloodBank');
const User = require('../models/User'); // Required for emails
const { 
    sendEmergencyEmail, 
    sendVolunteerEmail, 
    sendHospitalResponseEmail, 
    sendAcceptanceEmail, 
    sendCertificateEmail, 
    sendPriorityCardEmail 
} = require('../utils/emailService');

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

// Inter-Hospital Volunteer Route (New)
router.post('/request/:id/volunteer/hospital', async (req, res) => {
    try {
        const { username } = req.body;
        const [request, hospital] = await Promise.all([
            BloodRequest.findById(req.params.id),
            Hospital.findOne({ username })
        ]);

        if (!request) return res.status(404).json({ error: 'Blood request not found.' });
        if (!hospital) return res.status(404).json({ error: 'Hospital profile not found.' });

        // 1. CHECK STABILITY (Responsible Donation)
        const total = (hospital.unitsA || 0) + (hospital.unitsB || 0) + (hospital.unitsO || 0) + (hospital.unitsAB || 0);
        const hasLow = (hospital.unitsA < 2 || hospital.unitsB < 2 || hospital.unitsO < 2 || hospital.unitsAB < 2);
        const isStable = (total >= 10 && !hasLow);

        if (!isStable) {
            return res.status(400).json({ 
                error: `Action Denied: Your hospital's stock level is currently ${total < 10 ? 'low' : 'unbalanced'}. To ensure your facility remains safe, inter-hospital donations are only permitted when your status is 'Stable'.` 
            });
        }

        const bloodGroup = request.bloodGroup;
        let updateQuery = {};
        if (bloodGroup === 'A+') {
            if (hospital.unitsA < 1) return res.status(400).json({ error: 'Insufficient A+ stock.' });
            updateQuery = { unitsA: hospital.unitsA - 1 };
        } else if (bloodGroup === 'B+') {
            if (hospital.unitsB < 1) return res.status(400).json({ error: 'Insufficient B+ stock.' });
            updateQuery = { unitsB: hospital.unitsB - 1 };
        } else if (bloodGroup === 'O+') {
            if (hospital.unitsO < 1) return res.status(400).json({ error: 'Insufficient O+ stock.' });
            updateQuery = { unitsO: hospital.unitsO - 1 };
        } else if (bloodGroup === 'AB+') {
            if (hospital.unitsAB < 1) return res.status(400).json({ error: 'Insufficient AB+ stock.' });
            updateQuery = { unitsAB: hospital.unitsAB - 1 };
        }

        // 2. Prevent duplicate volunteer
        const alreadyVolunteered = request.volunteers.some(v => v.username === username);
        if (alreadyVolunteered) return res.status(400).json({ error: 'Your hospital has already volunteered for this request.' });

        // 3. Deduction & Status Sync
        const newTotal = total - 1;
        // Recalculate status for the donating hospital
        const finalUnitsA = bloodGroup === 'A+' ? hospital.unitsA - 1 : hospital.unitsA;
        const finalUnitsB = bloodGroup === 'B+' ? hospital.unitsB - 1 : hospital.unitsB;
        const finalUnitsO = bloodGroup === 'O+' ? hospital.unitsO - 1 : hospital.unitsO;
        const finalUnitsAB = bloodGroup === 'AB+' ? hospital.unitsAB - 1 : hospital.unitsAB;
        const finalStatus = (newTotal < 10 || finalUnitsA < 2 || finalUnitsB < 2 || finalUnitsO < 2 || finalUnitsAB < 2) ? 'Critical' : 'Stable';

        await Hospital.updateOne({ username }, { 
            ...updateQuery, 
            status: finalStatus 
        });

        // 4. Register Volunteer
        request.volunteers.push({ 
            username, 
            status: 'Accepted', 
            volunteerType: 'HOSPITAL' 
        });
        await request.save();

        // 5. Notify BOTH Hospitals via Email (Requesting & Supplying)
        try {
            const [reqHospital, supUser] = await Promise.all([
                Hospital.findOne({ name: request.hospitalName }),
                User.findOne({ username })
            ]);

            if (reqHospital) {
                const reqUser = await User.findOne({ username: reqHospital.username });
                if (reqUser && reqUser.email) {
                    console.log(`[NETWORK] Notifying petitioner ${request.hospitalName} about support`);
                    sendHospitalResponseEmail(
                        reqUser.email, 
                        bloodGroup, 
                        hospital.name, 
                        hospital.contactInfo || reqUser.phone || 'Check dashboard'
                    );
                }
            }
            
            if (supUser && supUser.email) {
                console.log(`[NETWORK] Confirming support receipt to responder ${hospital.name}`);
                sendHospitalResponseEmail(
                    supUser.email, 
                    bloodGroup, 
                    request.hospitalName, 
                    request.contactInfo || 'Check dashboard'
                );
            }
        } catch (emailErr) {
            console.error('[NETWORK EMAIL ERROR]:', emailErr.message);
        }

        res.status(200).json({ message: `Successfully volunteered ${bloodGroup} support for ${request.hospitalName}!` });
    } catch (err) {
        console.error('[HOSPITAL VOLUNTEER ERROR]:', err);
        res.status(500).json({ error: err.message });
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
        const allMatchingDonors = await Donor.find({
            bloodGroup: { $regex: new RegExp(`^${bloodGroup.replace('+', '\\+')}$`, 'i') }
        });

        // Filter out donors in rest period (90 days)
        const matchingDonors = allMatchingDonors.filter(donor => {
            if (!donor.donations || donor.donations.length === 0) return true;
            const sortedDonations = [...donor.donations].sort((a, b) => new Date(b.date) - new Date(a.date));
            const lastDonation = new Date(sortedDonations[0].date);
            const bufferEnds = new Date(lastDonation.getTime() + 90 * 24 * 60 * 60 * 1000);
            return new Date() >= bufferEnds;
        });

        const usernames = matchingDonors.map(d => d.username);
        console.log(`[BROADCAST] Found ${matchingDonors.length} eligible donor profiles (excluding rest periods).`);

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

// Get all open requests (lenient check for legacy data)
router.get('/requests/all', async (req, res) => {
    try {
        const requests = await BloodRequest.find({ }).sort({ createdAt: -1 });
        console.log(`[GET] Found ${requests.length} open requests.`);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Alias for singular
router.get('/request/all', async (req, res) => {
    res.redirect('/api/requests/all');
});

// Get matching requests for a donor
router.get('/matching-requests/:bloodGroup', async (req, res) => {
    try {
        const { bloodGroup } = req.params;
        // Find matching requests (case-insensitive)
        const requests = await BloodRequest.find({
            bloodGroup: { $regex: new RegExp(`^${bloodGroup.replace(/\+/g, '\\+')}$`, 'i') },
            $or: [
                { status: { $regex: /^open$/i } },
                { status: { $exists: false } },
                { status: null }
            ]
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
        const [request, donorInDb] = await Promise.all([
            BloodRequest.findById(req.params.id),
            Donor.findOne({ username })
        ]);

        if (!request) return res.status(404).json({ error: 'Request not found' });

        let donor = donorInDb;
        if (!donor) {
            // Check if User exists and is of role DONOR
            const user = await User.findOne({ username });
            if (!user) return res.status(404).json({ error: 'User account not found' });
            if (user.role !== 'DONOR') return res.status(400).json({ error: 'Only donors can volunteer' });

            // Auto-create missing donor profile
            console.log(`[VOLUNTEER] Auto-creating missing donor profile for: ${username}`);
            donor = new Donor({
                username: user.username,
                name: user.username.split('@')[0], // Simplified
                bloodGroup: 'O+', // DEFAULT, user should update in profile
                contactInfo: user.phone || 'N/A',
                age: 18
            });
            await donor.save();
        }

        // Check buffer period (90 days)
        if (donor.donations && donor.donations.length > 0) {
            const sortedDonations = [...donor.donations].sort((a, b) => new Date(b.date) - new Date(a.date));
            const lastDonation = new Date(sortedDonations[0].date);
            const bufferEnds = new Date(lastDonation.getTime() + 90 * 24 * 60 * 60 * 1000);
            
            if (new Date() < bufferEnds) {
                const daysLeft = Math.ceil((bufferEnds - new Date()) / (1000 * 60 * 60 * 24));
                return res.status(400).json({ error: `Rest period active. You can donate again in ${daysLeft} days.` });
            }
        }

        const alreadyVolunteered = request.volunteers.some(v => v.username === username);
        if (alreadyVolunteered) return res.status(400).json({ error: 'You have already volunteered for this request' });

        request.volunteers.push({ username, status: 'Pending' });
        await request.save();

        // 1. Notify Hospital via Email (Async)
        try {
            const hospitalProfile = await Hospital.findOne({ name: request.hospitalName });
            if (hospitalProfile) {
                const hospitalUser = await User.findOne({ username: hospitalProfile.username });
                if (hospitalUser && hospitalUser.email) {
                    console.log(`[VOLUNTEER] Notifying hospital ${request.hospitalName} at ${hospitalUser.email}`);
                    sendVolunteerEmail(
                        hospitalUser.email,
                        request.bloodGroup,
                        donor.name || donor.username,
                        donor.contactInfo || 'Not specified'
                    );
                }
            }
        } catch (emailErr) {
            console.error('[VOLUNTEER EMAIL ERROR]:', emailErr.message);
        }

        res.json({ message: 'Volunteered successfully! The hospital has been notified.', request });
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

        const volunteer = request.volunteers.find(v => v.username.toLowerCase() === username.toLowerCase());
        if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });

        // Update status in the volunteer subdocument
        volunteer.status = status;
        await request.save();

        // 1. Definitive Hospital Check (Check both record metadata and User role)
        const userAccount = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
        const isHospital = volunteer.volunteerType === 'HOSPITAL' || userAccount?.role === 'HOSPITAL';
        const donorEmail = userAccount?.email || null;

        // SKIP ALL DONOR-SPECIFIC EMAILS/LOGGING IF IT'S A HOSPITAL
        if (isHospital) {
            console.log(`[HOSPITAL] Support from ${username} marked as ${status}. Skipping donor logic.`);
            return res.json({ message: `Hospital support marked as ${status}`, request });
        }

        // --- BELOW LOGIC IS FOR INDIVIDUAL DONORS ONLY ---

        // Send ACCEPTANCE email to donor
        if (status === 'Accepted' && donorEmail) {
            try {
                const donor = await Donor.findOne({ username: new RegExp(`^${username}$`, 'i') });
                console.log(`[ACCEPT] Sending acceptance email to donor ${username} at ${donorEmail}`);
                sendAcceptanceEmail(
                    donorEmail,
                    donor?.name || username,
                    request.hospitalName || 'BloodLink Hospital',
                    request.bloodGroup
                );
            } catch (emailErr) {
                console.error('[ACCEPTANCE EMAIL ERROR]:', emailErr.message);
            }
        }
        
        // If status is 'Completed', log donation + send certificate email
        if (status === 'Completed') {
             let donor = await Donor.findOne({ username: new RegExp(`^${username}$`, 'i') });
             const hospitalName = request.hospitalName || 'BloodLink Hospital';
             const donationDate = new Date();

             if (donor) {
                 donor.donations.push({
                     date: donationDate,
                     hospitalName: hospitalName,
                     status: 'Completed'
                 });
                 await donor.save();
                 console.log(`[DONATION] Logged donation for donor ${username} at ${hospitalName}`);
             } else if (userAccount) {
                 console.warn(`[DONATION] No donor profile found for ${username}, creating one...`);
                 donor = new Donor({
                     username: userAccount.username,
                     name: userAccount.username,
                     bloodGroup: request.bloodGroup || 'O+',
                     contactInfo: userAccount.phone || 'N/A',
                     age: 18,
                     donations: [{
                         date: donationDate,
                         hospitalName: hospitalName,
                         status: 'Completed'
                     }]
                 });
                 await donor.save();
                 console.log(`[DONATION] Created donor profile and logged donation for ${username}`);
             }

             // Send certificate email to donor
             if (donorEmail) {
                 try {
                     const donorName = donor?.name || username;
                     console.log(`[CERTIFICATE] Sending certificate email to donor ${username} at ${donorEmail}`);
                     sendCertificateEmail(
                         donorEmail,
                         donorName,
                         hospitalName,
                         donationDate,
                         request.bloodGroup
                     );
                 } catch (emailErr) {
                     console.error('[CERTIFICATE EMAIL ERROR]:', emailErr.message);
                 }
             }

             // Check if donor reached a new priority card tier → send card email
             try {
                const freshDonor = await Donor.findOne({ username: new RegExp(`^${username}$`, 'i') });
                if (freshDonor && freshDonor.donations && donorEmail) {
                    const hCounts = {};
                    freshDonor.donations.forEach(d => {
                        if (d.hospitalName) hCounts[d.hospitalName] = (hCounts[d.hospitalName] || 0) + 1;
                    });
                    const countAtHospital = hCounts[hospitalName] || 0;
                    const tierMilestones = { 2: 'Silver', 5: 'Gold', 8: 'Elite' };
                    const discounts = { 'Silver': '5%', 'Gold': '10%', 'Elite': '15%' };
                    
                    if (tierMilestones[countAtHospital]) {
                        const newTier = tierMilestones[countAtHospital];
                        // Generate card number (same algo as frontend)
                        let hash = 0;
                        const str = `${username}-${hospitalName}-BLOODLINK`;
                        for (let i = 0; i < str.length; i++) {
                            hash = ((hash << 5) - hash) + str.charCodeAt(i);
                            hash = hash & hash;
                        }
                        const num = Math.abs(hash);
                        const p1 = String(num).slice(0, 4).padStart(4, '0');
                        const p2 = String(num).slice(4, 8).padStart(4, '0');
                        const p3 = String(num).slice(8, 12).padStart(4, '0');
                        const check = (parseInt(p1) + parseInt(p2) + parseInt(p3)) % 97;
                        const cardNumber = `BL-${p1}-${p2}-${p3}-${String(check).padStart(2, '0')}`;

                        console.log(`[CARD] Donor ${username} unlocked ${newTier} at ${hospitalName}! Sending card email...`);
                        sendPriorityCardEmail(
                            donorEmail,
                            freshDonor.name || username,
                            hospitalName,
                            newTier,
                            cardNumber,
                            discounts[newTier],
                            countAtHospital,
                            freshDonor.bloodGroup || request.bloodGroup
                        );
                    }
                }
             } catch (cardErr) {
                 console.error('[CARD EMAIL ERROR]:', cardErr.message);
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

// Admin: Update request status
router.patch('/admin/request/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const request = await BloodRequest.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json({ message: `Request marked as ${status}`, request });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Delete a camp
router.delete('/admin/camps/:id', async (req, res) => {
    try {
        const camp = await DonationCamp.findByIdAndDelete(req.params.id);
        if (!camp) return res.status(404).json({ error: 'Camp not found' });
        res.json({ message: 'Camp deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

