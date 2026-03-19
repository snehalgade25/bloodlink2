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

const sendVolunteerEmail = async (hospitalEmail, bloodGroup, donorName, donorContact) => {
    try {
        const transporter = await getTransporter();

        const mailOptions = {
            from: `"BloodLink Notification" <volunteer@bloodlink.org>`,
            to: hospitalEmail,
            subject: `❤️ New Volunteer for ${bloodGroup} Blood Request`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px;">
                    <h2 style="color: #059669;">New Volunteer Spotted!</h2>
                    <p>Hello Team,</p>
                    <p>A new donor has just volunteered to help with your <strong>${bloodGroup}</strong> emergency request.</p>
                    <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Donor Name:</strong> ${donorName}</p>
                        <p style="margin: 0;"><strong>Blood Group:</strong> ${bloodGroup}</p>
                        <p style="margin: 0;"><strong>Donor Contact:</strong> ${donorContact}</p>
                    </div>
                    <p>Please check your <strong>Volunteers</strong> tab in the portal to accept this offer.</p>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                        This is an automated notification from BloodLink.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Volunteer notification email sent to hospital: ${hospitalEmail}`);

    } catch (err) {
        console.error('Volunteer Email Error:', err.message);
    }
};

const sendAcceptanceEmail = async (donorEmail, donorName, hospitalName, bloodGroup) => {
    try {
        const transporter = await getTransporter();

        const mailOptions = {
            from: `"BloodLink" <notify@bloodlink.org>`,
            to: donorEmail,
            subject: `✅ Your Volunteer Request Has Been Accepted!`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px;">
                    <h2 style="color: #059669;">You've Been Accepted! 🎉</h2>
                    <p>Dear <strong>${donorName}</strong>,</p>
                    <p>Great news! <strong>${hospitalName}</strong> has accepted your volunteer offer for their <strong>${bloodGroup}</strong> blood request.</p>
                    <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Hospital:</strong> ${hospitalName}</p>
                        <p style="margin: 0;"><strong>Blood Group Needed:</strong> ${bloodGroup}</p>
                        <p style="margin: 0;"><strong>Status:</strong> Accepted ✅</p>
                    </div>
                    <p>Please contact the hospital or visit their facility at your earliest convenience to complete the donation.</p>
                    <p style="color: #dc2626; font-weight: bold;">Thank you for being a lifesaver! ❤️</p>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                        This is an automated notification from BloodLink.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Acceptance email sent to donor: ${donorEmail}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) console.log(`📩 Preview: ${previewUrl}`);

    } catch (err) {
        console.error('Acceptance Email Error:', err.message);
    }
};

const sendCertificateEmail = async (donorEmail, donorName, hospitalName, donationDate, bloodGroup) => {
    try {
        const transporter = await getTransporter();
        const formattedDate = new Date(donationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const mailOptions = {
            from: `"BloodLink Certificates" <certificates@bloodlink.org>`,
            to: donorEmail,
            subject: `🏆 Certificate of Appreciation - Blood Donation`,
            html: `
                <div style="font-family: Georgia, serif; max-width: 650px; margin: 0 auto; padding: 10px;">
                    <div style="border: 8px double #D4AF37; border-radius: 16px; padding: 40px; background: linear-gradient(135deg, #fffdf7 0%, #fff9e6 100%); text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                        <h1 style="font-size: 28px; color: #1a1a1a; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 5px 0;">Certificate of Appreciation</h1>
                        <p style="color: #888; font-style: italic; font-size: 14px; margin: 0 0 30px 0;">This certificate is proudly presented to</p>
                        
                        <h2 style="color: #dc2626; font-size: 32px; margin: 0 0 8px 0; border-bottom: 2px solid #fee2e2; padding-bottom: 12px; display: inline-block; min-width: 250px;">${donorName}</h2>
                        
                        <p style="color: #444; font-size: 16px; line-height: 1.8; margin: 30px 20px;">
                            In recognition of your generous life-saving <strong>${bloodGroup}</strong> blood donation on 
                            <strong>${formattedDate}</strong> at <strong>${hospitalName}</strong>.
                        </p>
                        <p style="color: #555; font-size: 15px; margin: 10px 0 40px 0;">
                            Your selflessness brings hope and healing to those in need.
                        </p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding: 0 30px;">
                            <div style="text-align: center; flex: 1;">
                                <div style="border-bottom: 1px solid #999; width: 120px; margin: 0 auto 8px auto;"></div>
                                <p style="color: #888; font-size: 11px; margin: 0;">Authorized Signature</p>
                            </div>
                            <div style="text-align: center; flex: 1;">
                                <div style="width: 70px; height: 70px; border: 3px solid #D4AF37; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; transform: rotate(12deg);">
                                    <span style="color: #D4AF37; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">OFFICIAL<br>SEAL</span>
                                </div>
                            </div>
                            <div style="text-align: center; flex: 1;">
                                <div style="border-bottom: 1px solid #999; width: 120px; margin: 0 auto 8px auto; font-weight: bold; color: #333;">${formattedDate}</div>
                                <p style="color: #888; font-size: 11px; margin: 0;">Date</p>
                            </div>
                        </div>
                    </div>
                    <p style="text-align: center; color: #999; font-size: 11px; margin-top: 20px; font-family: Arial, sans-serif;">
                        This certificate was automatically generated by BloodLink. Thank you for saving lives! ❤️
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Certificate email sent to donor: ${donorEmail}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) console.log(`📩 Certificate Preview: ${previewUrl}`);

    } catch (err) {
        console.error('Certificate Email Error:', err.message);
    }
};

