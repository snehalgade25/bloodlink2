const mongoose = require('mongoose');

const BloodRequestSchema = new mongoose.Schema({
    bloodGroup: { type: String, required: true },
    contactInfo: { type: String, required: true },
    hospitalName: { type: String },
    location: { type: String },
    reason: { type: String },
    status: { type: String, default: 'Open' },
    volunteers: [{
        username: { type: String, required: true },
        status: { type: String, enum: ['Pending', 'Accepted', 'Completed', 'Rejected'], default: 'Pending' },
        registeredAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);
