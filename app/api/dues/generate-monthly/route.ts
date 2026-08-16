import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getFormattedMonthTitle(monthStr: string): string {
  // monthStr is expected as "YYYY-MM"
  const [yearStr, mStr] = monthStr.split('-');
  const monthIdx = parseInt(mStr, 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] || mStr;
  return `Monthly Fee - ${monthName} ${yearStr}`;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let billingMonth = body.month;

    // Default to current year-month
    if (!billingMonth) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      billingMonth = `${y}-${m}`;
    }

    const dueTitle = getFormattedMonthTitle(billingMonth);

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      // 1. Get all members with a positive monthly fee
      const members = (await sql`
        SELECT id, name, monthly_fee 
        FROM members 
        WHERE monthly_fee > 0;
      `) as any[];

      if (members.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No members have a monthly fee set. Please edit member profiles to set their monthly fee amount.',
          data: { generatedCount: 0, skippedCount: 0, total: 0 },
        });
      }

      // 2. Get existing monthly dues for this billing month
      const existingDues = (await sql`
        SELECT member_id 
        FROM member_dues 
        WHERE billing_month = ${billingMonth} AND due_type = 'monthly';
      `) as any[];

      const existingMemberIdSet = new Set(existingDues.map((d) => String(d.member_id)));

      // 3. Filter members who don't have a due yet
      const membersToCreate = members.filter((m) => !existingMemberIdSet.has(String(m.id)));

      if (membersToCreate.length === 0) {
        return NextResponse.json({
          success: true,
          message: `Monthly dues for ${dueTitle} have already been generated for all eligible members.`,
          data: { generatedCount: 0, skippedCount: members.length, total: members.length },
        });
      }

      // 4. Batch create dues
      let generatedCount = 0;
      for (const m of membersToCreate) {
        const feeAmount = Number(m.monthly_fee) || 0;
        if (feeAmount > 0) {
          await sql`
            INSERT INTO member_dues (member_id, title, due_type, billing_month, amount, paid_amount, status, due_date)
            VALUES (${m.id}, ${dueTitle}, 'monthly', ${billingMonth}, ${feeAmount}, 0, 'pending', ${billingMonth + '-25'});
          `;
          generatedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully generated "${dueTitle}" for ${generatedCount} member(s).`,
        data: {
          generatedCount,
          skippedCount: existingMemberIdSet.size,
          total: members.length,
          billingMonth,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Monthly dues generated successfully (Local mode)',
      data: { generatedCount: 1, skippedCount: 0, total: 1 },
    });
  } catch (err: any) {
    console.error('Error generating monthly dues:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate monthly dues.',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

