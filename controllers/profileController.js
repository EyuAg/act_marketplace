const { pool } = require('../database/db');
const User = require('../models/User');
const Listing = require('../models/Listing');
const bcrypt = require('bcrypt');

const profileController = {
    // GET /profile — current user's own profile
    showOwn: async (req, res) => {
        try {
            const user = await User.findById(req.session.user.id);
            const listings = await Listing.findByUser(req.session.user.id);

            const savedResult = await pool.query(`
                SELECT l.*, u.name as seller_name
                FROM saved_listings s
                JOIN listings l ON s.listing_id = l.id
                JOIN users u ON l.user_id = u.id
                WHERE s.user_id = $1
                ORDER BY s.saved_at DESC
            `, [req.session.user.id]);

            res.render('pages/profile', {
                title: 'My Profile',
                profileUser: user,
                listings,
                savedListings: savedResult.rows,
                isOwn: true
            });
        } catch (err) {
            res.status(500).send('Error loading profile');
        }
    },

    // GET /profile/:id — view another user's public profile
    showPublic: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).render('pages/404', { title: 'Not Found' });

            const listings = await Listing.findByUser(req.params.id);

            res.render('pages/profile', {
                title: `${user.name}'s Profile`,
                profileUser: user,
                listings,
                savedListings: [],
                isOwn: false
            });
        } catch (err) {
            res.status(500).send('Error loading profile');
        }
    },

    // GET /profile/edit — edit profile form
    showEdit: (req, res) => {
        res.render('pages/edit-profile', {
            title: 'Edit Profile',
            user: req.session.user,
            error: null,
            success: null
        });
    },

    // POST /profile/edit — save profile changes
    update: async (req, res) => {
        const { name, email, student_id } = req.body;

        if (!name || name.trim().length < 2) {
            return res.render('pages/edit-profile', {
                title: 'Edit Profile',
                user: req.session.user,
                error: 'Name must be at least 2 characters',
                success: null
            });
        }

        try {
            const result = await pool.query(
                'UPDATE users SET name = $1, email = $2, student_id = $3 WHERE id = $4 RETURNING id, name, email, student_id, role',
                [name.trim(), email, student_id, req.session.user.id]
            );

            // Refresh session with updated data
            req.session.user = result.rows[0];

            res.render('pages/edit-profile', {
                title: 'Edit Profile',
                user: req.session.user,
                error: null,
                success: 'Profile updated successfully'
            });
        } catch (err) {
            res.render('pages/edit-profile', {
                title: 'Edit Profile',
                user: req.session.user,
                error: 'Email or Student ID already in use',
                success: null
            });
        }
    },

    // POST /profile/change-password
    changePassword: async (req, res) => {
        const { current_password, new_password, confirm_password } = req.body;

        if (new_password !== confirm_password) {
            return res.render('pages/edit-profile', {
                title: 'Edit Profile',
                user: req.session.user,
                error: 'New passwords do not match',
                success: null
            });
        }

        if (new_password.length < 6) {
            return res.render('pages/edit-profile', {
                title: 'Edit Profile',
                user: req.session.user,
                error: 'Password must be at least 6 characters',
                success: null
            });
        }

        try {
            const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.session.user.id]);
            const valid = await bcrypt.compare(current_password, result.rows[0].password);

            if (!valid) {
                return res.render('pages/edit-profile', {
                    title: 'Edit Profile',
                    user: req.session.user,
                    error: 'Current password is incorrect',
                    success: null
                });
            }

            const hashed = await bcrypt.hash(new_password, 10);
            await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.session.user.id]);

            res.render('pages/edit-profile', {
                title: 'Edit Profile',
                user: req.session.user,
                error: null,
                success: 'Password changed successfully'
            });
        } catch (err) {
            res.status(500).send('Error changing password');
        }
    },

    // POST /profile/save/:listingId — save/unsave a listing
    toggleSave: async (req, res) => {
        const { listingId } = req.params;
        const userId = req.session.user.id;

        try {
            const existing = await pool.query(
                'SELECT 1 FROM saved_listings WHERE user_id = $1 AND listing_id = $2',
                [userId, listingId]
            );

            if (existing.rows.length > 0) {
                await pool.query(
                    'DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2',
                    [userId, listingId]
                );
            } else {
                await pool.query(
                    'INSERT INTO saved_listings (user_id, listing_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [userId, listingId]
                );
            }

            res.redirect(`/listings/${listingId}`);
        } catch (err) {
            res.status(500).send('Error saving listing');
        }
    }
};

module.exports = profileController;