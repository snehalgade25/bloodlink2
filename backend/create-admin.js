/**
 * BloodLink - Create Admin User Script
 * Run this once to create an admin account:
 *   node create-admin.js
 *
 * Default credentials: admin / admin123
 */

const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ['DONOR', 'HOSPITAL', 'ADMIN'], default: 'DONOR' }
});
const User = mongoose.model('User', UserSchema);

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_EMAIL = 'admin@bloodlink.org';
const ADMIN_PHONE = '0000000000';

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const existing = await User.findOne({ username: ADMIN_USERNAME });
        if (existing) {
            if (existing.role !== 'ADMIN') {
                existing.role = 'ADMIN';
                await existing.save();
                console.log(`Updated existing user "${ADMIN_USERNAME}" to ADMIN role.`);
            } else {
                console.log(`Admin user "${ADMIN_USERNAME}" already exists.`);
            }
        } else {
            await User.create({
                username: ADMIN_USERNAME,
                password: ADMIN_PASSWORD,
                email: ADMIN_EMAIL,
                phone: ADMIN_PHONE,
                role: 'ADMIN'
            });
            console.log('------------------------------------------------');
            console.log('✅ Admin user created successfully!');
            console.log(`   Username : ${ADMIN_USERNAME}`);
            console.log(`   Password : ${ADMIN_PASSWORD}`);
            console.log('------------------------------------------------');
        }
    } catch (err) {
        console.error('Error creating admin:', err.message);
    } finally {
        mongoose.disconnect();
    }
}

createAdmin();
