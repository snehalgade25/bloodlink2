const mongoose = require('mongoose');

const BloodRequestSchema = new mongoose.Schema({
    bloodGroup: { type: String, required: true },
    contactInfo: { type: String, required: true },
    hospitalName: { type: String },
    location: { type: String },
    reason: { type: String },
    status: { type: String, default: 'Open' }
}, { timestamps: true });

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);
