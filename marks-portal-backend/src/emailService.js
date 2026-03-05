const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendCredentialsEmail(to, name, roll_number, password) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ EMAIL_USER or EMAIL_PASS not set. Skipping email send.');
        return;
    }

    const mailOptions = {
        from: `"Student Portal Admin" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Student Portal Credentials',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #4f46e5; text-align: center;">Welcome to the Student Marks Portal</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>An account has been created for you or your password has been reset. Here are your credentials:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Roll Number:</strong> <span style="font-family: monospace; font-size: 16px;">${roll_number}</span></p>
                    <p style="margin: 5px 0;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 16px;">${password}</span></p>
                </div>
                <p>Please log in using these credentials. We recommend changing your password after your first login.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 12px; color: #64748b; text-align: center;">This is an automated message. Please do not reply to this email.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
}

module.exports = { sendCredentialsEmail };
