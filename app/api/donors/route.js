import { NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { validateBloodGroup, normalizePhone } from '@/lib/validators';

export async function GET(req) {
    try {
        await ensureTablesExist();
        const { searchParams } = new URL(req.url);
        const bloodGroup = searchParams.get('bloodGroup');
        const q = searchParams.get('q');

        if (isConfigured()) {
            const sql = getSql();
            let donors;

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

            return NextResponse.json({
                success: true,
                source: 'neon_postgres',
                count: donors.length,
                data: donors
            });
        }

        return NextResponse.json({
            success: true,
            source: 'unconfigured',
            count: 0,
            data: []
        });
    } catch (err) {
        console.error('Error fetching donors:', err);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch donors from database',
            error: err.message
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await ensureTablesExist();
        const body = await req.json().catch(() => ({}));
        const { name, mobile, bloodGroup, address, lastDonation, gender, dob } = body;

        if (!name || !mobile || !bloodGroup || !address) {
            return NextResponse.json({
                success: false,
                message: 'Name, mobile number, blood group, and address are required.'
            }, { status: 400 });
        }

        const formattedBloodGroup = bloodGroup.trim().toUpperCase();
        if (!validateBloodGroup(formattedBloodGroup)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid blood group. Valid groups are: A+, A-, B+, B-, O+, O-, AB+, AB-'
            }, { status: 400 });
        }

        const normalizedPhone = normalizePhone(mobile);

        if (isConfigured()) {
            const sql = getSql();

            const existing = await sql`SELECT id, name FROM donors WHERE mobile = ${normalizedPhone || mobile.trim()};`;
            if (existing.length > 0) {
                return NextResponse.json({
                    success: false,
                    message: `A donor is already registered with mobile number ${mobile.trim()}`,
                    existingDonorId: existing[0].id
                }, { status: 409 });
            }

            const inserted = await sql`
                INSERT INTO donors (name, mobile, blood_group, address, last_donation, gender, dob)
                VALUES (${name.trim()}, ${normalizedPhone || mobile.trim()}, ${formattedBloodGroup}, ${address.trim()}, ${lastDonation || null}, ${gender || null}, ${dob || null})
                RETURNING id, name, mobile, blood_group as "bloodGroup", address, last_donation as "lastDonation", gender, dob, registered_at as "registeredAt";
            `;

            return NextResponse.json({
                success: true,
                message: 'Donor registered successfully in Neon database',
                data: inserted[0]
            }, { status: 201 });
        }

        return NextResponse.json({
            success: true,
            message: 'Donor registered (local mode)',
            data: {
                id: Date.now(),
                name,
                mobile: normalizedPhone || mobile,
                bloodGroup: formattedBloodGroup,
                address,
                lastDonation,
                gender,
                dob,
                registeredAt: new Date().toISOString()
            }
        }, { status: 201 });
    } catch (err) {
        console.error('Error registering donor:', err);
        return NextResponse.json({
            success: false,
            message: 'Failed to register donor in database',
            error: err.message
        }, { status: 500 });
    }
}
