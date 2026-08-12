import { NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function POST(req) {
    try {
        await ensureTablesExist();
        const body = await req.json().catch(() => ({}));
        const { name, phone, email, subject, message } = body;

        if (!name || !message) {
            return NextResponse.json({
                success: false,
                message: 'Name and message are required fields'
            }, { status: 400 });
        }

        if (isConfigured()) {
            const sql = getSql();
            const inserted = await sql`
                INSERT INTO contact_messages (name, phone, email, subject, message)
                VALUES (${name.trim()}, ${phone || null}, ${email || null}, ${subject || null}, ${message.trim()})
                RETURNING id, name, phone, email, subject, message, created_at as "createdAt";
            `;

            return NextResponse.json({
                success: true,
                message: 'Thank you! Your message has been sent successfully.',
                data: inserted[0]
            }, { status: 201 });
        }

        return NextResponse.json({
            success: true,
            message: 'Thank you! Your message has been received (local mode).'
        }, { status: 201 });
    } catch (err) {
        console.error('Error submitting contact message:', err);
        return NextResponse.json({
            success: false,
            message: 'Failed to send message',
            error: err.message
        }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await ensureTablesExist();
        const auth = verifyAdminRequest(req);
        if (!auth.authenticated) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (isConfigured()) {
            const sql = getSql();
            const messages = await sql`
                SELECT id, name, phone, email, subject, message, is_read as "isRead", created_at as "createdAt"
                FROM contact_messages
                ORDER BY created_at DESC;
            `;

            return NextResponse.json({
                success: true,
                count: messages.length,
                data: messages
            });
        }

        return NextResponse.json({ success: true, count: 0, data: [] });
    } catch (err) {
        console.error('Error fetching contact messages:', err);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch contact messages',
            error: err.message
        }, { status: 500 });
    }
}
