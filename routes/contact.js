// ==============================================================================
// Contact Messages API Endpoints (যোগাযোগ বার্তা)
// Receives and stores contact form feedback in Neon PostgreSQL
// ==============================================================================

const express = require('express');
const router = express.Router();
const { isConfigured, getSql } = require('../lib/db');
const { requireAdminAuth } = require('../lib/auth');

/**
 * POST /api/contact
 * Public endpoint to submit a message from contact.html
 */
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, subject, message } = req.body || {};

        if (!name || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name and message are required fields'
            });
        }

        if (isConfigured()) {
            const sql = getSql();
            const inserted = await sql`
                INSERT INTO contact_messages (name, phone, email, subject, message)
                VALUES (${name.trim()}, ${phone || null}, ${email || null}, ${subject || null}, ${message.trim()})
                RETURNING id, name, phone, email, subject, message, created_at as "createdAt";
            `;

            return res.status(201).json({
                success: true,
                message: 'Thank you! Your message has been sent successfully.',
                data: inserted[0]
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Thank you! Your message has been received (local mode).'
        });
    } catch (err) {
        console.error('Error submitting contact message:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: err.message
        });
    }
});

/**
 * GET /api/contact
 * Admin endpoint to read messages
 */
router.get('/', requireAdminAuth, async (req, res) => {
    try {
        if (isConfigured()) {
            const sql = getSql();
            const messages = await sql`
                SELECT id, name, phone, email, subject, message, is_read as "isRead", created_at as "createdAt"
                FROM contact_messages
                ORDER BY created_at DESC;
            `;

            return res.json({
                success: true,
                count: messages.length,
                data: messages
            });
        }

        return res.json({ success: true, count: 0, data: [] });
    } catch (err) {
        console.error('Error fetching contact messages:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch contact messages',
            error: err.message
        });
    }
});

module.exports = router;
