const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ['DONOR', 'HOSPITAL', 'ADMIN'], default: 'DONOR' }
});

module.exports = mongoose.model('User', UserSchema);
