import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest, hashPassword } from '@/lib/auth';
import { ApiResponse, AdminUserInput } from '@/lib/types';

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  const auth = verifyAdminRequest(req, 'users');
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, message: auth.error || 'অননুমোদিত এক্সেস' }, { status: 401 });
  }

  try {
    const { id } = await props.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, message: 'ভুল ইউজার আইডি' }, { status: 400 });
    }

    await ensureTablesExist();
    const body: AdminUserInput = await req.json().catch(() => ({}));

    if (!isConfigured()) {
      return NextResponse.json({ success: false, message: 'ডাটাবেজ কনফিগারেশন নেই' }, { status: 500 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
    }

    const userRows = (await sql`SELECT * FROM admins WHERE id = ${userId} LIMIT 1;`) as any[];
    if (userRows.length === 0) {
      return NextResponse.json({ success: false, message: 'ইউজার পাওয়া যায়নি' }, { status: 404 });
    }

    const currentUser = userRows[0];
    const name = body.name !== undefined ? String(body.name).trim() : currentUser.name;
    const role = body.role !== undefined ? (body.role === 'super_admin' ? 'super_admin' : 'sub_admin') : currentUser.role;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : currentUser.is_active;

    let permissions = currentUser.permissions;
    if (body.permissions !== undefined) {
      permissions = role === 'super_admin' ? ['all'] : (Array.isArray(body.permissions) ? body.permissions : []);
    }
    const permsJson = JSON.stringify(permissions);

    // If new password is provided, hash it
    if (body.password && String(body.password).trim().length >= 4) {
      const newHash = await hashPassword(String(body.password).trim());
      await sql`
        UPDATE admins
        SET name = ${name},
            role = ${role},
            permissions = ${permsJson}::jsonb,
            is_active = ${isActive},
            password_hash = ${newHash},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId};
      `;
    } else {
      await sql`
        UPDATE admins
        SET name = ${name},
            role = ${role},
            permissions = ${permsJson}::jsonb,
            is_active = ${isActive},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId};
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'ইউজার তথ্য ও পারমিশন সফলভাবে আপডেট হয়েছে',
    });
  } catch (err: any) {
    console.error('Update user error:', err);
    return NextResponse.json({ success: false, message: 'ইউজার আপডেট করতে ব্যর্থ', error: err?.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  const auth = verifyAdminRequest(req, 'users');
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, message: auth.error || 'অননুমোদিত এক্সেস' }, { status: 401 });
  }

  try {
    const { id } = await props.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, message: 'ভুল ইউজার আইডি' }, { status: 400 });
    }

    // Prevent deleting own account
    if (auth.admin && String(auth.admin.id) === String(userId)) {
      return NextResponse.json({ success: false, message: 'আপনি নিজের একাউন্ট ডিলিট করতে পারবেন না।' }, { status: 400 });
    }

    await ensureTablesExist();
    if (!isConfigured()) {
      return NextResponse.json({ success: false, message: 'ডাটাবেজ কনফিগারেশন নেই' }, { status: 500 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
    }

    // Check count of super admins
    const superAdminCount = (await sql`SELECT COUNT(*)::int as count FROM admins WHERE role = 'super_admin';`) as any[];
    const targetUser = (await sql`SELECT role FROM admins WHERE id = ${userId} LIMIT 1;`) as any[];

    if (targetUser.length > 0 && targetUser[0].role === 'super_admin' && (superAdminCount[0]?.count || 0) <= 1) {
      return NextResponse.json({ success: false, message: 'সিস্টেমে অন্তত একজন সুপার এডমিন থাকা আবশ্যক।' }, { status: 400 });
    }

    await sql`DELETE FROM admins WHERE id = ${userId};`;

    return NextResponse.json({
      success: true,
      message: 'ইউজার সফলভাবে মুছে ফেলা হয়েছে',
    });
  } catch (err: any) {
    console.error('Delete user error:', err);
    return NextResponse.json({ success: false, message: 'ইউজার ডিলিট করতে ব্যর্থ', error: err?.message }, { status: 500 });
  }
}
