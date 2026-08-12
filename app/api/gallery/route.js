import { NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET() {
    try {
        await ensureTablesExist();
        if (isConfigured()) {
            const sql = getSql();

            const [galleryImages, donationImages] = await Promise.all([
                sql`
                    SELECT id, caption, image_data as "data", category, uploaded_at as "uploadedAt"
                    FROM gallery
                    ORDER BY uploaded_at DESC;
                `,
                sql`
                    SELECT id, 
                           CONCAT('রক্তদান কার্যক্রম: ', donor_name, ' (', blood_group, ')') as caption, 
                           image as "data", 
                           'donation' as category, 
                           added_at as "uploadedAt"
                    FROM donations
                    WHERE image IS NOT NULL AND image != ''
                    ORDER BY date DESC, added_at DESC;
                `
            ]);

            const allImages = [...galleryImages, ...donationImages];

            return NextResponse.json({
                success: true,
                source: 'neon_postgres',
                count: allImages.length,
                data: allImages
            });
        }

        return NextResponse.json({
            success: true,
            source: 'unconfigured',
            count: 0,
            data: []
        });
    } catch (err) {
        console.error('Error fetching gallery:', err);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch gallery from database',
            error: err.message
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await ensureTablesExist();
        const auth = verifyAdminRequest(req);
        if (!auth.authenticated) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { imageData, caption, category = 'general' } = body;

        if (!imageData) {
            return NextResponse.json({
                success: false,
                message: 'Image data is required'
            }, { status: 400 });
        }

        if (isConfigured()) {
            const sql = getSql();
            const inserted = await sql`
                INSERT INTO gallery (caption, image_data, category)
                VALUES (${caption ? caption.trim() : null}, ${imageData}, ${category})
                RETURNING id, caption, image_data as "data", category, uploaded_at as "uploadedAt";
            `;

            return NextResponse.json({
                success: true,
                message: 'Photo saved successfully in Neon database',
                data: inserted[0]
            }, { status: 201 });
        }

        return NextResponse.json({
            success: true,
            message: 'Photo saved (local mode)',
            data: {
                id: Date.now(),
                caption,
                data: imageData,
                category,
                uploadedAt: new Date().toISOString()
            }
        }, { status: 201 });
    } catch (err) {
        console.error('Error adding gallery image:', err);
        return NextResponse.json({
            success: false,
            message: 'Failed to save photo to database',
            error: err.message
        }, { status: 500 });
    }
}
