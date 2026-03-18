const dns = require('dns');
dns.setServers(['8.8.8.8']);
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const User = require('./models/User');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({ role: 'HOSPITAL' });
    const hospitals = await Hospital.find({});

    console.log('--- HOSPITAL USERS ---');
    users.forEach(u => console.log(`User: ${u.username}, Email: ${u.email}`));

    console.log('\n--- HOSPITAL PROFILES ---');
    hospitals.forEach(h => console.log(`Hospital: ${h.name}, Location: ${h.location}`));

    process.exit(0);
}

check();
