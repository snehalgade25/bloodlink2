const dns = require('dns');
dns.setServers(['8.8.8.8']);
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const users = await User.find({});
        console.log('--- DATABASE USER LIST ---');
        console.log('Database Name:', mongoose.connection.name);
        console.log('Total Users Found:', users.length);
        users.forEach(u => {
            console.log(`- Username: ${u.username}, Role: ${u.role}`);
        });
        console.log('--------------------------');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
