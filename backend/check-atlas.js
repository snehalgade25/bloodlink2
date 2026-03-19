const mongoose = require('mongoose');
const User = require('./models/User');
const Donor = require('./models/Donor');
const BloodRequest = require('./models/BloodRequest');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB Atlas!");
        
        const username = "Snehal";
        
        const [user, donor] = await Promise.all([
            User.findOne({ username }),
            Donor.findOne({ username })
        ]);
        
        console.log(`Checking user: "${username}"`);
        console.log("User Account exists:", !!user);
        if (user) console.log("User Role:", user.role);
        
        console.log("Donor Profile exists:", !!donor);
        
        const requests = await BloodRequest.find({ "volunteers.username": username });
        console.log(`Requests where "${username}" has volunteered:`, requests.length);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
