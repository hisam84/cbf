// ==============================================================================
// Donors API Endpoints (রক্তদাতা ব্যবস্থাপনা)
// CRUD for registered blood donors in Neon PostgreSQL
// ==============================================================================

const express = require('express');
const router = express.Router();
const { isConfigured, getSql } = require('../lib/db');
const { requireAdminAuth } = require('../lib/auth');
const { normalizePhone, isValidBloodGroup } = require('../lib/validators');

/**
 * GET /api/donors
 * Public endpoint to list donors, optionally filtered by blood group or search
 */
router.get('/', async (req, res) => {
    try {
        const { bloodGroup, search } = req.query;

        if (isConfigured()) {
            const sql = getSql();
            let donors;

            if (bloodGroup && bloodGroup !== 'all') {
                donors = await sql`
                    SELECT id, name, mobile, blood_group as "bloodGroup", address, 
                           last_donation as "lastDonation", gender, dob, registered_at as "registeredAt"
                    FROM donors 
                    WHERE blood_group = ${bloodGroup}
                    ORDER BY last_donation DESC NULLS LAST, registered_at DESC;
                `;
            } else if (search) {
                const term = `%${search.trim()}%`;
                donors = await sql`
                    SELECT id, name, mobile, blood_group as "bloodGroup", address, 
                           last_donation as "lastDonation", gender, dob, registered_at as "registeredAt"
                    FROM donors 
                    WHERE name ILIKE ${term} OR mobile ILIKE ${term} OR address ILIKE ${term}
                    ORDER BY last_donation DESC NULLS LAST, registered_at DESC;
                `;
            } else {
                donors = await sql`
                    SELECT id, name, mobile, blood_group as "bloodGroup", address, 
                           last_donation as "lastDonation", gender, dob, registered_at as "registeredAt"
                    FROM donors 
                    ORDER BY last_donation DESC NULLS LAST, registered_at DESC;
                `;
            }

            return res.json({
                success: true,
                source: 'neon_postgres',
                count: donors.length,
                data: donors
            });
        }

        // Return empty or fallback data if database not yet configured
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
 * POST /api/donors
 * Register a new donor or upsert if mobile number already exists
 */
router.post('/', async (req, res) => {
    try {
        const { name, mobile, bloodGroup, address, lastDonation, gender, dob } = req.body || {};

        if (!name || !mobile || !bloodGroup || !address) {
            return res.status(400).json({
                success: false,
                message: 'Name, mobile number, blood group, and address are required fields.'
            });
        }

        const normalized = normalizePhone(mobile);
        const formattedBloodGroup = bloodGroup.trim().toUpperCase();

        if (isConfigured()) {
            const sql = getSql();

            // Check if donor with this mobile already exists
            const existing = await sql`SELECT id FROM donors WHERE mobile = ${normalized} OR mobile = ${mobile.trim()};`;

            let savedDonor;
            if (existing.length > 0) {
                // Update existing record
                const updated = await sql`
                    UPDATE donors 
                    SET name = ${name.trim()},
                        blood_group = ${formattedBloodGroup},
                        address = ${address.trim()},
                        last_donation = COALESCE(${lastDonation || null}, last_donation),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ${existing[0].id}
                    RETURNING id, name, mobile, blood_group as "bloodGroup", address, last_donation as "lastDonation", registered_at as "registeredAt";
                `;
                savedDonor = updated[0];
            } else {
                // Insert new donor
                const inserted = await sql`
                    INSERT INTO donors (name, mobile, blood_group, address, last_donation, gender, dob)
                    VALUES (${name.trim()}, ${normalized || mobile.trim()}, ${formattedBloodGroup}, ${address.trim()}, ${lastDonation || null}, ${gender || null}, ${dob || null})
                    RETURNING id, name, mobile, blood_group as "bloodGroup", address, last_donation as "lastDonation", registered_at as "registeredAt";
                `;
                savedDonor = inserted[0];
            }

            return res.status(201).json({
                success: true,
                message: 'Donor registered successfully in Neon database',
                data: savedDonor
            });
        }

        // Mock response if database not configured yet
        return res.status(201).json({
            success: true,
            message: 'Donor registered (local mode)',
            data: {
                id: Date.now(),
                name,
                mobile: normalized || mobile,
                bloodGroup: formattedBloodGroup,
                address,
                lastDonation,
                registeredAt: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Error saving donor:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to save donor to database',
            error: err.message
        });
    }
});

/**
 * PUT /api/donors/:id
 * Admin update for an existing donor
 */
router.put('/:id', requireAdminAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, mobile, bloodGroup, address, lastDonation } = req.body || {};

        if (!id) {
            return res.status(400).json({ success: false, message: 'Valid donor ID is required' });
        }

        if (isConfigured()) {
            const sql = getSql();
            const normalized = normalizePhone(mobile);

            const updated = await sql`
                UPDATE donors 
                SET name = COALESCE(${name ? name.trim() : null}, name),
                    mobile = COALESCE(${normalized ? normalized : null}, mobile),
                    blood_group = COALESCE(${bloodGroup ? bloodGroup.trim().toUpperCase() : null}, blood_group),
                    address = COALESCE(${address ? address.trim() : null}, address),
                    last_donation = COALESCE(${lastDonation || null}, last_donation),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
                RETURNING id, name, mobile, blood_group as "bloodGroup", address, last_donation as "lastDonation";
            `;

            if (updated.length === 0) {
                return res.status(404).json({ success: false, message: 'Donor not found' });
            }

            return res.json({
                success: true,
                message: 'Donor updated successfully',
                data: updated[0]
            });
        }

        return res.json({ success: true, message: 'Donor updated (local mode)' });
    } catch (err) {
        console.error('Error updating donor:', err);
        return res.status(500).json({ success: false, message: 'Failed to update donor', error: err.message });
    }
});

/**
 * DELETE /api/donors/:id
 * Protected admin endpoint to delete a donor
 */
router.delete('/:id', requireAdminAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: 'Invalid donor ID' });
        }

        if (isConfigured()) {
            const sql = getSql();
            const deleted = await sql`DELETE FROM donors WHERE id = ${id} RETURNING id;`;

            if (deleted.length === 0) {
                return res.status(404).json({ success: false, message: 'Donor not found' });
            }

            return res.json({
                success: true,
                message: 'Donor deleted successfully from database',
                deletedId: id
            });
        }

        return res.json({ success: true, message: 'Donor deleted (local mode)', deletedId: id });
    } catch (err) {
        console.error('Error deleting donor:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete donor', error: err.message });
    }
});

module.exports = router;
