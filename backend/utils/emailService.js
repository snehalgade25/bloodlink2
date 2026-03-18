const nodemailer = require('nodemailer');
require('dotenv').config();

const getTransporter = async () => {
    // 1. Try to use real credentials if they exist
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            // Verify connection
            await transporter.verify();
            console.log(`[EMAIL SERVICE] Successfully connected to Gmail (${process.env.EMAIL_USER})`);
            return transporter;
        } catch (err) {
            console.error(`[EMAIL SERVICE] Gmail login failed: ${err.message}`);
            console.log(`[EMAIL SERVICE] Falling back to automated Test Account...`);
        }
    }

    // 2. Fallback to temporary Ethereal account (Zero setup, works 100% for demos)
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[EMAIL SERVICE] Generated temporary test account: ${testAccount.user}`);
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
};

const sendEmergencyEmail = async (to, bloodGroup, hospitalName, location, contact) => {
    try {
        const transporter = await getTransporter();

        const mailOptions = {
            from: `"BloodLink Emergency" <emergency@bloodlink.org>`,
            to: to,
            subject: `🚨 URGENT: Blood Needed - ${bloodGroup}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px;">
                    <h2 style="color: #dc2626;">Emergency Blood Requirement</h2>
                    <p>Hello Lifesaver,</p>
                    <p>There is an <strong>urgent requirement</strong> for <strong>${bloodGroup}</strong> blood group.</p>
                    <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Hospital:</strong> ${hospitalName}</p>
                        <p style="margin: 0;"><strong>Location:</strong> ${location}</p>
                        <p style="margin: 0;"><strong>Contact:</strong> ${contact}</p>
                    </div>
                    <p>If you are eligible and available to donate, please reach out to the hospital immediately.</p>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                        This is an automated emergency broadcast from BloodLink.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Email "sent" to: ${to}`);

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`📩 VIEW YOUR BROADCAST HERE: ${previewUrl}`);
        }

    } catch (err) {
        console.error('Email Service Error:', err.message);
    }
};

module.exports = { sendEmergencyEmail };
