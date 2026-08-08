// ==============================================================================
// Stats API Endpoints (পরিসংখ্যান ও ড্যাশবোর্ড তথ্য)
// Aggregates statistics directly from Neon PostgreSQL
// ==============================================================================

const express = require('express');
const router = express.Router();
const { isConfigured, getSql } = require('../lib/db');

/**
 * GET /api/stats
 * Public endpoint for homepage and admin overview counters
 */
router.get('/', async (req, res) => {
    try {
        if (isConfigured()) {
            const sql = getSql();

            // Run aggregation queries in parallel for speed
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
                    totalDonors: donorsCount?.count || 0,
                    totalDonations: donationsCount?.count || 0,
                    totalCertificates: certificatesCount?.count || 0,
                    totalBloodTypes: 8,
                    bloodGroupBreakdown: bloodGroupBreakdown || []
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
                totalBloodTypes: 8,
                bloodGroupBreakdown: []
            }
        });
    } catch (err) {
        console.error('Error calculating stats:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to aggregate statistics',
            error: err.message
        });
    }
});

module.exports = router;
