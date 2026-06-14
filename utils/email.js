// Email configuration (optional - for production)
const nodemailer = require('nodemailer');

function createTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

async function sendEmail(to, subject, html) {
    try {
        const transporter = createTransporter();
        if (!transporter) {
            console.warn('Email not sent: SMTP settings are not configured');
            return false;
        }

        await transporter.sendMail({
            from: `"ACT Marketplace" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            html: html
        });
        return true;
    } catch (err) {
        console.error('Email error:', err);
        return false;
    }
}

module.exports = { sendEmail };
