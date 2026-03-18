const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, password, email, phone, role, fullName, location } = req.body;

        // 1. Create User Account
        const user = new User({ username, password, email, phone, role });
        await user.save();

        // 2. Create Role-Specific Profile
        if (role === 'DONOR') {
            const donor = new Donor({
                username: username, // Link the account
                name: fullName || username,
                bloodGroup: req.body.bloodGroup || 'O+',
                contactInfo: phone,
                age: req.body.age || 18
            });
            await donor.save();
        } else if (role === 'HOSPITAL') {
            // Initializing with 0 stocks as requested
            const hospital = new Hospital({
                username: username,
                name: fullName || username,
                location: location || 'Thane',
                unitsA: 0,
                unitsB: 0,
                unitsO: 0,
                unitsAB: 0,
                status: 'Stable'
            });
            await hospital.save();
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (user) {
            res.json({
                user: {
                    username: user.username,
                    role: user.role,
                    email: user.email,
                    phone: user.phone
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid Username or Password' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get Hospital Stock
router.get('/my-stock/:username', async (req, res) => {
    try {
        const hospital = await Hospital.findOne({ username: req.params.username });
        if (!hospital) {
            const fallback = await Hospital.findOne({ name: req.params.username });
            if (!fallback) return res.status(404).json({ error: 'Hospital not found' });
            return res.json(fallback);
        }
        res.json(hospital);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Donor Profile
router.get('/my-profile/:username', async (req, res) => {
    try {
        const donor = await Donor.findOne({ username: req.params.username });
        if (!donor) return res.status(404).json({ error: 'Donor profile not found' });
        res.json(donor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Hospital Stock
router.post('/update-stock', async (req, res) => {
    try {
        const { username, unitsA, unitsB, unitsO, unitsAB } = req.body;
        const hospital = await Hospital.findOneAndUpdate(
            { username: username },
            {
                unitsA: Number(unitsA),
                unitsB: Number(unitsB),
                unitsO: Number(unitsO),
                unitsAB: Number(unitsAB)
            },
            { new: true, upsert: true }
        );
        res.json({ message: 'Stock updated successfully', hospital });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin: Get all users
router.get('/admin/users', async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Delete user
router.delete('/admin/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all donors
router.get('/admin/donors', async (req, res) => {
    try {
        const donors = await Donor.find();
        res.json(donors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all hospitals
router.get('/admin/hospitals', async (req, res) => {
    try {
        const hospitals = await Hospital.find();
        res.json(hospitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
