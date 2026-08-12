import { NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { ApiResponse, StatsData } from '@/lib/types';

export async function GET(): Promise<NextResponse<ApiResponse<null>>> {
  try {
    await ensureTablesExist();
    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const [donorsResult, donationsResult, certificatesResult, bloodGroupRows] = await Promise.all([
        sql`SELECT COUNT(*)::int as count FROM donors;` as Promise<any[]>,
        sql`SELECT COUNT(*)::int as count FROM donations;` as Promise<any[]>,
        sql`SELECT COUNT(*)::int as count FROM certificates;` as Promise<any[]>,
        sql`
          SELECT blood_group as "bloodGroup", COUNT(*)::int as count 
          FROM donors 
          GROUP BY blood_group 
          ORDER BY count DESC;
        ` as Promise<any[]>,
      ]);

      const donorsCount = donorsResult[0]?.count || 0;
      const donationsCount = donationsResult[0]?.count || 0;
      const certificatesCount = certificatesResult[0]?.count || 0;

      const breakdown: Record<string, number> = {};
      for (const row of bloodGroupRows) {
        if (row.bloodGroup) {
          breakdown[row.bloodGroup] = row.count;
        }
      }

      const statsData: StatsData = {
        totalDonors: donorsCount,
        totalDonations: donationsCount,
        totalCertificates: certificatesCount,
        bloodGroupBreakdown: breakdown,
      };

      return NextResponse.json({
        success: true,
        source: 'neon_postgres',
        stats: statsData,
      });
    }

    return NextResponse.json({
      success: true,
      source: 'unconfigured',
      stats: {
        totalDonors: 0,
        totalDonations: 0,
        totalCertificates: 0,
        bloodGroupBreakdown: {},
      },
    });
  } catch (err: any) {
    console.error('Error fetching stats:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch stats',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
