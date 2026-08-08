// ==============================================================================
// Donors API Endpoints (রক্তদাতা ব্যবস্থাপনা)
// CRUD for registered blood donors in Neon PostgreSQL with live cloud photos
// ==============================================================================

const express = require('express');
const cors = require('cors');
const { isConfigured, getSql } = require('../lib/db');
const { requireAdminAuth } = require('../lib/auth');
const { normalizePhone, isValidBloodGroup } = require('../lib/validators');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * GET /api/donors
 * Public endpoint to list donors with their cloud photos, optionally filtered by blood group or search
 */
app.get(['/', '/api/donors', '/donors'], async (req, res) => {
    try {
        const { bloodGroup, search } = req.query;

        if (isConfigured()) {
            const sql = getSql();
            let donors;

            if (bloodGroup && bloodGroup !== 'all') {
                donors = await sql`
                    SELECT d.id, d.name, d.mobile, d.blood_group as "bloodGroup", d.address, 
                           d.last_donation as "lastDonation", d.gender, d.dob, d.registered_at as "registeredAt",
                           (SELECT dn.image FROM donations dn 
                            WHERE (dn.donor_phone = d.mobile OR dn.donor_name = d.name) 
                              AND dn.image IS NOT NULL AND dn.image != '' 
                            ORDER BY dn.date DESC, dn.added_at DESC LIMIT 1) as "image"
                    FROM donors d
                    WHERE d.blood_group = ${bloodGroup}
                    ORDER BY d.last_donation DESC NULLS LAST, d.registered_at DESC;
                `;
            } else if (search) {
                const term = `%${search.trim()}%`;
                donors = await sql`
                    SELECT d.id, d.name, d.mobile, d.blood_group as "bloodGroup", d.address, 
                           d.last_donation as "lastDonation", d.gender, d.dob, d.registered_at as "registeredAt",
                           (SELECT dn.image FROM donations dn 
                            WHERE (dn.donor_phone = d.mobile OR dn.donor_name = d.name) 
                              AND dn.image IS NOT NULL AND dn.image != '' 
                            ORDER BY dn.date DESC, dn.added_at DESC LIMIT 1) as "image"
                    FROM donors d
                    WHERE d.name ILIKE ${term} OR d.mobile ILIKE ${term} OR d.address ILIKE ${term}
                    ORDER BY d.last_donation DESC NULLS LAST, d.registered_at DESC;
                `;
            } else {
                donors = await sql`
                    SELECT d.id, d.name, d.mobile, d.blood_group as "bloodGroup", d.address, 
                           d.last_donation as "lastDonation", d.gender, d.dob, d.registered_at as "registeredAt",
                           (SELECT dn.image FROM donations dn 
                            WHERE (dn.donor_phone = d.mobile OR dn.donor_name = d.name) 
                              AND dn.image IS NOT NULL AND dn.image != '' 
                            ORDER BY dn.date DESC, dn.added_at DESC LIMIT 1) as "image"
                    FROM donors d
                    ORDER BY d.last_donation DESC NULLS LAST, d.registered_at DESC;
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
 * POST /api/donors
 * Register a new donor or upsert if mobile number already exists
 */
app.post(['/', '/api/donors', '/donors'], async (req, res) => {
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

            const existing = await sql`SELECT id FROM donors WHERE mobile = ${normalized} OR mobile = ${mobile.trim()};`;

            let savedDonor;
            if (existing.length > 0) {
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
app.put(['/:id', '/api/donors/:id', '/donors/:id'], requireAdminAuth, async (req, res) => {
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
app.delete(['/:id', '/api/donors/:id', '/donors/:id'], requireAdminAuth, async (req, res) => {
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

module.exports = app;
