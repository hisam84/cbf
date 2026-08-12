import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { ApiResponse, ContactMessage } from '@/lib/types';
import { sanitizeText, normalizePhone } from '@/lib/validators';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<ContactMessage>>> {
  try {
    await ensureTablesExist();
    const body = await req.json().catch(() => ({}));
    const { name, phone, email, subject, message } = body;

    if (!name || !message) {
      return NextResponse.json(
        {
          success: false,
          message: 'নাম এবং বার্তা আবশ্যক ফিল্ড।',
        },
        { status: 400 }
      );
    }

    const cleanName = sanitizeText(name);
    const cleanPhone = normalizePhone(phone);
    const cleanEmail = sanitizeText(email);
    const cleanSubject = sanitizeText(subject);
    const cleanMessage = sanitizeText(message);

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const inserted = (await sql`
        INSERT INTO contact_messages (name, phone, email, subject, message)
        VALUES (${cleanName}, ${cleanPhone || null}, ${cleanEmail || null}, ${cleanSubject || null}, ${cleanMessage})
        RETURNING id, name, phone, email, subject, message, is_read as "isRead", created_at as "createdAt";
      `) as any[];

      return NextResponse.json(
        {
          success: true,
          message: 'ধন্যবাদ! আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।',
          data: inserted[0] as ContactMessage,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'ধন্যবাদ! আপনার বার্তাটি গৃহীত হয়েছে (লোকাল মোড)।',
        data: {
          id: Date.now(),
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          subject: cleanSubject,
          message: cleanMessage,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error submitting contact message:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'বার্তা পাঠানো সম্ভব হয়নি',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<ContactMessage[]>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized', data: [] }, { status: 401 });
    }

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready', data: [] }, { status: 500 });
      }

      const messages = (await sql`
        SELECT id, name, phone, email, subject, message, is_read as "isRead", created_at as "createdAt"
        FROM contact_messages
        ORDER BY created_at DESC;
      `) as any[];

      return NextResponse.json({
        success: true,
        count: messages.length,
        data: messages as ContactMessage[],
      });
    }

    return NextResponse.json({ success: true, count: 0, data: [] });
  } catch (err: any) {
    console.error('Error fetching contact messages:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch contact messages',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
