import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { normalizePhone, sanitizeText } from '@/lib/validators';
import { ApiResponse, Member, MemberInput } from '@/lib/types';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Member[]>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    const isAdmin = auth.authenticated;

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready', data: [] }, { status: 500 });
      }

      const members = (await sql`
        SELECT id, name, designation, mobile, blood_group as "bloodGroup", 
               image, bio, role_type as "roleType", order_index as "orderIndex", 
               monthly_fee as "monthlyFee",
               joined_at as "joinedAt", created_at as "createdAt", updated_at as "updatedAt"
        FROM members
        ORDER BY order_index ASC, created_at ASC;
      `) as any[];

      // Mask mobile number for public frontend queries
      const safeMembers = members.map((m) => ({
        ...m,
        monthlyFee: Number(m.monthlyFee) || 0,
        mobile: isAdmin ? m.mobile : '', // Masked on public frontend
      }));

      return NextResponse.json({
        success: true,
        source: 'neon_postgres',
        count: safeMembers.length,
        data: safeMembers as Member[],
      });
    }

    return NextResponse.json({
      success: true,
      source: 'unconfigured',
      count: 0,
      data: [],
    });
  } catch (err: any) {
    console.error('Error fetching members:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch members from database',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Member>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as MemberInput;
    const { name, designation, mobile, bloodGroup, image, bio, roleType, orderIndex, monthlyFee, joinedAt } = body;

    if (!name || !designation) {
      return NextResponse.json(
        {
          success: false,
          message: 'Member name and designation/position are required.',
        },
        { status: 400 }
      );
    }

    const cleanName = sanitizeText(name);
    const cleanDesignation = sanitizeText(designation);
    const normalizedMobile = mobile ? normalizePhone(mobile) || mobile.trim() : null;
    const formattedBloodGroup = bloodGroup ? bloodGroup.trim().toUpperCase() : null;
    const cleanRoleType = roleType ? sanitizeText(roleType) : 'executive';
    const cleanOrderIndex = Number.isInteger(Number(orderIndex)) ? Number(orderIndex) : 0;
    const cleanMonthlyFee = Number.isFinite(Number(monthlyFee)) && Number(monthlyFee) >= 0 ? Number(monthlyFee) : 0;
    const cleanBio = bio ? sanitizeText(bio) : null;
    const cleanJoinedAt = joinedAt ? sanitizeText(joinedAt) : null;

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      // If a positive order index is specified, shift existing members at that position and beyond by +1
      if (cleanOrderIndex > 0) {
        await sql`
          UPDATE members
          SET order_index = order_index + 1
          WHERE order_index >= ${cleanOrderIndex};
        `;
      }

      const inserted = (await sql`
        INSERT INTO members (name, designation, mobile, blood_group, image, bio, role_type, order_index, monthly_fee, joined_at)
        VALUES (${cleanName}, ${cleanDesignation}, ${normalizedMobile}, ${formattedBloodGroup}, ${image || null}, ${cleanBio}, ${cleanRoleType}, ${cleanOrderIndex}, ${cleanMonthlyFee}, ${cleanJoinedAt})
        RETURNING id, name, designation, mobile, blood_group as "bloodGroup", image, bio, role_type as "roleType", order_index as "orderIndex", monthly_fee as "monthlyFee", joined_at as "joinedAt", created_at as "createdAt", updated_at as "updatedAt";
      `) as any[];

      return NextResponse.json(
        {
          success: true,
          message: 'Member added successfully to database',
          data: {
            ...inserted[0],
            monthlyFee: Number(inserted[0]?.monthlyFee) || 0,
          } as Member,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Member recorded (local mode)',
        data: {
          id: Date.now(),
          name: cleanName,
          designation: cleanDesignation,
          mobile: normalizedMobile,
          bloodGroup: formattedBloodGroup,
          image: image || null,
          bio: cleanBio,
          roleType: cleanRoleType,
          orderIndex: cleanOrderIndex,
          monthlyFee: cleanMonthlyFee,
          joinedAt: cleanJoinedAt,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error adding member:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to add member to database',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
