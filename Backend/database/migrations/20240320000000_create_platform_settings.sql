-- Create platform_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS platform_settings (
    id SERIAL PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    site_description TEXT,
    contact_email VARCHAR(255),
    support_phone VARCHAR(50),
    address JSONB DEFAULT '{
        "street": "",
        "city": "",
        "state": "",
        "country": "India",
        "pincode": ""
    }',
    social_media JSONB DEFAULT '{
        "facebook": "",
        "twitter": "",
        "instagram": "",
        "linkedin": ""
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings if no settings exist
INSERT INTO platform_settings (site_name, site_description, contact_email, support_phone)
SELECT 
    'Guardiann',
    'Your trusted partner in finding the perfect educational institution',
    'admin@guardiann.com',
    '+91 98765 43210'
WHERE NOT EXISTS (
    SELECT 1 FROM platform_settings
); 