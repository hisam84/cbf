import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest, hashPassword } from '@/lib/auth';
import { ApiResponse, AdminUser, AdminUserInput } from '@/lib/types';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<AdminUser[]>>> {
  const auth = verifyAdminRequest(req, 'users');
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, message: auth.error || 'অননুমোদিত এক্সেস' }, { status: 401 });
  }

  try {
    await ensureTablesExist();
    if (!isConfigured()) {
      // Local fallback
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 1,
            username: 'admin',
            name: 'Super Admin',
            role: 'super_admin',
            permissions: ['all'],
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
    }

    const rows = (await sql`
      SELECT id, username, name, role, permissions, is_active, created_at, updated_at
      FROM admins
      ORDER BY id ASC;
    `) as any[];

    const users: AdminUser[] = rows.map((r) => {
      let perms: string[] = ['all'];
      if (r.permissions) {
        if (Array.isArray(r.permissions)) perms = r.permissions;
        else if (typeof r.permissions === 'string') {
          try {
            perms = JSON.parse(r.permissions);
          } catch {
            perms = [r.permissions];
          }
        }
      }

      return {
        id: r.id,
        username: r.username,
        name: r.name || r.username,
        role: r.role || 'sub_admin',
        permissions: perms,
        isActive: r.is_active !== false,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    console.error('Fetch users error:', err);
    return NextResponse.json({ success: false, message: 'ইউজার তালিকা লোড করতে ব্যর্থ', error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const auth = verifyAdminRequest(req, 'users');
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, message: auth.error || 'অননুমোদিত এক্সেস' }, { status: 401 });
  }

  try {
    await ensureTablesExist();
    const body: AdminUserInput = await req.json().catch(() => ({}));

    const cleanUsername = String(body.username || '').trim().toLowerCase();
    const cleanPassword = String(body.password || '').trim();
    const cleanName = String(body.name || '').trim() || cleanUsername;
    const role = body.role === 'super_admin' ? 'super_admin' : 'sub_admin';
    const isActive = body.isActive !== false;
    const permissions = Array.isArray(body.permissions) && body.permissions.length > 0
      ? body.permissions
      : (role === 'super_admin' ? ['all'] : []);

    if (!cleanUsername || cleanUsername.length < 3) {
      return NextResponse.json({ success: false, message: 'ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে' }, { status: 400 });
    }

    if (!cleanPassword || cleanPassword.length < 4) {
      return NextResponse.json({ success: false, message: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে' }, { status: 400 });
    }

    if (!isConfigured()) {
      return NextResponse.json({ success: false, message: 'ডাটাবেজ কনফিগারেশন নেই' }, { status: 500 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
    }

    // Check if username already exists
    const existing = (await sql`SELECT id FROM admins WHERE LOWER(username) = ${cleanUsername} LIMIT 1;`) as any[];
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'এই ইউজারনেমটি ইতিমধ্যে বিদ্যমান। অন্য ইউজারনেম নির্বাচন করুন।' }, { status: 400 });
    }

    const passwordHash = await hashPassword(cleanPassword);
    const permsJson = JSON.stringify(permissions);

    const inserted = (await sql`
      INSERT INTO admins (username, password_hash, name, role, permissions, is_active)
      VALUES (${cleanUsername}, ${passwordHash}, ${cleanName}, ${role}, ${permsJson}::jsonb, ${isActive})
      RETURNING id, username, name, role, permissions, is_active, created_at;
    `) as any[];

    return NextResponse.json({
      success: true,
      message: 'নতুন ইউজার সফলভাবে তৈরি করা হয়েছে',
      data: inserted[0],
    });
  } catch (err: any) {
    console.error('Create user error:', err);
    return NextResponse.json({ success: false, message: 'ইউজার তৈরি করতে ব্যর্থ', error: err?.message }, { status: 500 });
  }
}
