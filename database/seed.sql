-- ============================================
-- ACT MARKETPLACE - SAMPLE SEED DATA
-- ============================================
-- This file contains sample data for testing
-- WARNING: Passwords are hashed - real passwords are not stored in plain text
-- ============================================

-- ============================================
-- SAMPLE USERS (Without real password hashes for security)
-- Note: Actual password hashes are in your backup file
-- For testing, use the test credentials below
-- ============================================

-- Test User Account (password: test123)
INSERT INTO users (name, email, student_id, password, role) VALUES
('Test User', 'test@act.edu', 'TEST001', '$2b$10$YKxkg9cEXrLuwoRABP5waeFqZTxgDO9NeZ6jZR9aHvD0ti8shFcK2', 'user');

-- Admin Account (password: admin123)
INSERT INTO users (name, email, student_id, password, role) VALUES
('Administrator', 'admin@act.edu', 'ADMIN001', '$2b$10$QwK9Z4Lq3X5Y7W8R9T0Z1uJ2kL3mN4oP5qR6sT7uV8wX9yZ0A1bC2dE3fG4h', 'admin');

-- Sample Student Users (without passwords - they'll need to reset)
INSERT INTO users (name, email, student_id, role) VALUES
('John Student', 'john@act.edu', 'STU001', 'user'),
('Jane Student', 'jane@act.edu', 'STU002', 'user'),
('Mike Student', 'mike@act.edu', 'STU003', 'user')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- SAMPLE LISTINGS
-- ============================================

-- Textbooks
INSERT INTO listings (user_id, title, description, price, category, condition, image_url, status, view_count) VALUES
(1, 'Calculus Textbook - 5th Edition', 'Like new condition, no highlights or markings. Includes access code.', 450, 'Textbooks', 'Like New', '/uploads/calc_textbook.jpg', 'active', 15),
(1, 'Python Programming: The Complete Guide', 'Great condition, some highlighting but very useful.', 350, 'Textbooks', 'Good', '/uploads/python_book.jpg', 'active', 8),
(2, 'Data Structures and Algorithms', 'Like new, purchased but never used.', 500, 'Textbooks', 'Like New', '/uploads/dsa_book.jpg', 'active', 12);

-- Electronics
INSERT INTO listings (user_id, title, description, price, category, condition, image_url, status, view_count) VALUES
(2, 'Gaming Mouse - RGB', 'Logitech G502, barely used for 2 months. Perfect condition.', 1200, 'Electronics', 'Good', '/uploads/gaming_mouse.jpg', 'active', 25),
(3, 'Mechanical Keyboard', 'Redragon K552, blue switches, RGB backlight.', 800, 'Electronics', 'Good', '/uploads/keyboard.jpg', 'active', 18),
(1, 'Wireless Headphones', 'Sony WH-1000XM4, noise cancelling, like new.', 8500, 'Electronics', 'Like New', '/uploads/headphones.jpg', 'active', 32);

-- Furniture
INSERT INTO listings (user_id, title, description, price, category, condition, image_url, status, view_count) VALUES
(3, 'Desk Lamp', 'LED desk lamp with adjustable brightness. White color.', 250, 'Furniture', 'Like New', '/uploads/desk_lamp.jpg', 'active', 7),
(2, 'Office Chair', 'Ergonomic mesh chair, good condition.', 1800, 'Furniture', 'Good', '/uploads/chair.jpg', 'active', 14),
(1, 'Study Desk', 'Compact desk perfect for dorm room.', 2500, 'Furniture', 'Good', '/uploads/desk.jpg', 'active', 9);

-- Other items
INSERT INTO listings (user_id, title, description, price, category, condition, image_url, status, view_count) VALUES
(3, 'Backpack', 'North Face backpack, used for one semester.', 500, 'Other', 'Good', '/uploads/backpack.jpg', 'active', 11),
(1, 'Calculator', 'Texas Instruments TI-84 Plus', 1200, 'Electronics', 'Good', '/uploads/calculator.jpg', 'active', 6),
(2, 'Coffee Mug', 'ACT branded coffee mug, never used.', 150, 'Other', 'New', '/uploads/mug.jpg', 'active', 3);

-- ============================================
-- SAMPLE MESSAGES (Optional)
-- ============================================
-- Uncomment to add sample messages
/*
INSERT INTO messages (sender_id, receiver_id, listing_id, message_text, from_user_id, to_user_id) VALUES
(1, 2, 1, 'Is this still available?', 1, 2),
(2, 1, 1, 'Yes, it is still available!', 2, 1);
*/

-- ============================================
-- SAMPLE SAVED LISTINGS
-- ============================================
INSERT INTO saved_listings (user_id, listing_id) VALUES
(1, 2),
(1, 5),
(2, 1),
(3, 4)
ON CONFLICT (user_id, listing_id) DO NOTHING;

-- ============================================
-- VERIFY DATA
-- ============================================
SELECT 'Users: ' || COUNT(*) FROM users
UNION ALL
SELECT 'Listings: ' || COUNT(*) FROM listings
UNION ALL
SELECT 'Messages: ' || COUNT(*) FROM messages
UNION ALL
SELECT 'Saved Listings: ' || COUNT(*) FROM saved_listings;