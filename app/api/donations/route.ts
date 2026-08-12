import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { normalizePhone, validateBloodGroup, sanitizeText } from '@/lib/validators';
import { ApiResponse, Donation, DonationInput } from '@/lib/types';

export async function GET(): Promise<NextResponse<ApiResponse<Donation[]>>> {
  try {
    await ensureTablesExist();
    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready', data: [] }, { status: 500 });
      }

      const donations = (await sql`
        SELECT id, donor_name as "donorName", donor_phone as "donorPhone", 
               donor_address as "donorAddress", number, blood_group as "bloodGroup", 
               date, image, notes, added_at as "addedAt", updated_at as "updatedAt"
        FROM donations
        ORDER BY date DESC, added_at DESC;
      `) as any[];

      return NextResponse.json({
        success: true,
        source: 'neon_postgres',
        count: donations.length,
        data: donations as Donation[],
      });
    }

    return NextResponse.json({
      success: true,
      source: 'unconfigured',
      count: 0,
      data: [],
    });
  } catch (err: any) {
    console.error('Error fetching donations:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch donations from database',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Donation>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as DonationInput;
    const { donorName, donorPhone, donorAddress, number, bloodGroup, date, image, notes } = body;

    if (!donorName || !donorPhone || !donorAddress || !number || !bloodGroup || !date) {
      return NextResponse.json(
        {
          success: false,
          message: 'Donor name, phone, address, donation number, blood group, and date are required.',
        },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(donorPhone);
    const formattedBloodGroup = bloodGroup.trim().toUpperCase();
    const cleanDonorName = sanitizeText(donorName);
    const cleanDonorAddress = sanitizeText(donorAddress);
    const cleanNumber = sanitizeText(number);

    if (!validateBloodGroup(formattedBloodGroup)) {
      return NextResponse.json({ success: false, message: 'Invalid blood group' }, { status: 400 });
    }

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      // 1. Insert donation record
      const inserted = (await sql`
        INSERT INTO donations (donor_name, donor_phone, donor_address, number, blood_group, date, image, notes)
        VALUES (${cleanDonorName}, ${normalizedPhone || donorPhone.trim()}, ${cleanDonorAddress}, ${cleanNumber}, ${formattedBloodGroup}, ${date.trim()}, ${image || null}, ${notes ? notes.trim() : null})
        RETURNING id, donor_name as "donorName", donor_phone as "donorPhone", donor_address as "donorAddress", number, blood_group as "bloodGroup", date, image, notes, added_at as "addedAt";
      `) as any[];

      // 2. Automatically upsert into donors table
      const existingDonor = (await sql`
        SELECT id FROM donors WHERE mobile = ${normalizedPhone} OR mobile = ${donorPhone.trim()};
      `) as any[];

      if (existingDonor.length > 0) {
        await sql`
          UPDATE donors 
          SET name = ${cleanDonorName},
              blood_group = ${formattedBloodGroup},
              address = ${cleanDonorAddress},
              last_donation = ${date.trim()},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existingDonor[0].id};
        `;
      } else {
        await sql`
          INSERT INTO donors (name, mobile, blood_group, address, last_donation)
          VALUES (${cleanDonorName}, ${normalizedPhone || donorPhone.trim()}, ${formattedBloodGroup}, ${cleanDonorAddress}, ${date.trim()});
        `;
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Donation recorded successfully in Neon database',
          data: inserted[0] as Donation,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Donation recorded (local mode)',
        data: {
          id: Date.now(),
          donorName: cleanDonorName,
          donorPhone: normalizedPhone || donorPhone,
          donorAddress: cleanDonorAddress,
          number: cleanNumber,
          bloodGroup: formattedBloodGroup,
          date,
          image: image || null,
          notes: notes || null,
          addedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error recording donation:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to record donation in database',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
