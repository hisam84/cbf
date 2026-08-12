import { NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';

export async function GET() {
    try {
        await ensureTablesExist();
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

            return NextResponse.json({
                success: true,
                source: 'neon_postgres',
                stats: {
                    totalDonors: donorsCount?.count || 0,
                    totalDonations: donationsCount?.count || 0,
                    totalCertificates: certificatesCount?.count || 0,
                    bloodGroupBreakdown: (bloodGroupBreakdown || []).reduce((acc, row) => {
                        acc[row.bloodGroup] = row.count;
                        return acc;
                    }, {})
                }
            });
        }

        return NextResponse.json({
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
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch stats',
            error: err.message
        }, { status: 500 });
    }
}
