const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const validator = require('validator');
const { pool } = require('../database/db');
const { validateRegistration } = require('../middleware/validation');
const { sendEmail } = require('../utils/email');

// Register page
router.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('pages/register', { title: 'Register', error: null });
});

// Register handler
router.post('/register', validateRegistration, async (req, res) => {
    const { name, email, student_id, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.query(
            'INSERT INTO users (name, email, student_id, password) VALUES ($1, $2, $3, $4)',
            [name, email, student_id, hashedPassword]
        );
        
        res.redirect('/login');
    } catch (err) {
        if (err.code === '23505') {
            res.render('pages/register', { 
                title: 'Register', 
                error: 'Email or Student ID already exists' 
            });
        } else {
            res.render('pages/register', { 
                title: 'Register', 
                error: 'Registration failed. Please try again.' 
            });
        }
    }
});

// Login page
router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('pages/login', { title: 'Login', error: null });
});

// Login handler
router.post('/login', async (req, res) => {
    const email = validator.normalizeEmail(String(req.body.email || '').trim()) || '';
    const { password } = req.body;
    
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.render('pages/login', { title: 'Login', error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password);
        
        if (!valid) {
            return res.render('pages/login', { title: 'Login', error: 'Invalid credentials' });
        }
        
        req.session.regenerate((sessionErr) => {
            if (sessionErr) {
                return res.render('pages/login', { title: 'Login', error: 'Login failed' });
            }

            delete user.password;
            req.session.user = user;
            res.redirect('/');
        });
    } catch (err) {
        res.render('pages/login', { title: 'Login', error: 'Login failed' });
    }
});

router.get('/forgot-password', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('pages/forgot-password', { title: 'Forgot Password', error: null, success: null });
});

router.post('/forgot-password', async (req, res) => {
    const email = validator.normalizeEmail(String(req.body.email || '').trim()) || '';
    const successMessage = 'If that email exists, a reset link has been sent.';

    if (!email) {
        return res.render('pages/forgot-password', {
            title: 'Forgot Password',
            error: 'Email is required',
            success: null
        });
    }

    try {
        const result = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            const token = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

            await pool.query(
                'UPDATE users SET reset_token_hash = $1, reset_token_expires_at = $2 WHERE id = $3',
                [tokenHash, expiresAt, result.rows[0].id]
            );

            const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
            const sent = await sendEmail(
                result.rows[0].email,
                'Reset your ACT Marketplace password',
                `<p>Use this link within 1 hour to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
            );

            if (!sent && process.env.NODE_ENV !== 'production') {
                console.log(`Password reset link for ${email}: ${resetUrl}`);
            }
        }

        res.render('pages/forgot-password', {
            title: 'Forgot Password',
            error: null,
            success: successMessage
        });
    } catch (err) {
        res.render('pages/forgot-password', {
            title: 'Forgot Password',
            error: 'Could not start password reset',
            success: null
        });
    }
});

router.get('/reset-password/:token', async (req, res) => {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

    try {
        const result = await pool.query(
            'SELECT id FROM users WHERE reset_token_hash = $1 AND reset_token_expires_at > NOW()',
            [tokenHash]
        );

        if (result.rows.length === 0) {
            return res.status(400).render('pages/reset-password', {
                title: 'Reset Password',
                token: null,
                error: 'Reset link is invalid or expired',
                success: null
            });
        }

        res.render('pages/reset-password', {
            title: 'Reset Password',
            token: req.params.token,
            error: null,
            success: null
        });
    } catch (err) {
        res.status(500).render('pages/reset-password', {
            title: 'Reset Password',
            token: null,
            error: 'Could not load reset form',
            success: null
        });
    }
});

router.post('/reset-password/:token', async (req, res) => {
    const { password, confirm_password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

    if (!password || password.length < 8 || password !== confirm_password) {
        return res.render('pages/reset-password', {
            title: 'Reset Password',
            token: req.params.token,
            error: 'Passwords must match and be at least 8 characters',
            success: null
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `UPDATE users
             SET password = $1, reset_token_hash = NULL, reset_token_expires_at = NULL
             WHERE reset_token_hash = $2 AND reset_token_expires_at > NOW()
             RETURNING id`,
            [hashedPassword, tokenHash]
        );

        if (result.rows.length === 0) {
            return res.status(400).render('pages/reset-password', {
                title: 'Reset Password',
                token: null,
                error: 'Reset link is invalid or expired',
                success: null
            });
        }

        res.render('pages/reset-password', {
            title: 'Reset Password',
            token: null,
            error: null,
            success: 'Password updated. You can now log in.'
        });
    } catch (err) {
        res.render('pages/reset-password', {
            title: 'Reset Password',
            token: req.params.token,
            error: 'Could not reset password',
            success: null
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
