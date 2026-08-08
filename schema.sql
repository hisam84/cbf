-- ==============================================================================
-- Chavali Blood Foundation (চাঁভালি রক্ত ফাউন্ডেশন) - Database Schema
-- Target: PostgreSQL / Neon Serverless Postgres
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Admins Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. Donors Table (রক্তদাতা তালিকা)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    last_donation VARCHAR(50),
    gender VARCHAR(20),
    dob VARCHAR(50),
    registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast searching and filtering
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_mobile ON donors(mobile);
CREATE INDEX IF NOT EXISTS idx_donors_registered_at ON donors(registered_at DESC);

-- ------------------------------------------------------------------------------
-- 3. Donations Table (সাম্প্রতিক রক্তদান ও রেকর্ড)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donations (
    id BIGSERIAL PRIMARY KEY,
    donor_name VARCHAR(255) NOT NULL,
    donor_phone VARCHAR(50) NOT NULL,
    donor_address TEXT NOT NULL,
    number VARCHAR(50) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    date VARCHAR(50) NOT NULL,
    image TEXT,
    notes TEXT,
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for donation queries and slider
CREATE INDEX IF NOT EXISTS idx_donations_phone ON donations(donor_phone);
CREATE INDEX IF NOT EXISTS idx_donations_blood ON donations(blood_group);
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(date DESC);
CREATE INDEX IF NOT EXISTS idx_donations_added_at ON donations(added_at DESC);

-- ------------------------------------------------------------------------------
-- 4. Gallery Table (ছবি গ্যালারি)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery (
    id BIGSERIAL PRIMARY KEY,
    caption TEXT,
    image_data TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gallery_uploaded_at ON gallery(uploaded_at DESC);

-- ------------------------------------------------------------------------------
-- 5. Certificates Table (প্রশংসাপত্র রেকর্ড)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
    id BIGSERIAL PRIMARY KEY,
    donation_id BIGINT,
    donor_name VARCHAR(255) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    donation_date VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    donation_number VARCHAR(50),
    message TEXT,
    html_content TEXT,
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certificates_generated_at ON certificates(generated_at DESC);

-- ------------------------------------------------------------------------------
-- 6. Contact Messages Table (যোগাযোগ বার্তা)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_messages(created_at DESC);
