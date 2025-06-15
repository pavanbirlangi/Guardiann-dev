-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cognito_id VARCHAR(255) UNIQUE NOT NULL, -- Store Cognito's sub (unique identifier)
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    profile_picture_url VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    google_id TEXT UNIQUE
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    subcategories TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    display_order INTEGER DEFAULT 0
);

-- Institutions Table
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    thumbnail_url VARCHAR(255),
    gallery JSONB DEFAULT '[]',
    rating DECIMAL(3, 2) DEFAULT 0,
    contact JSONB DEFAULT '{}',
    booking_amount DECIMAL(10, 2) NOT NULL DEFAULT 2000.00,
    visiting_hours JSONB DEFAULT '[]',
    type VARCHAR(50) NOT NULL,
    starting_from DECIMAL(10, 2),
    courses JSONB DEFAULT '[]',
    infrastructure JSONB DEFAULT '[]',
    fees JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Modify Institutions Table
ALTER TABLE institutions 
    DROP COLUMN IF EXISTS country,
    DROP COLUMN IF EXISTS is_active,
    DROP COLUMN IF EXISTS type,
    DROP COLUMN IF EXISTS starting_from,
    DROP COLUMN IF EXISTS courses,
    DROP COLUMN IF EXISTS infrastructure,
    DROP COLUMN IF EXISTS fees,
    DROP COLUMN IF EXISTS gallery;

ALTER TABLE institutions
    ADD COLUMN IF NOT EXISTS type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS starting_from DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS courses JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS infrastructure JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS fees JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]';

-- Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    institution_id UUID REFERENCES institutions(id),
    status VARCHAR(20) DEFAULT 'pending',
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_id VARCHAR(255),
    notes TEXT,
    visitor_name VARCHAR(255),
    visitor_email VARCHAR(255),
    visitor_phone VARCHAR(20),
    pdf_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Modify Bookings Table
ALTER TABLE bookings
    DROP COLUMN IF EXISTS rating;

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_institutions_category ON institutions(category_id);
CREATE INDEX IF NOT EXISTS idx_institutions_city ON institutions(city);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_institution ON bookings(institution_id);

-- Create Institution Summary View
CREATE OR REPLACE VIEW institution_summary AS
SELECT 
    i.*,
    c.name as category_name,
    COUNT(DISTINCT b.id) as total_bookings
FROM institutions i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN bookings b ON i.id = b.institution_id
GROUP BY i.id, c.name;

-- Create function to generate booking ID
CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_id := 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking ID generation
DROP TRIGGER IF EXISTS generate_booking_id_trigger ON bookings;
CREATE TRIGGER generate_booking_id_trigger
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION generate_booking_id(); 

-- Drop existing tables that are no longer needed
DROP TABLE IF EXISTS institution_images CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS infrastructure CASCADE;
DROP TABLE IF EXISTS institution_fees CASCADE;
DROP TABLE IF EXISTS institution_types CASCADE; 