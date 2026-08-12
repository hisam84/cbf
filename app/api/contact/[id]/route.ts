import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext): Promise<NextResponse<ApiResponse>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Invalid message ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const isRead = typeof body.isRead === 'boolean' ? body.isRead : true;
    const idStr = String(id).trim();

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      await sql`UPDATE contact_messages SET is_read = ${isRead} WHERE id::text = ${idStr};`;

      return NextResponse.json({
        success: true,
        message: 'বার্তার স্ট্যাটাস আপডেট করা হয়েছে।',
      });
    }

    return NextResponse.json({ success: true, message: 'Status updated (local mode)' });
  } catch (err: any) {
    console.error('Error updating contact message:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update message', error: err?.message || 'Unknown error' },
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
      return NextResponse.json({ success: false, message: 'Invalid message ID' }, { status: 400 });
    }

    const idStr = String(id).trim();

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const deleted = (await sql`DELETE FROM contact_messages WHERE id::text = ${idStr} RETURNING id;`) as any[];

      if (deleted.length === 0) {
        return NextResponse.json({ success: false, message: 'Message not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'বার্তা সফলভাবে মুছে ফেলা হয়েছে।',
        deletedId: idStr,
      });
    }

    return NextResponse.json({ success: true, message: 'Message deleted (local mode)', deletedId: idStr });
  } catch (err: any) {
    console.error('Error deleting contact message:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to delete message', error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
