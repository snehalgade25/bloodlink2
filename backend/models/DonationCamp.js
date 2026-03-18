const mongoose = require('mongoose');

const DonationCampSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    venue: { type: String, required: true },
    organizer: { type: String }, // Hospital name or username
    registeredDonors: [{ type: String }] // Array of donor usernames
});

module.exports = mongoose.model('DonationCamp', DonationCampSchema);
