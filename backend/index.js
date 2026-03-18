const dns = require('dns');
dns.setServers(['8.8.8.8']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const mainRoutes = require('./routes/main');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Routes
app.get('/', (req, res) => res.send('BloodLink API is running...'));
app.use('/api/auth', authRoutes);
app.use('/api', mainRoutes);

// MongoDB Connection
const uri = process.env.MONGODB_URI;
const maskedUri = uri ? uri.replace(/:([^@]+)@/, ":****@") : "UNDEFINED";

mongoose.connect(uri)
    .then(() => {
        console.log('------------------------------------------------');
        console.log('Connected to MongoDB!');
        console.log('DB Name:', mongoose.connection.name);
        console.log('Connection URI:', maskedUri);
        console.log('------------------------------------------------');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
    });
