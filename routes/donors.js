// ==============================================================================
// Donors API Endpoints (রক্তদাতা তালিকা)
// CRUD for registered blood donors in Neon PostgreSQL
// ==============================================================================

const express = require('express');
const router = express.Router();
const { isConfigured, getSql } = require('../lib/db');
const { requireAdminAuth } = require('../lib/auth');
const { validateBloodGroup, normalizePhone } = require('../lib/validators');
require('dotenv').config();

/**
 * GET /api/donors
 * Public endpoint to list all donors, with optional blood group filter and search query
 */
router.get('/', async (req, res) => {
    try {
        const { bloodGroup, q } = req.query || {};

        if (isConfigured()) {
            const sql = getSql();
            let donors;

            if (bloodGroup && bloodGroup !== 'all' && q) {
                const searchPattern = `%${q.trim()}%`;
                donors = await sql`
                    SELECT id, name, mobile, blood_group as "bloodGroup", address, 
                           last_donation as "lastDonation", gender, dob, 
                           registered_at as "registeredAt", updated_at as "updatedAt"
                    FROM donors
                    WHERE blood_group = ${bloodGroup.trim().toUpperCase()}
                      AND (name ILIKE ${searchPattern} OR address ILIKE ${searchPattern} OR mobile ILIKE ${searchPattern})
                    ORDER BY registered_at DESC;
                `;
            } else if (bloodGroup && bloodGroup !== 'all') {
                donors = await sql`
                    SELECT id, name, mobile, blood_group as "bloodGroup", address, 
                           last_donation as "lastDonation", gender, dob, 
                           registered_at as "registeredAt", updated_at as "updatedAt"
                    FROM donors
                    WHERE blood_group = ${bloodGroup.trim().toUpperCase()}
                    ORDER BY registered_at DESC;
                `;
            } else if (q) {
                const searchPattern = `%${q.trim()}%`;
                donors = await sql`
                    SELECT id, name, mobile, blood_group as "bloodGroup", address, 
                           last_donation as "lastDonation", gender, dob, 
                           registered_at as "registeredAt", updated_at as "updatedAt"
                    FROM donors
                    WHERE name ILIKE ${searchPattern} OR address ILIKE ${searchPattern} OR mobile ILIKE ${searchPattern}
                    ORDER BY registered_at DESC;
                `;
            } else {
                donors = await sql`
                    SELECT id, name, mobile, blood_group as "bloodGroup", address, 
                           last_donation as "lastDonation", gender, dob, 
                           registered_at as "registeredAt", updated_at as "updatedAt"
                    FROM donors
                    ORDER BY registered_at DESC;
                `;
            }

            return res.json({
                success: true,
                source: 'neon_postgres',
                count: donors.length,
                data: donors
            });
        }

        return res.json({
            success: true,
            source: 'unconfigured',
            count: 0,
            data: []
        });
    } catch (err) {
        console.error('Error fetching donors:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch donors from database',
            error: err.message
        });
    }
});

/**
 * GET /api/donors/:id
 * Public endpoint to fetch a single donor by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const rawId = req.params.id;
        if (!rawId) {
            return res.status(400).json({ success: false, message: 'Invalid donor ID' });
        }

        const idStr = String(rawId).trim();

        if (isConfigured()) {
            const sql = getSql();
            const donors = await sql`
                SELECT id, name, mobile, blood_group as "bloodGroup", address, 
                       last_donation as "lastDonation", gender, dob, 
                       registered_at as "registeredAt", updated_at as "updatedAt"
                FROM donors
                WHERE id::text = ${idStr};
            `;

            if (donors.length === 0) {
                return res.status(404).json({ success: false, message: 'Donor not found' });
            }

            return res.json({
                success: true,
                data: donors[0]
            });
        }

        return res.status(404).json({ success: false, message: 'Donor not found' });
    } catch (err) {
        console.error('Error fetching donor:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch donor details',
            error: err.message
        });
    }
});

/**
 * POST /api/donors
 * Public endpoint to register a new donor (from register.html or admin panel)
 */
