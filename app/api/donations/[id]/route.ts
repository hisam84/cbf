import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { normalizePhone, validateBloodGroup, sanitizeText } from '@/lib/validators';
import { ApiResponse, Donation } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, context: RouteContext): Promise<NextResponse<ApiResponse<Donation>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Invalid donation ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { donorName, donorPhone, donorAddress, number, bloodGroup, date, image, notes } = body;

    if (!donorName || !donorPhone || !donorAddress || !number || !bloodGroup || !date) {
      return NextResponse.json(
        { success: false, message: 'All donation details are required.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(donorPhone);
    const formattedBloodGroup = bloodGroup.trim().toUpperCase();
    const cleanDonorName = sanitizeText(donorName);
    const cleanDonorAddress = sanitizeText(donorAddress);
    const cleanNumber = sanitizeText(number);
    const idStr = String(id).trim();

    if (!validateBloodGroup(formattedBloodGroup)) {
      return NextResponse.json({ success: false, message: 'Invalid blood group' }, { status: 400 });
    }

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const updated = (await sql`
        UPDATE donations
        SET donor_name = ${cleanDonorName},
            donor_phone = ${normalizedPhone || donorPhone.trim()},
            donor_address = ${cleanDonorAddress},
            number = ${cleanNumber},
            blood_group = ${formattedBloodGroup},
            date = ${date.trim()},
            image = ${image || null},
            notes = ${notes ? notes.trim() : null},
            updated_at = CURRENT_TIMESTAMP
        WHERE id::text = ${idStr}
        RETURNING id, donor_name as "donorName", donor_phone as "donorPhone", donor_address as "donorAddress", number, blood_group as "bloodGroup", date, image, notes, added_at as "addedAt", updated_at as "updatedAt";
      `) as any[];

      if (updated.length === 0) {
        return NextResponse.json({ success: false, message: 'Donation not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'রক্তদান রেকর্ড সফলভাবে আপডেট করা হয়েছে।',
        data: updated[0] as Donation,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'রক্তদান রেকর্ড আপডেট সম্পন্ন (লোকাল মোড)',
      data: {
        id,
        donorName: cleanDonorName,
        donorPhone: normalizedPhone || donorPhone,
        donorAddress: cleanDonorAddress,
        number: cleanNumber,
        bloodGroup: formattedBloodGroup,
        date,
        image,
        notes,
      },
    });
  } catch (err: any) {
    console.error('Error updating donation:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update donation', error: err?.message || 'Unknown error' },
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
      return NextResponse.json({ success: false, message: 'Invalid donation ID' }, { status: 400 });
    }

    const idStr = String(id).trim();

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const deleted = (await sql`DELETE FROM donations WHERE id::text = ${idStr} RETURNING id;`) as any[];

      if (deleted.length === 0) {
        return NextResponse.json({ success: false, message: 'Donation record not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'রক্তদান রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।',
        deletedId: idStr,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'রক্তদান রেকর্ড মুছে ফেলা হয়েছে (লোকাল মোড)',
      deletedId: idStr,
    });
  } catch (err: any) {
    console.error('Error deleting donation:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to delete donation', error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
