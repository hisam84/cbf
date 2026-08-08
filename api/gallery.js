// ==============================================================================
// Gallery API Endpoints (ছবি গ্যালারি)
// CRUD for photo gallery records in Neon PostgreSQL
// ==============================================================================

const express = require('express');
const router = express.Router();
const { isConfigured, getSql } = require('../lib/db');
const { requireAdminAuth } = require('../lib/auth');

/**
 * GET /api/gallery
 * Public endpoint to list all gallery photos, newest first
 */
router.get('/', async (req, res) => {
    try {
        if (isConfigured()) {
            const sql = getSql();
            const images = await sql`
                SELECT id, caption, image_data as "data", category, uploaded_at as "uploadedAt"
                FROM gallery
                ORDER BY uploaded_at DESC;
            `;

            return res.json({
                success: true,
                source: 'neon_postgres',
                count: images.length,
                data: images
            });
        }

        return res.json({
            success: true,
            source: 'unconfigured',
            count: 0,
            data: []
        });
    } catch (err) {
        console.error('Error fetching gallery:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch gallery images',
            error: err.message
        });
    }
});

/**
 * POST /api/gallery
 * Admin endpoint to upload new image to gallery
 * Body: { data: base64_or_url, caption, category }
 */
router.post('/', requireAdminAuth, async (req, res) => {
    try {
        const { data, caption, category } = req.body || {};

        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'Image data is required'
            });
        }

        if (isConfigured()) {
            const sql = getSql();
            const inserted = await sql`
                INSERT INTO gallery (caption, image_data, category)
                VALUES (${caption || 'Blood Donation Activity'}, ${data}, ${category || 'general'})
                RETURNING id, caption, image_data as "data", category, uploaded_at as "uploadedAt";
            `;

            return res.status(201).json({
                success: true,
                message: 'Image added to gallery in Neon database',
                data: inserted[0]
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Image added (local mode)',
            data: {
                id: Date.now(),
                data,
                caption: caption || 'Blood Donation Activity',
                category: category || 'general',
                uploadedAt: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Error adding gallery image:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to save gallery image to database',
            error: err.message
        });
    }
});

/**
 * DELETE /api/gallery/:id
 * Admin endpoint to delete a photo from gallery
 */
router.delete('/:id', requireAdminAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: 'Invalid gallery image ID' });
        }

        if (isConfigured()) {
            const sql = getSql();
            const deleted = await sql`DELETE FROM gallery WHERE id = ${id} RETURNING id;`;

            if (deleted.length === 0) {
                return res.status(404).json({ success: false, message: 'Gallery image not found' });
            }

            return res.json({
                success: true,
                message: 'Gallery image deleted from database',
                deletedId: id
            });
        }

        return res.json({ success: true, message: 'Gallery image deleted (local mode)', deletedId: id });
    } catch (err) {
        console.error('Error deleting gallery image:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete gallery image',
            error: err.message
        });
    }
});

module.exports = router;