router.post('/', async (req, res) => {
    try {
        const { name, mobile, bloodGroup, address, lastDonation, gender, dob } = req.body || {};

        if (!name || !mobile || !bloodGroup || !address) {
            return res.status(400).json({
                success: false,
                message: 'Name, mobile number, blood group, and address are required.'
            });
        }

        const formattedBloodGroup = bloodGroup.trim().toUpperCase();
        if (!validateBloodGroup(formattedBloodGroup)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid blood group. Valid groups are: A+, A-, B+, B-, O+, O-, AB+, AB-'
            });
        }

        const normalizedPhone = normalizePhone(mobile);

        if (isConfigured()) {
            const sql = getSql();

            // Check if donor already registered with same phone
            const existing = await sql`SELECT id, name FROM donors WHERE mobile = ${normalizedPhone || mobile.trim()};`;
            if (existing.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: `A donor is already registered with mobile number ${mobile.trim()}`,
                    existingDonorId: existing[0].id
                });
            }

            const inserted = await sql`
                INSERT INTO donors (name, mobile, blood_group, address, last_donation, gender, dob)
                VALUES (${name.trim()}, ${normalizedPhone || mobile.trim()}, ${formattedBloodGroup}, ${address.trim()}, ${lastDonation || null}, ${gender || null}, ${dob || null})
                RETURNING id, name, mobile, blood_group as "bloodGroup", address, last_donation as "lastDonation", gender, dob, registered_at as "registeredAt";
            `;

            return res.status(201).json({
                success: true,
                message: 'Donor registered successfully in Neon database',
                data: inserted[0]
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Donor registered (local mode)',
            data: {
                id: Date.now(),
                name,
                mobile: normalizedPhone || mobile,
                bloodGroup: formattedBloodGroup,
                address,
                lastDonation,
                gender,
                dob,
                registeredAt: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Error registering donor:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to register donor in database',
            error: err.message
        });
    }
});

/**
 * PUT /api/donors/:id
 * Protected admin endpoint to update an existing donor record
 */
router.put('/:id', requireAdminAuth, async (req, res) => {
    try {
        const rawId = req.params.id;
        const { name, mobile, bloodGroup, address, lastDonation, gender, dob } = req.body || {};

        if (!rawId) {
            return res.status(400).json({ success: false, message: 'Valid donor ID is required' });
        }

        const idStr = String(rawId).trim();

        if (isConfigured()) {
            const sql = getSql();
            const normalizedPhone = normalizePhone(mobile);

            const updated = await sql`
                UPDATE donors
                SET name = COALESCE(${name ? name.trim() : null}, name),
                    mobile = COALESCE(${normalizedPhone ? normalizedPhone : null}, mobile),
                    blood_group = COALESCE(${bloodGroup ? bloodGroup.trim().toUpperCase() : null}, blood_group),
                    address = COALESCE(${address ? address.trim() : null}, address),
                    last_donation = COALESCE(${lastDonation !== undefined ? lastDonation : null}, last_donation),
                    gender = COALESCE(${gender !== undefined ? gender : null}, gender),
                    dob = COALESCE(${dob !== undefined ? dob : null}, dob),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id::text = ${idStr}
                RETURNING id, name, mobile, blood_group as "bloodGroup", address, last_donation as "lastDonation", gender, dob, updated_at as "updatedAt";
            `;

            if (updated.length === 0) {
                return res.status(404).json({ success: false, message: 'Donor not found' });
            }

            return res.json({
                success: true,
                message: 'Donor updated successfully in database',
                data: updated[0]
            });
        }

        return res.json({ success: true, message: 'Donor updated (local mode)' });
    } catch (err) {
        console.error('Error updating donor:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update donor record',
            error: err.message
        });
    }
});

/**
 * DELETE /api/donors/:id
 * Protected admin endpoint to delete a donor
 */
router.delete('/:id', requireAdminAuth, async (req, res) => {
    try {
        const rawId = req.params.id;
        if (!rawId) {
            return res.status(400).json({ success: false, message: 'Invalid donor ID' });
        }

        const idStr = String(rawId).trim();

        if (isConfigured()) {
            const sql = getSql();
            const deleted = await sql`DELETE FROM donors WHERE id::text = ${idStr} RETURNING id;`;

            if (deleted.length === 0) {
                return res.status(404).json({ success: false, message: 'Donor not found' });
            }

            return res.json({
                success: true,
                message: 'Donor deleted successfully from database',
                deletedId: idStr
            });
        }

        return res.json({ success: true, message: 'Donor deleted (local mode)', deletedId: idStr });
    } catch (err) {
        console.error('Error deleting donor:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete donor', error: err.message });
    }
});

module.exports = router;
