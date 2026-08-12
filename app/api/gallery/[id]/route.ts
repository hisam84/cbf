import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
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
      return NextResponse.json({ success: false, message: 'Invalid gallery image ID' }, { status: 400 });
    }

    const idStr = String(id).trim();

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const deleted = (await sql`DELETE FROM gallery WHERE id::text = ${idStr} RETURNING id;`) as any[];

      if (deleted.length === 0) {
        return NextResponse.json({ success: false, message: 'Gallery image not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'গ্যালারির ছবি সফলভাবে মুছে ফেলা হয়েছে।',
        deletedId: idStr,
      });
    }

    return NextResponse.json({ success: true, message: 'Gallery image deleted (local mode)', deletedId: idStr });
  } catch (err: any) {
    console.error('Error deleting gallery image:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete gallery image',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
