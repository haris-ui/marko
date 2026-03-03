const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send an email with new credentials
 * @param {string} to - Recipient email
 * @param {string} name - Student name
 * @param {string} rollNumber - Student roll number
 * @param {string} newPassword - The auto-generated password
 */
const sendCredentialsEmail = async (to, name, rollNumber, newPassword) => {
    if (!to) {
        console.warn(`[Email] No email provided for ${rollNumber}, skipping email notification.`);
        return;
    }

    const mailOptions = {
        from: `"Marks Portal" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Your New Marks Portal Credentials',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4F46E5;">Marks Portal Credentials</h2>
                <p>Hello ${name},</p>
                <p>Your password has been reset. Please use the following credentials to log in to your dashboard:</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Roll Number:</strong> ${rollNumber}</p>
                    <p><strong>New Password:</strong> <code style="background: #eee; padding: 2px 5px; border-radius: 3px;">${newPassword}</code></p>
                </div>
                <p>We recommend changing your password after logging in for the first time.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.875rem; color: #666;">This is an automated message, please do not reply.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Credentials sent to ${to}`);
    } catch (error) {
        console.error(`[Email] Failed to send email to ${to}:`, error.message);
        throw new Error('Failed to send email notification');
    }
};

module.exports = {
    sendCredentialsEmail,
};
