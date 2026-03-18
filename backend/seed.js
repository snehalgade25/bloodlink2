const dns = require('dns');
dns.setServers(['8.8.8.8']);

const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const DonationCamp = require('./models/DonationCamp');
const BloodBank = require('./models/BloodBank');
const User = require('./models/User');
const Donor = require('./models/Donor');
require('dotenv').config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Clear existing data
        await Hospital.deleteMany({});
        await DonationCamp.deleteMany({});
        await BloodBank.deleteMany({});
        await User.deleteMany({});
        await Donor.deleteMany({});

        // Add Hospitals
        const hospitals = [
            { username: 'admin', name: 'Jupiter Hospital', location: 'Thane West', unitsA: 12, unitsB: 8, unitsO: 15, unitsAB: 5, status: 'Stable' },
            { username: 'horizon_hos', name: 'Horizon Hospital', location: 'Thane East', unitsA: 3, unitsB: 2, unitsO: 1, unitsAB: 0, status: 'Critical' },
            { username: 'bethany_hos', name: 'Bethany Hospital', location: 'Pokharan Road', unitsA: 10, unitsB: 12, unitsO: 8, unitsAB: 4, status: 'Stable' },
            { username: 'kaushalya_hos', name: 'Kaushalya Hospital', location: 'Panchpakhadi', unitsA: 5, unitsB: 4, unitsO: 2, unitsAB: 1, status: 'Critical' }
        ];
        await Hospital.insertMany(hospitals);

        // Add Blood Banks
        const bloodBanks = [
            { name: 'Thane Municipal Blood Bank', location: 'Civil Hospital Campus', contact: '022-2547123', unitsA: 45, unitsB: 30, unitsO: 50, unitsAB: 20 },
            { name: 'Red Cross Society Thane', location: 'Naupada', contact: '022-2536456', unitsA: 15, unitsB: 25, unitsO: 10, unitsAB: 5 },
            { name: 'Wamanrao Oak Blood Bank', location: 'Charai, Thane', contact: '022-2544789', unitsA: 20, unitsB: 20, unitsO: 20, unitsAB: 20 }
        ];
        await BloodBank.insertMany(bloodBanks);

        // Add Camps
        const camps = [
            { name: 'Mega Blood Drive - Thane Station', date: '2024-03-20', time: '10:00 AM - 5:00 PM', venue: 'Platform 1, Thane Station' },
            { name: 'Community Donation - Vartak Nagar', date: '2024-03-25', time: '09:00 AM - 2:00 PM', venue: 'Sai Baba Temple Hall' },
            { name: 'Corporate Drive - TCS Olympus', date: '2024-04-05', time: '11:00 AM - 4:00 PM', venue: 'Building B, 4th Floor' }
        ];
        await DonationCamp.insertMany(camps);

        // Add Donors
        const donors = [
            { username: 'sanket', name: 'Sanket Gupta', bloodGroup: 'O+', age: 28, contactInfo: '9876543210' },
            { username: 'priya', name: 'Priya Sharma', bloodGroup: 'A+', age: 24, contactInfo: '9820123456' },
            { username: 'rahul', name: 'Rahul Varma', bloodGroup: 'B+', age: 31, contactInfo: '9819123456' },
            { username: 'anjali', name: 'Anjali Patil', bloodGroup: 'AB+', age: 27, contactInfo: '9821123456' },
            { username: 'vikram', name: 'Vikram Singh', bloodGroup: 'O-', age: 35, contactInfo: '9833123456' }
        ];
        await Donor.insertMany(donors);

        // Add matching User accounts so emails can be sent
        for (const d of donors) {
            await User.create({
                username: d.username,
                password: 'password123',
                email: `${d.username}@gmail.com`, // Test email
                phone: d.contactInfo,
                role: 'DONOR'
            });
        }

        // Add Default Admin
        await User.create({ username: 'admin', password: 'password123', email: 'admin@bloodlink.com', phone: '0000000000', role: 'HOSPITAL' });

        console.log('Database seeded successfully with Hospitals, Blood Banks, and Donors!');
        process.exit();
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seedData();
