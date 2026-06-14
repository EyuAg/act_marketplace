-- Sample data for testing
\c act_marketplace;

-- Insert sample users (password: test123 for all)
INSERT INTO users (name, email, student_id, password) VALUES
('John Doe', 'eyoel_kassa@act.edu', '155/BSC-B6/2023', '$2b$10$YKxkg9cEXrLuwoRABP5waeFqZTxgDO9NeZ6jZR9aHvD0ti8shFcK2'),
('Jane Smith', 'athrons_abiy@act.edu', '156/BSC-B6/2023', '$2b$10$YKxkg9cEXrLuwoRABP5waeFqZTxgDO9NeZ6jZR9aHvD0ti8shFcK2'),
('Mike Johnson', 'kidus_getachew@act.edu', '055/BSC-B6/2023', '$2b$10$YKxkg9cEXrLuwoRABP5waeFqZTxgDO9NeZ6jZR9aHvD0ti8shFcK2')
ON CONFLICT (email) DO NOTHING;

-- Insert sample listings
INSERT INTO listings (user_id, title, description, price, category, condition) VALUES
(1, 'Calculus Textbook', 'Like new condition, no highlights', 500, 'Textbooks', 'Like New'),
(1, 'Gaming Mouse', 'RGB, barely used', 1200, 'Electronics', 'Good'),
(2, 'Desk Lamp', 'LED, adjustable brightness', 250, 'Furniture', 'Like New'),
(2, 'Python Programming Book', 'Great condition', 350, 'Textbooks', 'Good'),
(3, 'Backpack', 'Used for one semester', 400, 'Other', 'Good')
ON CONFLICT DO NOTHING;