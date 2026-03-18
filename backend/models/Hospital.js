const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
    username: { type: String, required: true }, // Links to User account
    name: { type: String, required: true },
    location: { type: String, required: true },
    unitsA: { type: Number, default: 0 },
    unitsB: { type: Number, default: 0 },
    unitsO: { type: Number, default: 0 },
    unitsAB: { type: Number, default: 0 },
    status: { type: String, enum: ['Stable', 'Critical'], default: 'Stable' }
});

module.exports = mongoose.model('Hospital', HospitalSchema);
