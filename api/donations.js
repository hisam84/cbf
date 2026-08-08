// ==============================================================================
// Donations API Endpoints (রক্তদান কার্যক্রম ও রেকর্ড)
// CRUD for blood donations stored in Neon PostgreSQL
// ==============================================================================

const express = require('express');
const router = express.Router();
const { isConfigured, getSql } = require('../lib/db');
const { requireAdminAuth } = require('../lib/auth');
const { normalizePhone } = require('../lib/validators');

/**
 * GET /api/donations
 * Public endpoint to list all donation records, sorted newest first
 */
router.get('/', async (req, res) => {
    try {
        if (isConfigured()) {
            const sql = getSql();
            const donations = await sql`
                SELECT id, donor_name as "donorName", donor_phone as "donorPhone", 
                       donor_address as "donorAddress", number, blood_group as "bloodGroup", 
                       date, image, notes, added_at as "addedAt", updated_at as "updatedAt"
                FROM donations
                ORDER BY date DESC, added_at DESC;
            `;

            return res.json({
                success: true,
                source: 'neon_postgres',
                count: donations.length,
                data: donations
            });
        }

        return res.json({
            success: true,
            source: 'unconfigured',
            count: 0,
            data: []
        });
    } catch (err) {
        console.error('Error fetching donations:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch donations from database',
            error: err.message
        });
    }
});

/**
 * POST /api/donations
 * Admin endpoint to record a new blood donation
 * Automatically updates/creates donor record in donors table
 */
router.post('/', requireAdminAuth, async (req, res) => {
    try {
        const { donorName, donorPhone, donorAddress, number, bloodGroup, date, image, notes } = req.body || {};

        if (!donorName || !donorPhone || !donorAddress || !number || !bloodGroup || !date) {
            return res.status(400).json({
                success: false,
                message: 'Donor name, phone, address, donation number, blood group, and date are required.'
            });
        }

        const normalizedPhone = normalizePhone(donorPhone);
        const formattedBloodGroup = bloodGroup.trim().toUpperCase();

        if (isConfigured()) {
            const sql = getSql();

            // 1. Insert donation record
            const inserted = await sql`
                INSERT INTO donations (donor_name, donor_phone, donor_address, number, blood_group, date, image, notes)
                VALUES (${donorName.trim()}, ${normalizedPhone || donorPhone.trim()}, ${donorAddress.trim()}, ${number.trim()}, ${formattedBloodGroup}, ${date.trim()}, ${image || null}, ${notes || null})
                RETURNING id, donor_name as "donorName", donor_phone as "donorPhone", donor_address as "donorAddress", number, blood_group as "bloodGroup", date, image, notes, added_at as "addedAt";
            `;

            // 2. Automatically upsert into donors table
            const existingDonor = await sql`SELECT id FROM donors WHERE mobile = ${normalizedPhone} OR mobile = ${donorPhone.trim()};`;
            if (existingDonor.length > 0) {
                await sql`
                    UPDATE donors 
                    SET name = ${donorName.trim()},
                        blood_group = ${formattedBloodGroup},
                        address = ${donorAddress.trim()},
                        last_donation = ${date.trim()},
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ${existingDonor[0].id};
                `;
            } else {
                await sql`
                    INSERT INTO donors (name, mobile, blood_group, address, last_donation)
                    VALUES (${donorName.trim()}, ${normalizedPhone || donorPhone.trim()}, ${formattedBloodGroup}, ${donorAddress.trim()}, ${date.trim()});
                `;
            }

            return res.status(201).json({
                success: true,
                message: 'Donation recorded successfully in Neon database',
                data: inserted[0]
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Donation recorded (local mode)',
            data: {
                id: Date.now(),
                donorName,
                donorPhone: normalizedPhone || donorPhone,
                donorAddress,
                number,
                bloodGroup: formattedBloodGroup,
                date,
                image,
                addedAt: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Error recording donation:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to record donation in database',
            error: err.message
        });
    }
});

/**
 * PUT /api/donations/:id
 * Admin endpoint to edit an existing donation record
 */
router.put('/:id', requireAdminAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { donorName, donorPhone, donorAddress, number, bloodGroup, date, image, notes } = req.body || {};

        if (!id) {
            return res.status(400).json({ success: false, message: 'Valid donation ID is required' });
        }

        if (isConfigured()) {
            const sql = getSql();
            const normalizedPhone = normalizePhone(donorPhone);

            const updated = await sql`
                UPDATE donations
                SET donor_name = COALESCE(${donorName ? donorName.trim() : null}, donor_name),
                    donor_phone = COALESCE(${normalizedPhone ? normalizedPhone : null}, donor_phone),
                    donor_address = COALESCE(${donorAddress ? donorAddress.trim() : null}, donor_address),
                    number = COALESCE(${number ? number.trim() : null}, number),
                    blood_group = COALESCE(${bloodGroup ? bloodGroup.trim().toUpperCase() : null}, blood_group),
                    date = COALESCE(${date ? date.trim() : null}, date),
                    image = COALESCE(${image !== undefined ? image : null}, image),
                    notes = COALESCE(${notes !== undefined ? notes : null}, notes),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
                RETURNING id, donor_name as "donorName", donor_phone as "donorPhone", donor_address as "donorAddress", number, blood_group as "bloodGroup", date, image, notes, updated_at as "updatedAt";
            `;

            if (updated.length === 0) {
                return res.status(404).json({ success: false, message: 'Donation record not found' });
            }

            return res.json({
                success: true,
                message: 'Donation updated successfully in Neon database',
                data: updated[0]
            });
        }

        return res.json({ success: true, message: 'Donation updated (local mode)' });
    } catch (err) {
        console.error('Error updating donation:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update donation record',
            error: err.message
        });
    }
});

/**
 * DELETE /api/donations/:id
 * Admin endpoint to delete a donation record
 */
router.delete('/:id', requireAdminAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: 'Invalid donation ID' });
        }

        if (isConfigured()) {
            const sql = getSql();
            const deleted = await sql`DELETE FROM donations WHERE id = ${id} RETURNING id;`;

            if (deleted.length === 0) {
                return res.status(404).json({ success: false, message: 'Donation record not found' });
            }

            return res.json({
                success: true,
                message: 'Donation record deleted successfully from database',
                deletedId: id
            });
        }

        return res.json({ success: true, message: 'Donation deleted (local mode)', deletedId: id });
    } catch (err) {
        console.error('Error deleting donation:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete donation record',
            error: err.message
        });
    }
});

module.exports = router;
