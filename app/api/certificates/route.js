import { NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET() {
    try {
        await ensureTablesExist();
        if (isConfigured()) {
            const sql = getSql();
            const certificates = await sql`
                SELECT id, donation_id as "donationId", donor_name as "donorName",
                       blood_group as "bloodGroup", donation_date as "donationDate",
                       phone, address, donation_number as "donationNumber",
                       message, html_content as "htmlContent", generated_at as "generatedAt"
                FROM certificates
                ORDER BY generated_at DESC;
            `;

            return NextResponse.json({
                success: true,
                source: 'neon_postgres',
                count: certificates.length,
                data: certificates
            });
        }

        return NextResponse.json({
            success: true,
            source: 'unconfigured',
            count: 0,
            data: []
        });
    } catch (err) {
        console.error('Error fetching certificates:', err);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch certificates from database',
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
        const { donationId, donorName, bloodGroup, donationDate, phone, address, donationNumber, message, htmlContent } = body;

        if (!donorName || !bloodGroup || !donationDate) {
            return NextResponse.json({
                success: false,
                message: 'Donor name, blood group, and donation date are required.'
            }, { status: 400 });
        }

        if (isConfigured()) {
            const sql = getSql();
            const inserted = await sql`
                INSERT INTO certificates (donation_id, donor_name, blood_group, donation_date, phone, address, donation_number, message, html_content)
                VALUES (${donationId ? parseInt(donationId) : null}, ${donorName.trim()}, ${bloodGroup.trim()}, ${donationDate.trim()}, ${phone || null}, ${address || null}, ${donationNumber || null}, ${message || null}, ${htmlContent || null})
                RETURNING id, donation_id as "donationId", donor_name as "donorName", blood_group as "bloodGroup", donation_date as "donationDate", phone, address, donation_number as "donationNumber", message, generated_at as "generatedAt";
            `;

            return NextResponse.json({
                success: true,
                message: 'Certificate saved successfully in Neon database',
                data: inserted[0]
            }, { status: 201 });
        }

        return NextResponse.json({
            success: true,
            message: 'Certificate saved (local mode)',
            data: {
                id: Date.now(),
                donationId,
                donorName,
                bloodGroup,
                donationDate,
                phone,
                address,
                donationNumber,
                message,
                generatedAt: new Date().toISOString()
            }
        }, { status: 201 });
    } catch (err) {
        console.error('Error saving certificate:', err);
        return NextResponse.json({
            success: false,
            message: 'Failed to save certificate to database',
            error: err.message
        }, { status: 500 });
    }
}
