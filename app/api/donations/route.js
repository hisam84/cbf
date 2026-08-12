import { NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { normalizePhone } from '@/lib/validators';

export async function GET() {
    try {
        await ensureTablesExist();
        if (isConfigured()) {
            const sql = getSql();
            const donations = await sql`
                SELECT id, donor_name as "donorName", donor_phone as "donorPhone", 
                       donor_address as "donorAddress", number, blood_group as "bloodGroup", 
                       date, image, notes, added_at as "addedAt", updated_at as "updatedAt"
                FROM donations
                ORDER BY date DESC, added_at DESC;
            `;

            return NextResponse.json({
                success: true,
                source: 'neon_postgres',
                count: donations.length,
                data: donations
            });
        }

        return NextResponse.json({
            success: true,
            source: 'unconfigured',
            count: 0,
            data: []
        });
    } catch (err) {
        console.error('Error fetching donations:', err);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch donations from database',
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
        const { donorName, donorPhone, donorAddress, number, bloodGroup, date, image, notes } = body;

        if (!donorName || !donorPhone || !donorAddress || !number || !bloodGroup || !date) {
            return NextResponse.json({
                success: false,
                message: 'Donor name, phone, address, donation number, blood group, and date are required.'
            }, { status: 400 });
        }

        const normalizedPhone = normalizePhone(donorPhone);
        const formattedBloodGroup = bloodGroup.trim().toUpperCase();

        if (isConfigured()) {
            const sql = getSql();

            // 1. Insert donation record
            const inserted = await sql`
                INSERT INTO donations (donor_name, donor_phone, donor_address, number, blood_group, date, image, notes)
                VALUES (${donorName.trim()}, ${normalizedPhone || donorPhone.trim()}, ${donorAddress.trim()}, ${number.trim()}, ${formattedBloodGroup}, ${date.trim()}, ${image || null}, ${notes || null})
                RETURNING id, donor_name as "donorName", donor_phone as "donorPhone", donor_address as "donorAddress", number, blood_group as "bloodGroup", date, image, notes, added_at as "addedAt";
            `;

            // 2. Automatically upsert into donors table
            const existingDonor = await sql`SELECT id FROM donors WHERE mobile = ${normalizedPhone} OR mobile = ${donorPhone.trim()};`;
            if (existingDonor.length > 0) {
                await sql`
                    UPDATE donors 
                    SET name = ${donorName.trim()},
                        blood_group = ${formattedBloodGroup},
                        address = ${donorAddress.trim()},
                        last_donation = ${date.trim()},
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ${existingDonor[0].id};
                `;
            } else {
                await sql`
                    INSERT INTO donors (name, mobile, blood_group, address, last_donation)
                    VALUES (${donorName.trim()}, ${normalizedPhone || donorPhone.trim()}, ${formattedBloodGroup}, ${donorAddress.trim()}, ${date.trim()});
                `;
            }

            return NextResponse.json({
                success: true,
                message: 'Donation recorded successfully in Neon database',
                data: inserted[0]
            }, { status: 201 });
        }

        return NextResponse.json({
            success: true,
            message: 'Donation recorded (local mode)',
            data: {
                id: Date.now(),
                donorName,
                donorPhone: normalizedPhone || donorPhone,
                donorAddress,
                number,
                bloodGroup: formattedBloodGroup,
                date,
                image,
                addedAt: new Date().toISOString()
            }
        }, { status: 201 });
    } catch (err) {
        console.error('Error recording donation:', err);
        return NextResponse.json({
            success: false,
            message: 'Failed to record donation in database',
            error: err.message
        }, { status: 500 });
    }
}
