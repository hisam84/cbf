// ==============================================================================
// Chavali Blood Foundation - Application Server
// Node.js + Express + Neon PostgreSQL
// ==============================================================================

const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { isConfigured, checkDbConnection } = require('./lib/db');
const apiApp = require('./api/index');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers with support for base64 images (up to 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use(apiApp);

// Serve static frontend files (HTML, CSS, JS, Uploads)
app.use(express.static(path.join(__dirname), {
    extensions: ['html'],
    index: 'index.html'
}));

// Admin panel route
app.use('/admin', express.static(path.join(__dirname, 'admin'), {
    extensions: ['html'],
    index: 'index.html'
}));

// Serve uploads directory with long cache
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1d'
}));

// Fallback 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint ${req.originalUrl} not found`
    });
});

// Start Server
app.listen(PORT, async () => {
    console.log('\n============================================================');
    console.log('🩸 Chavali Blood Foundation Server Running');
    console.log(`🌐 Local URL:        http://localhost:${PORT}`);
    console.log(`🔐 Admin Panel:      http://localhost:${PORT}/admin/`);
    console.log(`🩺 Health API:       http://localhost:${PORT}/api/health`);
    console.log('------------------------------------------------------------');

    if (isConfigured()) {
        const dbStatus = await checkDbConnection();
        if (dbStatus.connected) {
            console.log(`⚡ Neon Database:    🟢 Connected (${dbStatus.latencyMs}ms latency)`);
            console.log(`📊 Tables:           ${dbStatus.tables.join(', ') || 'None (Run: npm run db:init)'}`);
        } else {
            console.log('⚡ Neon Database:    🔴 Connection Failed');
            console.log(`⚠️  Error:            ${dbStatus.error}`);
        }
    } else {
        console.log('⚡ Neon Database:    🟡 Not Configured (Running in local mode)');
        console.log('💡 Tip: Set your DATABASE_URL in .env and run: npm run db:init');
    }
    console.log('============================================================\n');
});

module.exports = app;
