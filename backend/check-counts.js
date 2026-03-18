const dns = require('dns');
dns.setServers(['8.8.8.8']);
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const DonationCamp = require('./models/DonationCamp');
const BloodRequest = require('./models/BloodRequest');
const Donor = require('./models/Donor');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const counts = {
            hospitals: await Hospital.countDocuments(),
            camps: await DonationCamp.countDocuments(),
            donors: await Donor.countDocuments(),
            requests: await BloodRequest.countDocuments()
        };
        console.log('--- COLLECTION COUNTS ---');
        console.log('Database Name:', mongoose.connection.name);
        console.log(JSON.stringify(counts, null, 2));
        console.log('--------------------------');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
