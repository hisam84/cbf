import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(req) {
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
        return NextResponse.json({ success: false, valid: false }, { status: 401 });
    }
    return NextResponse.json({
        success: true,
        valid: true,
        admin: auth.admin
    });
}
