// ==============================================================================
// Neon PostgreSQL Database Connection Manager
// Uses @neondatabase/serverless for zero-connection-pool serverless querying
// ==============================================================================

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || '';

/**
 * Check if a valid Neon database URL is configured
 */
function isConfigured() {
    return Boolean(DATABASE_URL && DATABASE_URL.startsWith('postgres'));
}

/**
 * Returns a Neon SQL executor instance
 */
function getSql() {
    if (!isConfigured()) {
        return null;
    }
    return neon(DATABASE_URL);
}

/**
 * Executes a parameterized SQL query against Neon
 * @param {string} queryText - SQL query string with $1, $2 parameters
 * @param {Array} params - Array of parameters
 */
async function query(queryText, params = []) {
    if (!isConfigured()) {
        throw new Error('DATABASE_URL is not configured. Please set your Neon connection string in .env');
    }
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
            message: 'DATABASE_URL is not configured in .env',
            latencyMs: null,
            tables: []
        };
    }

    const startTime = Date.now();
    try {
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
    checkDbConnection
};
