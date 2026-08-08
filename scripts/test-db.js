// ==============================================================================
// Neon PostgreSQL Connection & Diagnostic Test
// Run with: npm run db:test
// ==============================================================================

const { checkDbConnection } = require('../lib/db');
require('dotenv').config();

async function runTest() {
    console.log('============================================================');
    console.log('⚡ Chavali Blood Foundation - Neon DB Diagnostic Tool');
    console.log('============================================================\n');

    const result = await checkDbConnection();

    if (result.connected) {
        console.log(' Status:       🟢 CONNECTED TO NEON POSTGRESQL');
        console.log(` Latency:      ${result.latencyMs} ms`);
        console.log(` Version:      ${result.version?.split('on')[0] || result.version}`);
        console.log(` Timestamp:    ${result.timestamp}`);
        console.log(` Found Tables: ${result.tables.length > 0 ? result.tables.join(', ') : 'None (Run npm run db:init to create)'}`);
        console.log('\n✅ Your Neon database connection is active and ready for production.');
    } else if (result.configured) {
        console.log(' Status:       🔴 CONNECTION FAILED');
        console.log(` Error:        ${result.error}`);
        console.log('\n💡 Please check that your DATABASE_URL in .env has the correct username, password, and host.');
    } else {
        console.log(' Status:       🟡 NOT CONFIGURED YET');
        console.log(' Message:      ' + result.message);
        console.log('\n📋 Quick Setup Guide:');
        console.log('  1. Sign in to https://console.neon.tech');
        console.log('  2. Create a new PostgreSQL project named "chavali-blood-foundation"');
        console.log('  3. Copy your Connection String from the Neon dashboard');
        console.log('  4. Add it to your .env file:');
        console.log('     DATABASE_URL=postgresql://neondb_owner:password@endpoint.neon.tech/neondb?sslmode=require');
        console.log('  5. Run: npm run db:init');
    }
    console.log('\n============================================================');
}

runTest();
