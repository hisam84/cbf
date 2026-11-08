// ==============================================================================
// Neon PostgreSQL Database Connection Manager (TypeScript)
// Uses @neondatabase/serverless for zero-connection-pool serverless querying
// Auto-initializes tables & indexes idempotently on first connection
// ==============================================================================

import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { DbStatus, FacebookSettings, FacebookPostingMode } from './types';

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
        name VARCHAR(255) DEFAULT 'Admin',
        role VARCHAR(50) DEFAULT 'super_admin',
        permissions JSONB DEFAULT '["all"]',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`ALTER TABLE admins ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT 'Admin';`;
    await sql`ALTER TABLE admins ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'super_admin';`;
    await sql`ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '["all"]';`;
    await sql`ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`;

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
        monthly_fee INT DEFAULT 0,
        joined_at VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_members_order ON members(order_index ASC, created_at ASC);`;
    // Safe column addition in case table already exists
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS monthly_fee INT DEFAULT 0;`;

    // 8. Member Dues & Subscription Table
    await sql`
      CREATE TABLE IF NOT EXISTS member_dues (
        id BIGSERIAL PRIMARY KEY,
        member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        due_type VARCHAR(50) DEFAULT 'monthly',
        billing_month VARCHAR(20),
        amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        due_date VARCHAR(50),
        payment_date VARCHAR(50),
        payment_method VARCHAR(50),
        payment_note TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_member_dues_member_id ON member_dues(member_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_member_dues_status ON member_dues(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_member_dues_billing_month ON member_dues(billing_month);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_member_dues_created_at ON member_dues(created_at DESC);`;

    // 9. Key-Value Settings Table
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Seed initial admin if empty
    const defaultUser = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
    const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

    const adminCheck = (await sql`SELECT id FROM admins LIMIT 1;`) as any[];
    if (adminCheck.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(defaultPass, salt);
      await sql`
        INSERT INTO admins (username, password_hash, name, role, permissions, is_active)
        VALUES (${defaultUser}, ${hash}, 'Super Admin', 'super_admin', '["all"]'::jsonb, TRUE)
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

// ------------------------------------------------------------------------------
// Facebook Integration Settings Helpers
// ------------------------------------------------------------------------------

export const DEFAULT_FACEBOOK_SETTINGS: FacebookSettings = {
  postingMode: 'both',
  pageId: process.env.FB_PAGE_ID || '',
  pageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN || '',
  groupUrl: process.env.FB_GROUP_URL || 'https://www.facebook.com/groups/chavalibloodfoundation',
  captionTemplate: `মাশাআল্লাহ! রক্তদান মানবতার শ্রেষ্ঠ উপহার।🩸
দাতার নাম: {name}
রক্তের গ্রুপ: {bloodGroup}
রক্তদানের সংখ্যা: {count}
তারিখ: {date}
চাঁভালি রক্ত ফাউন্ডেশনের পক্ষ থেকে রক্তদাতাকে আন্তরিক শুভেচ্ছা ও শুভকামনা।

#ChavaliBloodFoundation #BloodDonation #DonateBloodSaveLife`,
};

// In-memory fallback if DB not configured yet
let memorySettings: Record<string, string> = {};

export async function getFacebookSettings(): Promise<FacebookSettings> {
  const settings: FacebookSettings = { ...DEFAULT_FACEBOOK_SETTINGS };

  if (isConfigured()) {
    try {
      await ensureTablesExist();
      const sql = getSql();
      if (sql) {
        const rows = (await sql`
          SELECT key, value FROM settings
          WHERE key IN ('fb_posting_mode', 'fb_page_id', 'fb_page_access_token', 'fb_group_url', 'fb_caption_template');
        `) as any[];

        for (const row of rows) {
          if (row.key === 'fb_posting_mode' && row.value) {
            settings.postingMode = row.value as FacebookPostingMode;
          } else if (row.key === 'fb_page_id' && row.value) {
            settings.pageId = row.value;
          } else if (row.key === 'fb_page_access_token' && row.value) {
            settings.pageAccessToken = row.value;
          } else if (row.key === 'fb_group_url' && row.value) {
            settings.groupUrl = row.value;
          } else if (row.key === 'fb_caption_template' && row.value) {
            settings.captionTemplate = row.value;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load settings from DB, using fallback:', e);
    }
  } else {
    if (memorySettings['fb_posting_mode']) settings.postingMode = memorySettings['fb_posting_mode'] as FacebookPostingMode;
    if (memorySettings['fb_page_id']) settings.pageId = memorySettings['fb_page_id'];
    if (memorySettings['fb_page_access_token']) settings.pageAccessToken = memorySettings['fb_page_access_token'];
    if (memorySettings['fb_group_url']) settings.groupUrl = memorySettings['fb_group_url'];
    if (memorySettings['fb_caption_template']) settings.captionTemplate = memorySettings['fb_caption_template'];
  }

  return settings;
}

export async function saveFacebookSettings(data: Partial<FacebookSettings>): Promise<FacebookSettings> {
  const current = await getFacebookSettings();
  const updated: FacebookSettings = {
    postingMode: data.postingMode || current.postingMode,
    pageId: data.pageId !== undefined ? data.pageId.trim() : current.pageId,
    pageAccessToken: data.pageAccessToken !== undefined ? data.pageAccessToken.trim() : current.pageAccessToken,
    groupUrl: data.groupUrl !== undefined ? data.groupUrl.trim() : current.groupUrl,
    captionTemplate: data.captionTemplate !== undefined ? data.captionTemplate : current.captionTemplate,
  };

  if (isConfigured()) {
    try {
      await ensureTablesExist();
      const sql = getSql();
      if (sql) {
        const pairs: [string, string][] = [
          ['fb_posting_mode', updated.postingMode],
          ['fb_page_id', updated.pageId],
          ['fb_page_access_token', updated.pageAccessToken],
          ['fb_group_url', updated.groupUrl],
          ['fb_caption_template', updated.captionTemplate],
        ];

        for (const [key, value] of pairs) {
          await sql`
            INSERT INTO settings (key, value, updated_at)
            VALUES (${key}, ${value}, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
          `;
        }
      }
    } catch (e) {
      console.error('Failed to save settings to DB:', e);
      throw e;
    }
  } else {
    memorySettings['fb_posting_mode'] = updated.postingMode;
    memorySettings['fb_page_id'] = updated.pageId;
    memorySettings['fb_page_access_token'] = updated.pageAccessToken;
    memorySettings['fb_group_url'] = updated.groupUrl;
    memorySettings['fb_caption_template'] = updated.captionTemplate;
  }

  return updated;
}

