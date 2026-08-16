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
        if (admin.is_active === false) {
          return NextResponse.json(
            {
              success: false,
              message: 'আপনার একাউন্টটি বর্তমানে নিষ্ক্রিয় রয়েছে। অনুগ্রহ করে সুপার এডমিনের সাথে যোগাযোগ করুন।',
            },
            { status: 403 }
          );
        }

        const isMatch = await comparePassword(password, admin.password_hash);

        if (isMatch) {
          let userPerms: string[] = ['all'];
          if (admin.permissions) {
            if (Array.isArray(admin.permissions)) {
              userPerms = admin.permissions;
            } else if (typeof admin.permissions === 'string') {
              try {
                userPerms = JSON.parse(admin.permissions);
              } catch {
                userPerms = [admin.permissions];
              }
            }
          }

          const token = generateToken({
            id: admin.id,
            username: admin.username,
            name: admin.name || admin.username,
            role: admin.role || 'super_admin',
            permissions: userPerms,
          });

          return NextResponse.json({
            success: true,
            message: 'লগইন সফল হয়েছে',
            token,
            admin: {
              id: admin.id,
              username: admin.username,
              name: admin.name || admin.username,
              role: admin.role || 'super_admin',
              permissions: userPerms,
            },
          });
        }
      }
    }

    // Fallback default admin check
    const defaultUser = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
    const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

    if (cleanUsername === defaultUser && password === defaultPass) {
      const defaultPerms = ['all'];
      const token = generateToken({
        id: 1,
        username: defaultUser,
        name: 'Super Admin',
        role: 'super_admin',
        permissions: defaultPerms,
      });
      return NextResponse.json({
        success: true,
        message: 'লগইন সফল হয়েছে (ডিফল্ট এডমিন)',
        token,
        admin: {
          id: 1,
          username: defaultUser,
          name: 'Super Admin',
          role: 'super_admin',
          permissions: defaultPerms,
        },
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
