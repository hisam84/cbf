// ==============================================================================
// Main API Router & Vercel Serverless Entrypoint
// Bridges all modular endpoints (/api/auth, /api/donors, etc.) with Express & Vercel
// ==============================================================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers with support for base64 images (up to 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import route handlers
const authRouter = require('./auth');
const donorsRouter = require('./donors');
const donationsRouter = require('./donations');
const galleryRouter = require('./gallery');
const certificatesRouter = require('./certificates');
const statsRouter = require('./stats');
const contactRouter = require('./contact');
const healthRouter = require('./health');

// Dual mount: matches both with /api prefix and without /api prefix
app.use(['/api/auth', '/auth'], authRouter);
app.use(['/api/donors', '/donors'], donorsRouter);
app.use(['/api/donations', '/donations'], donationsRouter);
app.use(['/api/gallery', '/gallery'], galleryRouter);
app.use(['/api/certificates', '/certificates'], certificatesRouter);
app.use(['/api/stats', '/stats'], statsRouter);
app.use(['/api/contact', '/contact'], contactRouter);
app.use(['/api/health', '/health'], healthRouter);

// Root diagnostic endpoint
app.get(['/api', '/'], (req, res) => {
    res.json({
        message: 'Chavali Blood Foundation API with Neon PostgreSQL is running',
        version: '1.1.0',
        status: 'online',
        endpoints: [
            '/api/health',
            '/api/stats',
            '/api/donors',
            '/api/donations',
            '/api/gallery',
            '/api/certificates',
            '/api/auth/login',
            '/api/contact'
        ]
    });
});

module.exports = app;
