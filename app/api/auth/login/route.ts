import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await ensureTablesExist();
    const body = await req.json().catch(() => ({}));
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'ইউজারনেম এবং পাসওয়ার্ড আবশ্যক',
        },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const rows = (await sql`SELECT * FROM admins WHERE username = ${cleanUsername};`) as any[];

      if (rows.length > 0) {
        const admin = rows[0];
        const isMatch = await comparePassword(password, admin.password_hash);

        if (isMatch) {
          const token = generateToken({ id: admin.id, username: admin.username });
          return NextResponse.json({
            success: true,
            message: 'লগইন সফল হয়েছে',
            token,
            admin: { username: admin.username, id: admin.id },
          });
        }
      }
    }

    // Fallback default admin check
    const defaultUser = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
    const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

    if (cleanUsername === defaultUser && password === defaultPass) {
      const token = generateToken({ id: 1, username: defaultUser });
      return NextResponse.json({
        success: true,
        message: 'লগইন সফল হয়েছে (ডিফল্ট এডমিন)',
        token,
        admin: { username: defaultUser, id: 1 },
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'ভুল ইউজারনেম অথবা পাসওয়ার্ড',
      },
      { status: 401 }
    );
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'লগইনে সমস্যা হয়েছে',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
