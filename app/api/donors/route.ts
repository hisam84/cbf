import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { validateBloodGroup, normalizePhone, sanitizeText } from '@/lib/validators';
import { ApiResponse, Donor, DonorInput } from '@/lib/types';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Donor[]>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    const isAdmin = auth.authenticated;

    const { searchParams } = new URL(req.url);
    const bloodGroup = searchParams.get('bloodGroup');
    const q = searchParams.get('q');

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready', data: [] }, { status: 500 });
      }

      let donors: any[];

      if (bloodGroup && bloodGroup !== 'all' && q) {
        const searchPattern = `%${q.trim()}%`;
        donors = await sql`
          SELECT id, name, mobile, blood_group as "bloodGroup", address, 
                 last_donation as "lastDonation", gender, dob, 
                 registered_at as "registeredAt", updated_at as "updatedAt"
          FROM donors
          WHERE blood_group = ${bloodGroup.trim().toUpperCase()}
            AND (name ILIKE ${searchPattern} OR address ILIKE ${searchPattern} OR mobile ILIKE ${searchPattern})
          ORDER BY registered_at DESC;
        `;
      } else if (bloodGroup && bloodGroup !== 'all') {
        donors = await sql`
          SELECT id, name, mobile, blood_group as "bloodGroup", address, 
                 last_donation as "lastDonation", gender, dob, 
                 registered_at as "registeredAt", updated_at as "updatedAt"
          FROM donors
          WHERE blood_group = ${bloodGroup.trim().toUpperCase()}
          ORDER BY registered_at DESC;
        `;
      } else if (q) {
        const searchPattern = `%${q.trim()}%`;
        donors = await sql`
          SELECT id, name, mobile, blood_group as "bloodGroup", address, 
                 last_donation as "lastDonation", gender, dob, 
                 registered_at as "registeredAt", updated_at as "updatedAt"
          FROM donors
          WHERE name ILIKE ${searchPattern} OR address ILIKE ${searchPattern} OR mobile ILIKE ${searchPattern}
          ORDER BY registered_at DESC;
        `;
      } else {
        donors = await sql`
          SELECT id, name, mobile, blood_group as "bloodGroup", address, 
                 last_donation as "lastDonation", gender, dob, 
                 registered_at as "registeredAt", updated_at as "updatedAt"
          FROM donors
          ORDER BY registered_at DESC;
        `;
      }

      // Hide mobile numbers for public visitors; only reveal to logged-in admin
      const safeDonors = donors.map((d) => ({
        ...d,
        mobile: isAdmin ? d.mobile : '',
      }));

      return NextResponse.json({
        success: true,
        source: 'neon_postgres',
        count: safeDonors.length,
        data: safeDonors as Donor[],
      });
    }

    return NextResponse.json({
      success: true,
      source: 'unconfigured',
      count: 0,
      data: [],
    });
  } catch (err: any) {
    console.error('Error fetching donors:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch donors from database',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Donor>>> {
  try {
    await ensureTablesExist();
    const body = (await req.json().catch(() => ({}))) as DonorInput;
    const { name, mobile, bloodGroup, address, lastDonation, gender, dob } = body;

    if (!name || !mobile || !bloodGroup || !address) {
      return NextResponse.json(
        {
          success: false,
          message: 'নাম, মোবাইল নম্বর, রক্তের গ্রুপ এবং ঠিকানা আবশ্যক।',
        },
        { status: 400 }
      );
    }

    const formattedBloodGroup = bloodGroup.trim().toUpperCase();
    if (!validateBloodGroup(formattedBloodGroup)) {
      return NextResponse.json(
        {
          success: false,
          message: 'সঠিক রক্তের গ্রুপ নির্বাচন করুন (A+, A-, B+, B-, O+, O-, AB+, AB-)',
        },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(mobile);
    const cleanName = sanitizeText(name);
    const cleanAddress = sanitizeText(address);

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const existing = (await sql`
        SELECT id, name FROM donors WHERE mobile = ${normalizedPhone || mobile.trim()};
      `) as any[];

      if (existing.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `মোবাইল নম্বর ${mobile.trim()} দিয়ে ইতিমধ্যে একজন রক্তদাতা নিবন্ধিত রয়েছেন।`,
            existingDonorId: existing[0].id,
          },
          { status: 409 }
        );
      }

      const inserted = (await sql`
        INSERT INTO donors (name, mobile, blood_group, address, last_donation, gender, dob)
        VALUES (${cleanName}, ${normalizedPhone || mobile.trim()}, ${formattedBloodGroup}, ${cleanAddress}, ${lastDonation || null}, ${gender || null}, ${dob || null})
        RETURNING id, name, mobile, blood_group as "bloodGroup", address, last_donation as "lastDonation", gender, dob, registered_at as "registeredAt", updated_at as "updatedAt";
      `) as any[];

      return NextResponse.json(
        {
          success: true,
          message: 'ধন্যবাদ! রক্তদাতা হিসেবে আপনার তথ্য সফলভাবে সংরক্ষিত হয়েছে।',
          data: inserted[0] as Donor,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'রক্তদাতা নিবন্ধিত (লোকাল মোড)',
        data: {
          id: Date.now(),
          name: cleanName,
          mobile: normalizedPhone || mobile,
          bloodGroup: formattedBloodGroup,
          address: cleanAddress,
          lastDonation: lastDonation || null,
          gender: gender || null,
          dob: dob || null,
          registeredAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error registering donor:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'রক্তদাতা নিবন্ধন সম্পন্ন করা যায়নি।',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
