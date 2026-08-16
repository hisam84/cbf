import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const auth = verifyAdminRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, valid: false, message: 'Invalid or expired token' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    valid: true,
    admin: auth.admin
      ? {
          id: auth.admin.id,
          username: auth.admin.username,
          name: auth.admin.name || auth.admin.username,
          role: auth.admin.role || 'super_admin',
          permissions: auth.admin.permissions || ['all'],
        }
      : undefined,
  });
}
