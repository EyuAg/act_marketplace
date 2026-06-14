const { pool } = require('../database/db');

// Check if user is logged in
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// Check if user is admin
function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).render('pages/403', { 
            title: 'Access Denied',
            message: 'Admin privileges required'
        });
    }
    next();
}

// Check if user owns the listing
async function requireListingOwner(req, res, next) {
    const listingId = req.params.id;
    const user = req.session.user;
    
    if (!user) return res.redirect('/login');
    
    try {
        const result = await pool.query('SELECT user_id FROM listings WHERE id = $1', [listingId]);
        
        if (result.rows.length === 0) {
            return res.status(404).render('pages/404', { title: 'Not Found' });
        }
        
        if (result.rows[0].user_id !== user.id && user.role !== 'admin') {
            return res.status(403).render('pages/403', { title: 'Access Denied' });
        }
        
        next();
    } catch (err) {
        res.status(500).send('Server error');
    }
}

// Make user data available to all views
async function loadUserData(req, res, next) {
    res.locals.user = req.session.user || null;
    res.locals.isAdmin = req.session.user?.role === 'admin';
    
    if (req.session.user) {
        try {
            const result = await pool.query('SELECT COUNT(*) FROM messages WHERE to_user_id = $1 AND is_read = false', [req.session.user.id]);
            res.locals.unreadCount = parseInt(result.rows[0].count);
        } catch (err) {
            res.locals.unreadCount = 0;
        }
    }
    next();
}

module.exports = { requireLogin, requireAdmin, requireListingOwner, loadUserData };