const sendHospitalResponseEmail = async (to, bloodGroup, supplyingHospitalName, supplyingHospitalContact) => {
    try {
        const transporter = await getTransporter();

        const mailOptions = {
            from: `"BloodLink Network" <support@bloodlink.org>`,
            to: to,
            subject: `🚨 Inter-Hospital Support: ${bloodGroup} from ${supplyingHospitalName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px;">
                    <h2 style="color: #4f46e5;">Urgent Support Response</h2>
                    <p>Hello Team,</p>
                    <p>Good news! <strong>${supplyingHospitalName}</strong> has just responded to your request for <strong>${bloodGroup}</strong>.</p>
                    <div style="background-color: #f5f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Supplying Facility:</strong> ${supplyingHospitalName}</p>
                        <p style="margin: 0;"><strong>Requirement:</strong> ${bloodGroup}</p>
                        <p style="margin: 0;"><strong>Direct Contact:</strong> ${supplyingHospitalContact}</p>
                    </div>
                    <p>Please use the contact information above to coordinate the transfer units immediately.</p>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                        This is an automated inter-hospital notification from BloodLink.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Hospital Support Email sent to: ${to}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) console.log(`📩 VIEW NETWORK RESPONSE HERE: ${previewUrl}`);

    } catch (err) {
        console.error('Hospital Response Email Error:', err.message);
    }
};



const sendPriorityCardEmail = async (donorEmail, holderName, hospitalName, tier, cardNumber, discount, donationCount, bloodGroup) => {
    try {
        const transporter = await getTransporter();

        const tierColors = {
            'Silver': { bg: '#94A3B8', accent: '#CBD5E1', dark: '#64748B' },
            'Gold': { bg: '#EAB308', accent: '#F97316', dark: '#C2410C' },
            'Elite': { bg: '#F59E0B', accent: '#D97706', dark: '#92400E' }
        };
        const colors = tierColors[tier] || tierColors['Silver'];
        const tierIcon = tier === 'Elite' ? '👑' : tier === 'Gold' ? '⭐' : '🥈';

        const mailOptions = {
            from: `"BloodLink Cards" <cards@bloodlink.org>`,
            to: donorEmail,
            subject: `🎴 Your ${tier} Priority Card - BloodLink`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1a1a1a; margin-bottom: 5px;">Your Priority Card is Ready! ${tierIcon}</h2>
                    <p style="color: #888; font-size: 14px;">Thank you for being a lifesaver, ${holderName}.</p>
                    
                    <!-- Card -->
                    <div style="border-radius: 16px; padding: 28px; color: white; margin: 20px 0; position: relative; overflow: hidden; background: linear-gradient(135deg, ${colors.bg}, ${colors.accent}, ${colors.dark});">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                            <div>
                                <p style="opacity: 0.7; font-size: 9px; text-transform: uppercase; letter-spacing: 3px; margin: 0;">BLOODLINK · Priority Donor</p>
                                <h3 style="font-size: 20px; margin: 4px 0 0 0; font-weight: 900;">${hospitalName}</h3>
                            </div>
                            <div style="text-align: right;">
                                <span style="font-size: 28px;">${tierIcon}</span>
                                <p style="opacity: 0.7; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">${tier} Tier</p>
                            </div>
                        </div>
                        
                        <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 14px; display: inline-block; margin: 12px 0;">
                            <p style="font-family: monospace; font-size: 14px; font-weight: bold; letter-spacing: 2px; margin: 0;">${cardNumber}</p>
                        </div>
                        
                        <div style="display: flex; gap: 30px; margin: 16px 0;">
                            <div>
                                <p style="opacity: 0.6; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 2px 0;">Card Holder</p>
                                <p style="font-weight: bold; font-size: 14px; margin: 0;">${holderName}</p>
                            </div>
                            <div>
                                <p style="opacity: 0.6; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 2px 0;">Blood Group</p>
                                <p style="font-weight: bold; font-size: 14px; margin: 0;">${bloodGroup}</p>
                            </div>
                            <div>
                                <p style="opacity: 0.6; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 2px 0;">Donations</p>
                                <p style="font-weight: bold; font-size: 14px; margin: 0;">${donationCount}</p>
                            </div>
                        </div>
                        
                        <div style="background: rgba(0,0,0,0.15); border-radius: 8px; padding: 10px 14px; margin-top: 12px;">
                            <p style="font-size: 10px; font-weight: bold; margin: 0; text-align: center;">✦ ${discount} Discount on Emergency Services  ·  Priority Treatment  ·  Fast-Track Access</p>
                        </div>
                    </div>
                    
                    <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-top: 16px; border: 1px solid #e5e7eb;">
                        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #374151;">Card Benefits:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 13px; line-height: 1.8;">
                            <li><strong>${discount} discount</strong> on hospital services</li>
                            <li>Priority treatment during emergencies</li>
                            <li>Fast-track access at the hospital</li>
                            <li>Unique verification number for anti-fraud</li>
                        </ul>
                    </div>
                    
                    <p style="color: #9ca3af; font-size: 11px; margin-top: 20px; text-align: center;">
                        Present this card at ${hospitalName} for priority benefits. Card No: ${cardNumber}
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Priority card email sent to: ${donorEmail}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) console.log(`📩 Card Email Preview: ${previewUrl}`);

    } catch (err) {
        console.error('Priority Card Email Error:', err.message);
    }
};

module.exports = { 
    sendEmergencyEmail, 
    sendVolunteerEmail, 
    sendHospitalResponseEmail, 
    sendAcceptanceEmail, 
    sendCertificateEmail, 
    sendPriorityCardEmail 
};
