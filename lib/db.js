// ==============================================================================
// Neon PostgreSQL Database Connection Manager
// Uses @neondatabase/serverless for zero-connection-pool serverless querying
// Auto-initializes tables & indexes idempotently on first connection
// ==============================================================================

const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Support all Vercel + Neon standard environment variable keys
function getDatabaseUrl() {
    return (
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL_UNPOOLED ||
        process.env.POSTGRES_URL_NON_POOLING ||
        ''
    );
}

/**
 * Check if a valid Neon database URL is configured
 */
function isConfigured() {
    const url = getDatabaseUrl();
    return Boolean(url && url.startsWith('postgres'));
}

/**
 * Returns a Neon SQL executor instance
 */
function getSql() {
    if (!isConfigured()) {
        return null;
    }
    return neon(getDatabaseUrl());
}

let tablesInitialized = false;

/**
 * Auto-creates all tables, indexes, and initial admin if they don't exist yet
 */
async function ensureTablesExist() {
    if (tablesInitialized || !isConfigured()) return;

    try {
        const sql = getSql();

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
        await sql`CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(date DESC);`;

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

        // Seed initial admin if empty
        const defaultUser = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
        const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

        const adminCheck = await sql`SELECT id FROM admins LIMIT 1;`;
        if (adminCheck.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(defaultPass, salt);
            await sql`
                INSERT INTO admins (username, password_hash)
                VALUES (${defaultUser}, ${hash})
                ON CONFLICT (username) DO NOTHING;
            `;
        }

        tablesInitialized = true;
    } catch (err) {
        console.warn('Auto-init tables notice:', err.message);
    }
}

/**
 * Executes a query with auto-table check
 */
async function query(queryText, params = []) {
    if (!isConfigured()) {
        throw new Error('DATABASE_URL is not configured.');
    }
    await ensureTablesExist();
    const sql = getSql();
    return await sql(queryText, params);
}

/**
 * Diagnostic health check for Neon connection
 */
async function checkDbConnection() {
    if (!isConfigured()) {
        return {
            connected: false,
            configured: false,
            message: 'DATABASE_URL is not configured yet',
            latencyMs: null,
            tables: []
        };
    }

    const startTime = Date.now();
    try {
        await ensureTablesExist();
        const sql = getSql();
        const result = await sql`SELECT NOW() as current_time, version() as version;`;
        const tablesResult = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `;
        const latencyMs = Date.now() - startTime;

        return {
            connected: true,
            configured: true,
            message: 'Connected to Neon PostgreSQL',
            timestamp: result[0]?.current_time,
            version: result[0]?.version,
            latencyMs,
            tables: tablesResult.map(r => r.table_name)
        };
    } catch (err) {
        return {
            connected: false,
            configured: true,
            message: `Neon connection error: ${err.message}`,
            error: err.message,
            latencyMs: Date.now() - startTime,
            tables: []
        };
    }
}

module.exports = {
    isConfigured,
    getSql,
    query,
    checkDbConnection,
    ensureTablesExist
};
