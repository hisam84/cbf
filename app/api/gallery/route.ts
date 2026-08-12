import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { ApiResponse, GalleryItem } from '@/lib/types';
import { sanitizeText } from '@/lib/validators';

export async function GET(): Promise<NextResponse<ApiResponse<GalleryItem[]>>> {
  try {
    await ensureTablesExist();
    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready', data: [] }, { status: 500 });
      }

      const [galleryImages, donationImages] = await Promise.all([
        sql`
          SELECT id, caption, image_data as "data", category, uploaded_at as "uploadedAt"
          FROM gallery
          ORDER BY uploaded_at DESC;
        ` as Promise<any[]>,
        sql`
          SELECT id, 
                 CONCAT('রক্তদান কার্যক্রম: ', donor_name, ' (', blood_group, ')') as caption, 
                 image as "data", 
                 'donation' as category, 
                 added_at as "uploadedAt"
          FROM donations
          WHERE image IS NOT NULL AND image != ''
          ORDER BY date DESC, added_at DESC;
        ` as Promise<any[]>,
      ]);

      const allImages: GalleryItem[] = [...(galleryImages as GalleryItem[]), ...(donationImages as GalleryItem[])];

      return NextResponse.json({
        success: true,
        source: 'neon_postgres',
        count: allImages.length,
        data: allImages,
      });
    }

    return NextResponse.json({
      success: true,
      source: 'unconfigured',
      count: 0,
      data: [],
    });
  } catch (err: any) {
    console.error('Error fetching gallery:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch gallery from database',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<GalleryItem>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { imageData, caption, category = 'general' } = body;

    if (!imageData) {
      return NextResponse.json(
        {
          success: false,
          message: 'Image data is required',
        },
        { status: 400 }
      );
    }

    const cleanCaption = sanitizeText(caption);
    const cleanCategory = sanitizeText(category) || 'general';

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const inserted = (await sql`
        INSERT INTO gallery (caption, image_data, category)
        VALUES (${cleanCaption || null}, ${imageData}, ${cleanCategory})
        RETURNING id, caption, image_data as "data", category, uploaded_at as "uploadedAt";
      `) as any[];

      return NextResponse.json(
        {
          success: true,
          message: 'ছবি সফলভাবে গ্যালারিতে সংরক্ষিত হয়েছে।',
          data: inserted[0] as GalleryItem,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Photo saved (local mode)',
        data: {
          id: Date.now(),
          caption: cleanCaption,
          data: imageData,
          category: cleanCategory,
          uploadedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error adding gallery image:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to save photo to database',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
