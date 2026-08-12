import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { ApiResponse, Certificate, CertificateInput } from '@/lib/types';
import { sanitizeText } from '@/lib/validators';

export async function GET(): Promise<NextResponse<ApiResponse<Certificate[]>>> {
  try {
    await ensureTablesExist();
    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready', data: [] }, { status: 500 });
      }

      const certificates = (await sql`
        SELECT id, donation_id as "donationId", donor_name as "donorName",
               blood_group as "bloodGroup", donation_date as "donationDate",
               phone, address, donation_number as "donationNumber",
               message, html_content as "htmlContent", generated_at as "generatedAt"
        FROM certificates
        ORDER BY generated_at DESC;
      `) as any[];

      return NextResponse.json({
        success: true,
        source: 'neon_postgres',
        count: certificates.length,
        data: certificates as Certificate[],
      });
    }

    return NextResponse.json({
      success: true,
      source: 'unconfigured',
      count: 0,
      data: [],
    });
  } catch (err: any) {
    console.error('Error fetching certificates:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch certificates from database',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Certificate>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as CertificateInput;
    const { donationId, donorName, bloodGroup, donationDate, phone, address, donationNumber, message, htmlContent } =
      body;

    if (!donorName || !bloodGroup || !donationDate) {
      return NextResponse.json(
        {
          success: false,
          message: 'Donor name, blood group, and donation date are required.',
        },
        { status: 400 }
      );
    }

    const cleanDonorName = sanitizeText(donorName);
    const cleanBloodGroup = sanitizeText(bloodGroup).toUpperCase();
    const cleanDonationDate = sanitizeText(donationDate);

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const inserted = (await sql`
        INSERT INTO certificates (donation_id, donor_name, blood_group, donation_date, phone, address, donation_number, message, html_content)
        VALUES (${donationId ? parseInt(String(donationId), 10) : null}, ${cleanDonorName}, ${cleanBloodGroup}, ${cleanDonationDate}, ${phone || null}, ${address || null}, ${donationNumber || null}, ${message || null}, ${htmlContent || null})
        RETURNING id, donation_id as "donationId", donor_name as "donorName", blood_group as "bloodGroup", donation_date as "donationDate", phone, address, donation_number as "donationNumber", message, html_content as "htmlContent", generated_at as "generatedAt";
      `) as any[];

      return NextResponse.json(
        {
          success: true,
          message: 'প্রশংসাপত্র সফলভাবে ডেটাবেসে সংরক্ষিত হয়েছে।',
          data: inserted[0] as Certificate,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Certificate saved (local mode)',
        data: {
          id: Date.now(),
          donationId,
          donorName: cleanDonorName,
          bloodGroup: cleanBloodGroup,
          donationDate: cleanDonationDate,
          phone,
          address,
          donationNumber,
          message,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error saving certificate:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to save certificate to database',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
