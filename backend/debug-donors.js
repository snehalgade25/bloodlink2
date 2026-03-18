const mongoose = require('mongoose');
const Donor = require('./models/Donor');
const User = require('./models/User');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({ role: 'DONOR' });
    const donors = await Donor.find({});

    console.log('--- DONOR USERS ---');
    users.forEach(u => console.log(`User: ${u.username}, Email: ${u.email}`));

    console.log('\n--- DONOR PROFILES ---');
    donors.forEach(d => console.log(`Donor: ${d.name}, Group: ${d.bloodGroup}, Username: ${d.username}`));

    process.exit(0);
}

check();
