// ==============================================================================
// Certificates API Endpoints (প্রশংসাপত্র ব্যবস্থাপনা)
// CRUD for blood donation certificates stored in Neon PostgreSQL
// ==============================================================================

const express = require('express');
const router = express.Router();
const { isConfigured, getSql } = require('../lib/db');
const { requireAdminAuth } = require('../lib/auth');

/**
 * GET /api/certificates
 * List all generated certificates
 */
router.get('/', async (req, res) => {
    try {
        if (isConfigured()) {
            const sql = getSql();
            const certificates = await sql`
                SELECT id, donation_id as "donationId", donor_name as "donorName",
                       blood_group as "bloodGroup", donation_date as "donationDate",
                       phone, address, donation_number as "donationNumber",
                       message, html_content as "htmlContent", generated_at as "generatedAt"
                FROM certificates
                ORDER BY generated_at DESC;
            `;

            return res.json({
                success: true,
                source: 'neon_postgres',
                count: certificates.length,
                data: certificates
            });
        }

        return res.json({
            success: true,
            source: 'unconfigured',
            count: 0,
            data: []
        });
    } catch (err) {
        console.error('Error fetching certificates:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch certificates from database',
            error: err.message
        });
    }
});

/**
 * GET /api/certificates/:id
 * Fetch a specific certificate by ID (for certificate.html viewer)
 */
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: 'Invalid certificate ID' });
        }

        if (isConfigured()) {
            const sql = getSql();
            const rows = await sql`
                SELECT id, donation_id as "donationId", donor_name as "donorName",
                       blood_group as "bloodGroup", donation_date as "donationDate",
                       phone, address, donation_number as "donationNumber",
                       message, html_content as "htmlContent", generated_at as "generatedAt"
                FROM certificates
                WHERE id = ${id};
            `;

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Certificate not found' });
            }

            return res.json({
                success: true,
                data: rows[0]
            });
        }

        return res.status(404).json({ success: false, message: 'Certificate not found' });
    } catch (err) {
        console.error('Error fetching certificate:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch certificate',
            error: err.message
        });
    }
});

/**
 * POST /api/certificates
 * Save a newly generated certificate
 */
router.post('/', requireAdminAuth, async (req, res) => {
    try {
        const { donationId, donorName, bloodGroup, donationDate, phone, address, donationNumber, message, htmlContent } = req.body || {};

        if (!donorName || !bloodGroup || !donationDate) {
            return res.status(400).json({
                success: false,
                message: 'Donor name, blood group, and donation date are required.'
            });
        }

        if (isConfigured()) {
            const sql = getSql();
            const inserted = await sql`
                INSERT INTO certificates (donation_id, donor_name, blood_group, donation_date, phone, address, donation_number, message, html_content)
                VALUES (${donationId ? parseInt(donationId) : null}, ${donorName.trim()}, ${bloodGroup.trim()}, ${donationDate.trim()}, ${phone || null}, ${address || null}, ${donationNumber || null}, ${message || null}, ${htmlContent || null})
                RETURNING id, donation_id as "donationId", donor_name as "donorName", blood_group as "bloodGroup", donation_date as "donationDate", phone, address, donation_number as "donationNumber", message, generated_at as "generatedAt";
            `;

            return res.status(201).json({
                success: true,
                message: 'Certificate saved successfully in Neon database',
                data: inserted[0]
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Certificate saved (local mode)',
            data: {
                id: Date.now(),
                donationId,
                donorName,
                bloodGroup,
                donationDate,
                phone,
                address,
                donationNumber,
                message,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Error saving certificate:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to save certificate to database',
            error: err.message
        });
    }
});

/**
 * DELETE /api/certificates/:id
 * Delete a generated certificate
 */
router.delete('/:id', requireAdminAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: 'Invalid certificate ID' });
        }

        if (isConfigured()) {
            const sql = getSql();
            const deleted = await sql`DELETE FROM certificates WHERE id = ${id} RETURNING id;`;

            if (deleted.length === 0) {
                return res.status(404).json({ success: false, message: 'Certificate not found' });
            }

            return res.json({
                success: true,
                message: 'Certificate deleted successfully from database',
                deletedId: id
            });
        }

        return res.json({ success: true, message: 'Certificate deleted (local mode)', deletedId: id });
    } catch (err) {
        console.error('Error deleting certificate:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete certificate',
            error: err.message
        });
    }
});

module.exports = router;
