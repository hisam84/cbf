// ==============================================================================
// Neon PostgreSQL Database Connection Manager (TypeScript)
// Uses @neondatabase/serverless for zero-connection-pool serverless querying
// Auto-initializes tables & indexes idempotently on first connection
// ==============================================================================

import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { DbStatus } from './types';

// Support all Vercel + Neon standard environment variable keys
export function getDatabaseUrl(): string {
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
export function isConfigured(): boolean {
  const url = getDatabaseUrl();
  return Boolean(url && url.startsWith('postgres'));
}

/**
 * Returns a Neon SQL executor instance
 */
export function getSql(): NeonQueryFunction<false, false> | null {
  if (!isConfigured()) {
    return null;
  }
  return neon(getDatabaseUrl());
}

let tablesInitialized = false;

/**
 * Auto-creates all tables, indexes, and initial admin if they don't exist yet
 */
export async function ensureTablesExist(): Promise<void> {
  if (tablesInitialized || !isConfigured()) return;

  try {
    const sql = getSql();
    if (!sql) return;

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
    await sql`CREATE INDEX IF NOT EXISTS idx_donors_registered_at ON donors(registered_at DESC);`;

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

    // 7. Organization Members Table
    await sql`
      CREATE TABLE IF NOT EXISTS members (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NOT NULL,
        mobile VARCHAR(50),
        blood_group VARCHAR(10),
        image TEXT,
        bio TEXT,
        role_type VARCHAR(50) DEFAULT 'executive',
        order_index INT DEFAULT 0,
        joined_at VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_members_order ON members(order_index ASC, created_at ASC);`;


    // Seed initial admin if empty
    const defaultUser = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
    const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

    const adminCheck = (await sql`SELECT id FROM admins LIMIT 1;`) as any[];
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
  } catch (err: any) {
    console.warn('Auto-init tables notice:', err?.message || err);
  }
}

/**
 * Diagnostic health check for Neon connection
 */
export async function checkDbConnection(): Promise<DbStatus> {
  if (!isConfigured()) {
    return {
      connected: false,
      configured: false,
      message: 'DATABASE_URL is not configured yet (Running in local mode)',
      latencyMs: null,
      tables: [],
    };
  }

  const startTime = Date.now();
  try {
    await ensureTablesExist();
    const sql = getSql();
    if (!sql) {
      return {
        connected: false,
        configured: true,
        message: 'Neon client could not be initialized',
      };
    }

    const result = (await sql`SELECT NOW() as current_time, version() as version;`) as any[];
    const tablesResult = (await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `) as any[];
    const latencyMs = Date.now() - startTime;

    return {
      connected: true,
      configured: true,
      message: 'Connected to Neon PostgreSQL',
      timestamp: result[0]?.current_time,
      version: result[0]?.version,
      latencyMs,
      tables: tablesResult.map((r) => r.table_name),
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      message: `Neon connection error: ${err.message}`,
      error: err.message,
      latencyMs: Date.now() - startTime,
      tables: [],
    };
  }
}
