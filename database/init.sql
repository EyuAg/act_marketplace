-- Drop existing tables if they exist
DROP TABLE IF EXISTS saved_listings CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    reset_token_hash VARCHAR(64),
    reset_token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create listings table
CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    condition VARCHAR(20),
    image_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create saved listings table
CREATE TABLE saved_listings (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, listing_id)
);

-- Create messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    from_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_status_created_at ON listings(status, created_at DESC);
CREATE INDEX idx_listings_user_created_at ON listings(user_id, created_at DESC);
CREATE INDEX idx_messages_to_user ON messages(to_user_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_conversation ON messages(listing_id, from_user_id, to_user_id, created_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_reset_token_hash ON users(reset_token_hash);

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, student_id, password, role) 
VALUES ('Admin', 'admin@act.edu', 'ADMIN001', '$2b$10$wnsH5c6oGcL18TqMhHox/ObWUdXzt2JJuGJ744qBObDzhOhmDs406', 'admin')
ON CONFLICT (email) DO NOTHING;
