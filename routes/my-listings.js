const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { requireLogin, requireListingOwner } = require('../middleware/auth');
const { uploadConfig } = require('../middleware/upload');
const { validateListing } = require('../middleware/validation');
const fs = require('fs');
const path = require('path');

// My listings page
router.get('/', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM listings WHERE user_id = $1 ORDER BY created_at DESC',
            [req.session.user.id]
        );
        const listings = result.rows.map(r => ({
            ...r,
            images: r.image_url ? (Array.isArray(r.image_url) ? r.image_url : (() => { try { return JSON.parse(r.image_url); } catch(e){ return []; }})()) : []
        }));

        res.render('pages/my-listings', { 
            title: 'My Listings',
            listings
        });
    } catch (err) {
        res.status(500).send('Error loading your listings');
    }
});

// Create listing form
router.get('/create', requireLogin, (req, res) => {
    res.render('pages/create-listing', { title: 'Sell an Item', error: null });
});

// Create listing handler
router.post('/create', requireLogin, validateListing, async (req, res) => {
    const { title, description, price, category, condition } = req.body;
    let image_url = null;
    // support multiple images via input name="images"
    try {
        const urls = [];
        console.log('Received files on upload:', !!req.files, Object.keys(req.files || {}));
        if (req.files) {
            const files = req.files.images ? (Array.isArray(req.files.images) ? req.files.images : [req.files.images]) : (req.files.image ? (Array.isArray(req.files.image) ? req.files.image : [req.files.image]) : []);
            console.log('Normalized files count:', files.length);
            for (const file of files) {
                if (!file) continue;
                const validation = uploadConfig.validateFile(file);
                if (!validation.valid) {
                    console.warn('File validation failed:', file.name, validation.error);
                    continue;
                }
                const filename = uploadConfig.generateFilename(file.name);
                const url = `/uploads/${filename}`;
                await file.mv(`./public${url}`);
                console.log('Saved file to', url);
                urls.push(url);
            }
        }
        if (urls.length) image_url = JSON.stringify(urls);
    } catch (e) {
        console.error('Upload error', e);
    }
    
    try {
        await pool.query(
            `INSERT INTO listings (user_id, title, description, price, category, condition, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [req.session.user.id, title, description, price, category, condition, image_url]
        );
        
        res.redirect('/my-listings');
    } catch (err) {
        res.render('pages/create-listing', { 
            title: 'Sell an Item',
            error: 'Failed to create listing'
        });
    }
});

// Edit listing form
router.get('/edit/:id', requireLogin, requireListingOwner, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
        
        res.render('pages/edit-listing', { 
            title: 'Edit Listing',
            listing: result.rows[0],
            error: null 
        });
    } catch (err) {
        res.status(500).send('Error loading edit form');
    }
});

// Update listing
router.post('/edit/:id', requireLogin, requireListingOwner, validateListing, async (req, res) => {
    const { title, description, price, category, condition } = req.body;
    
    try {
        await pool.query(
            `UPDATE listings 
             SET title = $1, description = $2, price = $3, 
                 category = $4, condition = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6`,
            [title, description, price, category, condition, req.params.id]
        );
        
        res.redirect('/my-listings');
    } catch (err) {
        res.render('pages/edit-listing', {
            title: 'Edit Listing',
            listing: { id: req.params.id, title, description, price, category, condition },
            error: 'Failed to update listing'
        });
    }
});

// Delete listing
router.get('/delete/:id', requireLogin, requireListingOwner, async (req, res) => {
    try {
        // Delete image file if exists
        const result = await pool.query('SELECT image_url FROM listings WHERE id = $1', [req.params.id]);
        if (result.rows[0]?.image_url) {
            const imgField = result.rows[0].image_url;
            let files = [];
            if (Array.isArray(imgField)) files = imgField;
            else {
                try { const parsed = JSON.parse(imgField); files = Array.isArray(parsed) ? parsed : [imgField]; } catch(e) { files = [imgField]; }
            }
            for (const f of files) {
                const imagePath = path.join(__dirname, '../public', f);
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            }
        }
        
        await pool.query('DELETE FROM listings WHERE id = $1', [req.params.id]);
        res.redirect('/my-listings');
    } catch (err) {
        res.status(500).send('Error deleting listing');
    }
});

module.exports = router;
