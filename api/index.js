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

// Mount API routes
const authRouter = require('./auth');
const donorsRouter = require('./donors');
const donationsRouter = require('./donations');
const galleryRouter = require('./gallery');
const certificatesRouter = require('./certificates');
const statsRouter = require('./stats');
const contactRouter = require('./contact');
const healthRouter = require('./health');

app.use('/api/auth', authRouter);
app.use('/api/donors', donorsRouter);
app.use('/api/donations', donationsRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/health', healthRouter);

// Fallback root for /api
app.get('/api', (req, res) => {
    res.json({
        message: 'Chavali Blood Foundation API with Neon PostgreSQL is running',
        version: '1.1.0',
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
