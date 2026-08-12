import { NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function DELETE(req, { params }) {
    try {
        await ensureTablesExist();
        const auth = verifyAdminRequest(req);
        if (!auth.authenticated) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ success: false, message: 'Invalid gallery image ID' }, { status: 400 });
        }

        const idStr = String(id).trim();

        if (isConfigured()) {
            const sql = getSql();
            const deleted = await sql`DELETE FROM gallery WHERE id::text = ${idStr} RETURNING id;`;

            if (deleted.length === 0) {
                return NextResponse.json({ success: false, message: 'Gallery image not found' }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                message: 'Gallery image deleted from database',
                deletedId: idStr
            });
        }

        return NextResponse.json({ success: true, message: 'Gallery image deleted (local mode)', deletedId: idStr });
    } catch (err) {
        console.error('Error deleting gallery image:', err);
        return NextResponse.json({
            success: false,
            message: 'Failed to delete gallery image',
            error: err.message
        }, { status: 500 });
    }
}
