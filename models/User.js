const { pool } = require('../database/db');
const bcrypt = require('bcrypt');

class User {
    static async create(userData) {
        const { name, email, student_id, password } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            'INSERT INTO users (name, email, student_id, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email, student_id, role',
            [name, email, student_id, hashedPassword]
        );
        
        return result.rows[0];
    }
    
    static async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }
    
    static async findById(id) {
        const result = await pool.query('SELECT id, name, email, student_id, role, created_at FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }
    
    static async validatePassword(user, password) {
        return await bcrypt.compare(password, user.password);
    }
    
    static async updateRole(userId, role) {
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
    }
    
    static async delete(id) {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
    }
    
    static async getAll() {
        const result = await pool.query('SELECT id, name, email, student_id, role, created_at FROM users ORDER BY created_at DESC');
        return result.rows;
    }
}

module.exports = User;