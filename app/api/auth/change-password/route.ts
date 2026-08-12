import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql } from '@/lib/db';
import { hashPassword, comparePassword, verifyAdminRequest } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated || !auth.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'বর্তমান পাসওয়ার্ড এবং নতুন পাসওয়ার্ড আবশ্যক',
        },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
        },
        { status: 400 }
      );
    }

    const username = auth.admin.username;

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const rows = (await sql`SELECT * FROM admins WHERE username = ${username};`) as any[];

      if (rows.length > 0) {
        const admin = rows[0];
        const isMatch = await comparePassword(currentPassword, admin.password_hash);
        if (!isMatch) {
          return NextResponse.json(
            {
              success: false,
              message: 'বর্তমান পাসওয়ার্ড সঠিক নয়',
            },
            { status: 400 }
          );
        }

        const newHash = await hashPassword(newPassword);
        await sql`
          UPDATE admins 
          SET password_hash = ${newHash}, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ${admin.id};
        `;

        return NextResponse.json({
          success: true,
          message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে (Neon DB)',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে',
    });
  } catch (err: any) {
    console.error('Password change error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'পাসওয়ার্ড পরিবর্তন করা সম্ভব হয়নি',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
