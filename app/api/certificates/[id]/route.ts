import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { ApiResponse, Certificate } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext): Promise<NextResponse<ApiResponse<Certificate>>> {
  try {
    await ensureTablesExist();
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Invalid certificate ID' }, { status: 400 });
    }

    const idStr = String(id).trim();

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const rows = (await sql`
        SELECT id, donation_id as "donationId", donor_name as "donorName",
               blood_group as "bloodGroup", donation_date as "donationDate",
               phone, address, donation_number as "donationNumber",
               message, html_content as "htmlContent", generated_at as "generatedAt"
        FROM certificates
        WHERE id::text = ${idStr};
      `) as any[];

      if (rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Certificate not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: rows[0] as Certificate });
    }

    return NextResponse.json({ success: false, message: 'Certificate not found' }, { status: 404 });
  } catch (err: any) {
    console.error('Error fetching certificate:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch certificate', error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext): Promise<NextResponse<ApiResponse>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Invalid certificate ID' }, { status: 400 });
    }

    const idStr = String(id).trim();

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const deleted = (await sql`DELETE FROM certificates WHERE id::text = ${idStr} RETURNING id;`) as any[];

      if (deleted.length === 0) {
        return NextResponse.json({ success: false, message: 'Certificate not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Certificate deleted successfully from database',
        deletedId: idStr,
      });
    }

    return NextResponse.json({ success: true, message: 'Certificate deleted (local mode)', deletedId: idStr });
  } catch (err: any) {
    console.error('Error deleting certificate:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete certificate',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
