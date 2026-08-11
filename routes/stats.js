// ==============================================================================
// Stats API Endpoints (পরিসংখ্যান ও ড্যাশবোর্ড তথ্য)
// Aggregates statistics directly from Neon PostgreSQL
// ==============================================================================

const express = require('express');
const router = express.Router();
const { isConfigured, getSql } = require('../lib/db');
require('dotenv').config();

router.get('/', async (req, res) => {
    try {
        if (isConfigured()) {
            const sql = getSql();

            const [
                [donorsCount],
                [donationsCount],
                [certificatesCount],
                bloodGroupBreakdown
            ] = await Promise.all([
                sql`SELECT COUNT(*)::int as count FROM donors;`,
                sql`SELECT COUNT(*)::int as count FROM donations;`,
                sql`SELECT COUNT(*)::int as count FROM certificates;`,
                sql`
                    SELECT blood_group as "bloodGroup", COUNT(*)::int as count 
                    FROM donors 
                    GROUP BY blood_group 
                    ORDER BY count DESC;
                `
            ]);

            return res.json({
                success: true,
                source: 'neon_postgres',
                stats: {
                    totalDonors: donorsCount.count,
                    totalDonations: donationsCount.count,
                    totalCertificates: certificatesCount.count,
                    bloodGroupBreakdown: bloodGroupBreakdown.reduce((acc, row) => {
                        acc[row.bloodGroup] = row.count;
                        return acc;
                    }, {})
                }
            });
        }

        return res.json({
            success: true,
            source: 'unconfigured',
            stats: {
                totalDonors: 0,
                totalDonations: 0,
                totalCertificates: 0,
                bloodGroupBreakdown: {}
            }
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: err.message
        });
    }
});

module.exports = router;
