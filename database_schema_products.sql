-- ============================================
-- Mars Rover Admin - Products Database Schema
-- For Supabase (PostgreSQL)
-- ============================================
-- 
-- INSTRUCTIONS FOR SUPABASE:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire SQL script
-- 5. Click "Run" to execute
--
-- ============================================

-- Drop existing table if you want to recreate it
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE IF NOT EXISTS products (
  -- Primary identification
  id VARCHAR(255) PRIMARY KEY,
  
  -- Basic product information
  name VARCHAR(500) NOT NULL, -- Product name (Artikelbezeichnung)
  department VARCHAR(20) NOT NULL CHECK (department IN ('pets', 'food')), -- Tiernahrung or Lebensmittel
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('standard', 'display')), -- Standard or Display
  
  -- Size/Weight information
  weight VARCHAR(255) NOT NULL, -- Weight for standard products (e.g., "150g", "1kg") or Size for displays (e.g., "120cm x 80cm")
  
  -- Content information (for displays - detailed view only)
  content TEXT, -- Comma-separated list of contents (e.g., "10x Whiskas, 5x Dreamies")
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL, -- Price in EUR
  
  -- Pallet/Packaging information
  pallet_size INTEGER, -- Units per pallet (for standard products) or sum of display contents (for displays)
  
  -- SKU / EAN
  sku VARCHAR(255), -- Stock Keeping Unit or EAN-Code
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_products_department ON products(department);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before each update
CREATE TRIGGER products_updated_at_trigger
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Sample Pets Standard Products
INSERT INTO products (id, name, department, product_type, weight, price, pallet_size, sku) VALUES
('pets-std-001', 'Whiskas Thunfisch', 'pets', 'standard', '100g', 0.69, 200, 'WHSK-TUN-100'),
('pets-std-002', 'Pedigree Rind', 'pets', 'standard', '400g', 1.49, 80, 'PEDG-BEF-400'),
('pets-std-003', 'Dreamies Katzensnacks', 'pets', 'standard', '60g', 1.99, 144, 'DREM-ORG-60');

-- Sample Pets Display
INSERT INTO products (id, name, department, product_type, weight, content, price, pallet_size, sku) VALUES
('pets-disp-001', 'Whiskas Display Groß', 'pets', 'display', '120cm x 80cm', '10x Whiskas Thunfisch, 5x Whiskas Huhn, 8x Sheba Fresh & Fine', 89.99, 23, '4008429084935');

-- Sample Food Standard Products
INSERT INTO products (id, name, department, product_type, weight, price, pallet_size) VALUES
('food-std-001', 'Mars Classic', 'food', 'standard', '51g', 1.29, 120),
('food-std-002', 'Snickers Original', 'food', 'standard', '50g', 1.29, 120),
('food-std-003', 'Twix', 'food', 'standard', '50g', 1.29, 120);

-- Sample Food Display
INSERT INTO products (id, name, department, product_type, weight, content, price, pallet_size, sku) VALUES
('food-disp-001', 'Mars Mix Display', 'food', 'display', '150cm x 100cm', '20x Mars Classic, 15x Snickers Original, 25x Twix', 149.99, 60, '5000159484091');

-- ============================================
-- Useful Queries
-- ============================================

-- Get all Pets Standard Products
-- SELECT * FROM products WHERE department = 'pets' AND product_type = 'standard' ORDER BY name;

-- Get all Food Displays
-- SELECT * FROM products WHERE department = 'food' AND product_type = 'display' ORDER BY name;

-- Get products by price range
-- SELECT * FROM products WHERE price BETWEEN 1.00 AND 2.00 ORDER BY price;

-- Count products by department and type
-- SELECT department, product_type, COUNT(*) as count
-- FROM products
-- GROUP BY department, product_type
-- ORDER BY department, product_type;

-- ============================================
-- Notes
-- ============================================
-- 
-- PRODUCT FIELDS EXPLANATION:
-- 
-- Standard Products:
--   - name: Product name from Excel Row A
--   - department: 'pets' or 'food'
--   - product_type: 'standard'
--   - weight: Weight from Excel (e.g., "150g", "1kg")
--   - content: NULL (not used for standard products)
--   - price: Price from Excel
--   - pallet_size: Units per pallet from Excel
--   - sku: Auto-generated or imported
--
-- Display Products:
--   - name: Artikelbezeichnung (user input)
--   - department: 'pets' or 'food'
--   - product_type: 'display'
--   - weight: Size field (e.g., "120cm x 80cm")
--   - content: Comma-separated list of contents (for detailed view)
--   - price: Price (user input)
--   - pallet_size: SUM of all content quantities
--   - sku: EAN-Code (user input, optional)
--
-- ============================================
