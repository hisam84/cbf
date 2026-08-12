import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { normalizePhone, sanitizeText } from '@/lib/validators';
import { ApiResponse, Member, MemberInput } from '@/lib/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Member>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as MemberInput;
    const { name, designation, mobile, bloodGroup, image, bio, roleType, orderIndex, joinedAt } = body;

    if (!name || !designation) {
      return NextResponse.json(
        { success: false, message: 'Member name and designation are required.' },
        { status: 400 }
      );
    }

    const cleanName = sanitizeText(name);
    const cleanDesignation = sanitizeText(designation);
    const normalizedMobile = mobile ? normalizePhone(mobile) || mobile.trim() : null;
    const formattedBloodGroup = bloodGroup ? bloodGroup.trim().toUpperCase() : null;
    const cleanRoleType = roleType ? sanitizeText(roleType) : 'executive';
    const cleanOrderIndex = Number.isInteger(Number(orderIndex)) ? Number(orderIndex) : 0;
    const cleanBio = bio ? sanitizeText(bio) : null;
    const cleanJoinedAt = joinedAt ? sanitizeText(joinedAt) : null;

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      const updated = (await sql`
        UPDATE members 
        SET name = ${cleanName},
            designation = ${cleanDesignation},
            mobile = ${normalizedMobile},
            blood_group = ${formattedBloodGroup},
            image = COALESCE(${image}, image),
            bio = ${cleanBio},
            role_type = ${cleanRoleType},
            order_index = ${cleanOrderIndex},
            joined_at = ${cleanJoinedAt},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, name, designation, mobile, blood_group as "bloodGroup", image, bio, role_type as "roleType", order_index as "orderIndex", joined_at as "joinedAt", created_at as "createdAt", updated_at as "updatedAt";
      `) as any[];

      if (updated.length === 0) {
        return NextResponse.json({ success: false, message: 'Member not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Member updated successfully',
        data: updated[0] as Member,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Member updated (local mode)',
      data: {
        id,
        name: cleanName,
        designation: cleanDesignation,
        mobile: normalizedMobile,
        bloodGroup: formattedBloodGroup,
        image: image || null,
        bio: cleanBio,
        roleType: cleanRoleType,
        orderIndex: cleanOrderIndex,
        joinedAt: cleanJoinedAt,
      },
    });
  } catch (err: any) {
    console.error('Error updating member:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update member in database',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      await sql`DELETE FROM members WHERE id = ${id};`;

      return NextResponse.json({
        success: true,
        message: 'Member deleted successfully from database',
        deletedId: id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Member deleted (local mode)',
      deletedId: id,
    });
  } catch (err: any) {
    console.error('Error deleting member:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete member from database',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
