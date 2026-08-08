// ==============================================================================
// Database Schema Initialization Script
// Creates all tables, indexes, and initial admin credentials in Neon PostgreSQL
// Run with: npm run db:init
// ==============================================================================

const { isConfigured, getSql } = require('../lib/db');
const { hashPassword } = require('../lib/auth');
require('dotenv').config();

async function initDatabase() {
    console.log('------------------------------------------------------------');
    console.log('🩸 Chavali Blood Foundation - Neon Database Initialization');
    console.log('------------------------------------------------------------');

    if (!isConfigured()) {
        console.error('❌ Error: DATABASE_URL is not configured in your .env file.');
        console.error('Please create a free Neon database at https://console.neon.tech and paste your connection string in .env:');
        console.error('DATABASE_URL=postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require\n');
        process.exit(1);
    }

    const sql = getSql();

    try {
        console.log('⏳ Connecting to Neon PostgreSQL...');
        const [ping] = await sql`SELECT current_database() as db_name, version() as pg_version;`;
        console.log(`✅ Connected successfully to: ${ping.db_name}`);
        console.log(`📦 PostgreSQL Version: ${ping.pg_version.split(',')[0]}\n`);

        console.log('🔨 Creating tables & indexes...');

        // 1. Admins Table
        await sql`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log('  ✓ Table created: admins');

        // 2. Donors Table
        await sql`
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
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON donors(blood_group);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donors_mobile ON donors(mobile);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donors_registered_at ON donors(registered_at DESC);`;
        console.log('  ✓ Table & Indexes created: donors');

        // 3. Donations Table
        await sql`
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
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_donations_phone ON donations(donor_phone);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donations_blood ON donations(blood_group);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(date DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donations_added_at ON donations(added_at DESC);`;
        console.log('  ✓ Table & Indexes created: donations');

        // 4. Gallery Table
        await sql`
            CREATE TABLE IF NOT EXISTS gallery (
                id BIGSERIAL PRIMARY KEY,
                caption TEXT,
                image_data TEXT NOT NULL,
                category VARCHAR(50) DEFAULT 'general',
                uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_gallery_uploaded_at ON gallery(uploaded_at DESC);`;
        console.log('  ✓ Table & Indexes created: gallery');

        // 5. Certificates Table
        await sql`
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
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_certificates_generated_at ON certificates(generated_at DESC);`;
        console.log('  ✓ Table & Indexes created: certificates');

        // 6. Contact Messages Table
        await sql`
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
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_messages(created_at DESC);`;
        console.log('  ✓ Table & Indexes created: contact_messages');

        // Seed default Admin user if none exists
        const adminUsername = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

        const existingAdmin = await sql`SELECT id FROM admins WHERE username = ${adminUsername};`;
        if (existingAdmin.length === 0) {
            const passwordHash = await hashPassword(adminPassword);
            await sql`
                INSERT INTO admins (username, password_hash)
                VALUES (${adminUsername}, ${passwordHash});
            `;
            console.log(`\n👑 Initial admin created: "${adminUsername}" with password "${adminPassword}"`);
        } else {
            console.log(`\n👑 Admin user "${adminUsername}" already exists.`);
        }

        console.log('\n✨ Database initialization completed successfully!');
        console.log('------------------------------------------------------------\n');
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase };
