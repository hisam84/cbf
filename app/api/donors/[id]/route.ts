import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { validateBloodGroup, normalizePhone, sanitizeText } from '@/lib/validators';
import { ApiResponse, Donor } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, context: RouteContext): Promise<NextResponse<ApiResponse<Donor>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Invalid donor ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, mobile, bloodGroup, address, lastDonation, gender, dob } = body;

    if (!name || !mobile || !bloodGroup || !address) {
      return NextResponse.json(
        { success: false, message: 'Name, mobile, blood group, and address are required.' },
        { status: 400 }
      );
    }

    const formattedBloodGroup = bloodGroup.trim().toUpperCase();
    if (!validateBloodGroup(formattedBloodGroup)) {
      return NextResponse.json({ success: false, message: 'Invalid blood group.' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(mobile);
    const cleanName = sanitizeText(name);
    const cleanAddress = sanitizeText(address);
    const idStr = String(id).trim();

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const updated = (await sql`
        UPDATE donors
        SET name = ${cleanName},
            mobile = ${normalizedPhone || mobile.trim()},
            blood_group = ${formattedBloodGroup},
            address = ${cleanAddress},
            last_donation = ${lastDonation || null},
            gender = ${gender || null},
            dob = ${dob || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE id::text = ${idStr}
        RETURNING id, name, mobile, blood_group as "bloodGroup", address, last_donation as "lastDonation", gender, dob, registered_at as "registeredAt", updated_at as "updatedAt";
      `) as any[];

      if (updated.length === 0) {
        return NextResponse.json({ success: false, message: 'Donor not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'রক্তদাতার তথ্য সফলভাবে আপডেট করা হয়েছে।',
        data: updated[0] as Donor,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'রক্তদাতার তথ্য আপডেট সম্পন্ন (লোকাল মোড)',
      data: {
        id,
        name: cleanName,
        mobile: normalizedPhone || mobile,
        bloodGroup: formattedBloodGroup,
        address: cleanAddress,
        lastDonation,
        gender,
        dob,
      },
    });
  } catch (err: any) {
    console.error('Error updating donor:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update donor', error: err?.message || 'Unknown error' },
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
      return NextResponse.json({ success: false, message: 'Invalid donor ID' }, { status: 400 });
    }

    const idStr = String(id).trim();

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const deleted = (await sql`DELETE FROM donors WHERE id::text = ${idStr} RETURNING id;`) as any[];

      if (deleted.length === 0) {
        return NextResponse.json({ success: false, message: 'Donor not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'রক্তদাতার তথ্য সফলভাবে মুছে ফেলা হয়েছে।',
        deletedId: idStr,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'রক্তদাতার তথ্য মুছে ফেলা হয়েছে (লোকাল মোড)',
      deletedId: idStr,
    });
  } catch (err: any) {
    console.error('Error deleting donor:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to delete donor', error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
