// ==============================================================================
// Neon PostgreSQL Connection & Diagnostic Test
// Run with: npm run db:test
// ==============================================================================

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  );
}

function isConfigured() {
  const url = getDatabaseUrl();
  return Boolean(url && url.startsWith('postgres'));
}

async function runTest() {
  console.log('============================================================');
  console.log('[DIAGNOSTIC] Chavali Blood Foundation - Neon DB Test');
  console.log('============================================================\n');

  if (!isConfigured()) {
    console.log(' Status:       [NOT CONFIGURED]');
    console.log(' Message:      DATABASE_URL is not configured in .env file');
    console.log('\nQuick Setup Guide:');
    console.log('  1. Sign in to https://console.neon.tech');
    console.log('  2. Create a new PostgreSQL project named "chavali-blood-foundation"');
    console.log('  3. Copy your Connection String from the Neon dashboard');
    console.log('  4. Add it to your .env file:');
    console.log('     DATABASE_URL=postgresql://neondb_owner:password@endpoint.neon.tech/neondb?sslmode=require');
    console.log('  5. Run: npm run db:init');
    console.log('\n============================================================');
    return;
  }

  const startTime = Date.now();
  try {
    const sql = neon(getDatabaseUrl());
    const result = await sql`SELECT NOW() as current_time, version() as version;`;
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const latencyMs = Date.now() - startTime;

    console.log(' Status:       [CONNECTED TO NEON POSTGRESQL]');
    console.log(` Latency:      ${latencyMs} ms`);
    console.log(` Version:      ${result[0]?.version?.split('on')[0] || result[0]?.version}`);
    console.log(` Timestamp:    ${result[0]?.current_time}`);
    console.log(
      ` Found Tables: ${
        tablesResult.length > 0
          ? tablesResult.map((r) => r.table_name).join(', ')
          : 'None (Run npm run db:init to create)'
      }`
    );
    console.log('\n[SUCCESS] Neon database connection is active and ready for production.');
  } catch (err) {
    console.log(' Status:       [CONNECTION FAILED]');
    console.log(` Error:        ${err.message}`);
    console.log('\nPlease check that your DATABASE_URL in .env has the correct username, password, and host.');
  }
  console.log('\n============================================================');
}

runTest();
