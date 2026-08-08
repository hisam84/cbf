// ==============================================================================
// Health & Diagnostics API Endpoint
// Inspects Neon database connectivity, latency, tables, and server status
// Works as both standalone Vercel function and Express router
// ==============================================================================

const express = require('express');
const cors = require('cors');
const { checkDbConnection } = require('../lib/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

async function handleHealth(req, res) {
    try {
        const dbStatus = await checkDbConnection();

        const responsePayload = {
            status: dbStatus.connected ? 'healthy' : (dbStatus.configured ? 'degraded' : 'unconfigured'),
            service: 'Chavali Blood Foundation Backend',
            database: {
                provider: 'Neon Serverless PostgreSQL',
                ...dbStatus
            },
            serverTime: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
            nodeVersion: process.version
        };

        const statusCode = dbStatus.connected ? 200 : (dbStatus.configured ? 503 : 200);
        return res.status(statusCode).json(responsePayload);
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            error: err.message
        });
    }
}

app.get(['/', '/health', '/api/health'], handleHealth);

module.exports = app;
