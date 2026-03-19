const mongoose = require('mongoose');
const BloodRequest = require('./models/BloodRequest');
require('dotenv').config();

const MONGO_URI = "mongodb://localhost:27017/bloodlink"; // Adjust if needed

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");
        
        const requests = await BloodRequest.find({});
        console.log(`Total requests: ${requests.length}`);
        
        requests.forEach(r => {
            if (r.volunteers && r.volunteers.length > 0) {
                console.log(`Request ${r._id} for ${r.bloodGroup} at ${r.hospitalName} has volunteers:`, r.volunteers);
            }
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
