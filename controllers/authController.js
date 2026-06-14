const bcrypt = require('bcrypt');
const { pool } = require('../database/db');

const authController = {
    showRegister: (req, res) => {
        res.render('pages/register', { title: 'Register', error: null });
    },
    
    register: async (req, res) => {
        const { name, email, student_id, password, confirm_password } = req.body;
        
        if (password !== confirm_password) {
            return res.render('pages/register', { title: 'Register', error: 'Passwords do not match' });
        }
        
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'INSERT INTO users (name, email, student_id, password) VALUES ($1, $2, $3, $4)',
                [name, email, student_id, hashedPassword]
            );
            res.redirect('/login');
        } catch (err) {
            res.render('pages/register', { title: 'Register', error: 'Email or Student ID exists' });
        }
    },
    
    showLogin: (req, res) => {
        res.render('pages/login', { title: 'Login', error: null });
    },
    
    login: async (req, res) => {
        const { email, password } = req.body;
        
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
            
            delete user.password;
            req.session.user = user;
            res.redirect('/');
        } catch (err) {
            res.render('pages/login', { title: 'Login', error: 'Login failed' });
        }
    },
    
    logout: (req, res) => {
        req.session.destroy();
        res.redirect('/');
    }
};

module.exports = authController;