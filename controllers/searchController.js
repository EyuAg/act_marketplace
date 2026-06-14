const { pool } = require('../database/db');
const Category = require('../models/Category');

const searchController = {
    // GET /listings/search?q=...&category=...&condition=...&min=...&max=...&sort=...
    search: async (req, res) => {
        const { q = '', category = '', condition = '', min = '', max = '', sort = 'newest' } = req.query;

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        conditions.push(`l.status = 'active'`);

        if (q.trim()) {
            conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
            params.push(`%${q.trim()}%`);
            paramIndex++;
        }

        if (category) {
            conditions.push(`l.category = $${paramIndex}`);
            params.push(category);
            paramIndex++;
        }

        if (condition) {
            conditions.push(`l.condition = $${paramIndex}`);
            params.push(condition);
            paramIndex++;
        }

        if (min !== '' && !isNaN(min)) {
            conditions.push(`l.price >= $${paramIndex}`);
            params.push(parseFloat(min));
            paramIndex++;
        }

        if (max !== '' && !isNaN(max)) {
            conditions.push(`l.price <= $${paramIndex}`);
            params.push(parseFloat(max));
            paramIndex++;
        }

        const sortOptions = {
            newest:      'l.created_at DESC',
            oldest:      'l.created_at ASC',
            price_asc:   'l.price ASC',
            price_desc:  'l.price DESC',
            popular:     'l.view_count DESC'
        };
        const orderBy = sortOptions[sort] || sortOptions.newest;

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        try {
            const result = await pool.query(`
                SELECT l.*, u.name as seller_name
                FROM listings l
                JOIN users u ON l.user_id = u.id
                ${whereClause}
                ORDER BY ${orderBy}
            `, params);

            res.render('pages/search', {
                title: q ? `Results for "${q}"` : 'Search Listings',
                listings: result.rows,
                query: { q, category, condition, min, max, sort },
                categories: Category.getAll(),
                conditions: Category.getConditions(),
                resultCount: result.rows.length
            });
        } catch (err) {
            res.status(500).send('Error performing search');
        }
    }
};

module.exports = searchController;