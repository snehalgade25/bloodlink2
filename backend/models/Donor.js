const mongoose = require('mongoose');

const DonorSchema = new mongoose.Schema({
    username: { type: String, required: true }, // Link to User account
    name: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    contactInfo: { type: String, required: true },
    age: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Donor', DonorSchema);
