-- Initial seed data for CRM IMS

-- Insert default admin user (password: admin123 - should be hashed in production)
-- Note: In production, use bcrypt to hash passwords
INSERT INTO users (username, email, password, first_name, last_name, role, is_active) VALUES
('admin', 'admin@crmims.com', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqK', 'Admin', 'User', 'admin', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic products and devices'),
('Clothing', 'Apparel and clothing items'),
('Food & Beverages', 'Food and beverage products'),
('Furniture', 'Furniture and home decor'),
('Office Supplies', 'Office and stationery items')
ON CONFLICT (name) DO NOTHING;

-- Insert sample warehouse
INSERT INTO warehouses (name, code, address, city, state, zip_code, country, is_active) VALUES
('Main Warehouse', 'WH-001', '123 Warehouse St', 'New York', 'NY', '10001', 'USA', TRUE)
ON CONFLICT (code) DO NOTHING;

