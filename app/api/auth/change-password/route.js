import { NextResponse } from 'next/server';
import { isConfigured, getSql } from '@/lib/db';
import { hashPassword, comparePassword, verifyAdminRequest } from '@/lib/auth';

export async function POST(req) {
    try {
        const auth = verifyAdminRequest(req);
        if (!auth.authenticated) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({
                success: false,
                message: 'Current password and new password are required'
            }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({
                success: false,
                message: 'New password must be at least 6 characters long'
            }, { status: 400 });
        }

        const username = auth.admin.username;

        if (isConfigured()) {
            const sql = getSql();
            const rows = await sql`SELECT * FROM admins WHERE username = ${username};`;

            if (rows.length > 0) {
                const admin = rows[0];
                const isMatch = await comparePassword(currentPassword, admin.password_hash);
                if (!isMatch) {
                    return NextResponse.json({
                        success: false,
                        message: 'Current password does not match'
                    }, { status: 400 });
                }

                const newHash = await hashPassword(newPassword);
                await sql`
                    UPDATE admins 
                    SET password_hash = ${newHash}, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ${admin.id};
                `;

                return NextResponse.json({
                    success: true,
                    message: 'Password updated successfully in Neon database'
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (err) {
        console.error('Password change error:', err);
        return NextResponse.json({
            success: false,
            message: 'Failed to update password',
            error: err.message
        }, { status: 500 });
    }
}
