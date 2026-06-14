const { pool } = require('../database/db');
const User = require('../models/User');

const adminController = {
    // GET /admin — dashboard with summary stats
    getDashboard: async (req, res) => {
        try {
            const [usersResult, listingsResult, messagesResult, activeResult] = await Promise.all([
                pool.query('SELECT COUNT(*) FROM users'),
                pool.query('SELECT COUNT(*) FROM listings'),
                pool.query('SELECT COUNT(*) FROM messages'),
                pool.query("SELECT COUNT(*) FROM listings WHERE status = 'active'")
            ]);

            res.render('pages/admin/dashboard', {
                title: 'Admin Dashboard',
                stats: {
                    totalUsers:    parseInt(usersResult.rows[0].count),
                    totalListings: parseInt(listingsResult.rows[0].count),
                    totalMessages: parseInt(messagesResult.rows[0].count),
                    activeListings: parseInt(activeResult.rows[0].count)
                }
            });
        } catch (err) {
            res.status(500).send('Error loading dashboard');
        }
    },

    // GET /admin/users — list all users
    getUsers: async (req, res) => {
        try {
            const users = await User.getAll();
            res.render('pages/admin/users', {
                title: 'Manage Users',
                users
            });
        } catch (err) {
            res.status(500).send('Error loading users');
        }
    },

    // POST /admin/make-admin/:id — promote a user to admin
    makeAdmin: async (req, res) => {
        try {
            await User.updateRole(req.params.id, 'admin');
            res.redirect('/admin/users');
        } catch (err) {
            res.status(500).send('Error updating role');
        }
    },

    // POST /admin/remove-admin/:id — demote an admin to user
    removeAdmin: async (req, res) => {
        // Prevent self-demotion
        if (parseInt(req.params.id) === req.session.user.id) {
            return res.redirect('/admin/users');
        }
        try {
            await User.updateRole(req.params.id, 'user');
            res.redirect('/admin/users');
        } catch (err) {
            res.status(500).send('Error updating role');
        }
    },

    // POST /admin/delete-user/:id — delete a user
    deleteUser: async (req, res) => {
        // Prevent self-deletion
        if (parseInt(req.params.id) === req.session.user.id) {
            return res.redirect('/admin/users');
        }
        try {
            await User.delete(req.params.id);
            res.redirect('/admin/users');
        } catch (err) {
            res.status(500).send('Error deleting user');
        }
    },

    // GET /admin/listings — list all listings with moderation controls
    getListings: async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT l.*, u.name as seller_name
                FROM listings l
                JOIN users u ON l.user_id = u.id
                ORDER BY l.created_at DESC
            `);
            res.render('pages/admin/listings', {
                title: 'Manage Listings',
                listings: result.rows
            });
        } catch (err) {
            res.status(500).send('Error loading listings');
        }
    },

    // POST /admin/listings/:id/remove — force-remove a listing
    removeListing: async (req, res) => {
        try {
            await pool.query('DELETE FROM listings WHERE id = $1', [req.params.id]);
            res.redirect('/admin/listings');
        } catch (err) {
            res.status(500).send('Error removing listing');
        }
    },

    // POST /admin/listings/:id/toggle — toggle active/inactive status
    toggleListing: async (req, res) => {
        try {
            await pool.query(`
                UPDATE listings
                SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END
                WHERE id = $1
            `, [req.params.id]);
            res.redirect('/admin/listings');
        } catch (err) {
            res.status(500).send('Error toggling listing');
        }
    }
};

module.exports = adminController;