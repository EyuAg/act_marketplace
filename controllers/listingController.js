const { pool } = require('../database/db');
const { uploadConfig } = require('../middleware/upload');

const listingController = {
    // Get all listings
    getAll: async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT l.*, u.name as seller_name 
                FROM listings l 
                JOIN users u ON l.user_id = u.id 
                WHERE l.status = 'active' 
                ORDER BY l.created_at DESC
            `);
            const listings = result.rows.map(r => ({
                ...r,
                images: r.image_url ? (Array.isArray(r.image_url) ? r.image_url : (() => { try { return JSON.parse(r.image_url); } catch(e){ return []; }})()) : []
            }));
            res.render('pages/listings', { title: 'Browse Listings', listings });
        } catch (err) {
            res.status(500).send('Error loading listings');
        }
    },
    
    // Get single listing
    getOne: async (req, res) => {
        try {
            await pool.query('UPDATE listings SET view_count = view_count + 1 WHERE id = $1', [req.params.id]);
            
            const result = await pool.query(`
                SELECT l.*, u.name as seller_name, u.email as seller_email 
                FROM listings l 
                JOIN users u ON l.user_id = u.id 
                WHERE l.id = $1
            `, [req.params.id]);
            
            if (result.rows.length === 0) return res.status(404).send('Not found');
            const listing = result.rows[0];
            listing.images = listing.image_url ? (Array.isArray(listing.image_url) ? listing.image_url : (() => { try { return JSON.parse(listing.image_url); } catch(e){ return []; }})()) : [];
            res.render('pages/listing-detail', { title: listing.title, listing });
        } catch (err) {
            res.status(500).send('Error loading listing');
        }
    },
    
    // Create listing
    create: async (req, res) => {
        const { title, description, price, category, condition } = req.body;
        let image_url = null;

        // support multiple file uploads from input name="images" (array) or single file "image"
        try {
            const urls = [];
            if (req.files) {
                const files = req.files.images ? (Array.isArray(req.files.images) ? req.files.images : [req.files.images]) : (req.files.image ? (Array.isArray(req.files.image) ? req.files.image : [req.files.image]) : []);
                for (const file of files) {
                    if (!file) continue;
                    const v = uploadConfig.validateFile(file);
                    if (!v.valid) continue;
                    const filename = uploadConfig.generateFilename(file.name);
                    const url = `/uploads/${filename}`;
                    await file.mv(`./public${url}`);
                    urls.push(url);
                }
            }
            if (urls.length > 0) image_url = JSON.stringify(urls);
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
            res.render('pages/create-listing', { title: 'Sell', error: 'Failed to create listing' });
        }
    },
    
    // Update listing
    update: async (req, res) => {
        const { title, description, price, category, condition } = req.body;
        
        try {
            await pool.query(
                `UPDATE listings SET title=$1, description=$2, price=$3, category=$4, condition=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6`,
                [title, description, price, category, condition, req.params.id]
            );
            res.redirect('/my-listings');
        } catch (err) {
            res.status(500).send('Error updating listing');
        }
    },
    
    // Delete listing
    delete: async (req, res) => {
        try {
            await pool.query('DELETE FROM listings WHERE id = $1', [req.params.id]);
            res.redirect('/my-listings');
        } catch (err) {
            res.status(500).send('Error deleting listing');
        }
    }

    
};

module.exports = listingController;