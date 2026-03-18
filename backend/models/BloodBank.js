const mongoose = require('mongoose');

const BloodBankSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    contact: { type: String, required: true },
    unitsA: { type: Number, default: 0 },
    unitsB: { type: Number, default: 0 },
    unitsO: { type: Number, default: 0 },
    unitsAB: { type: Number, default: 0 },
    status: { type: String, enum: ['Open', 'Closed'], default: 'Open' }
});

module.exports = mongoose.model('BloodBank', BloodBankSchema);
