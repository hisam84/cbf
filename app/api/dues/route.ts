import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { sanitizeText } from '@/lib/validators';
import { ApiResponse, MemberDue, MemberDueInput } from '@/lib/types';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<MemberDue[]>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const status = searchParams.get('status');
    const dueType = searchParams.get('dueType');
    const billingMonth = searchParams.get('billingMonth');

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready', data: [] }, { status: 500 });
      }

      // Fetch dues joined with members table
      const rows = (await sql`
        SELECT 
          d.id, 
          d.member_id as "memberId", 
          m.name as "memberName",
          m.mobile as "memberPhone",
          m.designation as "memberDesignation",
          d.title, 
          d.due_type as "dueType", 
          d.billing_month as "billingMonth", 
          d.amount, 
          d.paid_amount as "paidAmount", 
          d.status, 
          d.due_date as "dueDate", 
          d.payment_date as "paymentDate", 
          d.payment_method as "paymentMethod", 
          d.payment_note as "paymentNote", 
          d.notes, 
          d.created_at as "createdAt", 
          d.updated_at as "updatedAt"
        FROM member_dues d
        LEFT JOIN members m ON d.member_id = m.id
        ORDER BY d.created_at DESC;
      `) as any[];

      let filtered = rows.map((r) => ({
        ...r,
        amount: Number(r.amount) || 0,
        paidAmount: Number(r.paidAmount) || 0,
      }));

      if (memberId && memberId !== 'all') {
        filtered = filtered.filter((r) => String(r.memberId) === String(memberId));
      }
      if (status && status !== 'all') {
        filtered = filtered.filter((r) => r.status === status);
      }
      if (dueType && dueType !== 'all') {
        filtered = filtered.filter((r) => r.dueType === dueType);
      }
      if (billingMonth) {
        filtered = filtered.filter((r) => r.billingMonth === billingMonth);
      }

      return NextResponse.json({
        success: true,
        source: 'neon_postgres',
        count: filtered.length,
        data: filtered as MemberDue[],
      });
    }

    return NextResponse.json({
      success: true,
      source: 'unconfigured',
      count: 0,
      data: [],
    });
  } catch (err: any) {
    console.error('Error fetching member dues:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch member dues from database',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<MemberDue | MemberDue[]>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as MemberDueInput;
    const { memberId, title, dueType, billingMonth, amount, dueDate, notes, targetType } = body;

    if (!title || Number(amount) <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'চাঁদার বিবরণ (Title) এবং সঠিক পরিমাণ (Amount) আবশ্যক।',
        },
        { status: 400 }
      );
    }

    const cleanTitle = sanitizeText(title);
    const cleanDueType = dueType ? sanitizeText(dueType) : 'event';
    const cleanBillingMonth = billingMonth ? sanitizeText(billingMonth) : null;
    const cleanAmount = Number(amount);
    const cleanDueDate = dueDate ? sanitizeText(dueDate) : null;
    const cleanNotes = notes ? sanitizeText(notes) : null;

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      // If target is "all" or memberId === "all", create due for every existing member
      if (targetType === 'all' || memberId === 'all') {
        const members = (await sql`SELECT id FROM members;`) as any[];
        if (members.length === 0) {
          return NextResponse.json({ success: false, message: 'কোনো মেম্বার পাওয়া যায়নি।' }, { status: 400 });
        }

        const insertedList: MemberDue[] = [];
        for (const m of members) {
          const res = (await sql`
            INSERT INTO member_dues (member_id, title, due_type, billing_month, amount, paid_amount, status, due_date, notes)
            VALUES (${m.id}, ${cleanTitle}, ${cleanDueType}, ${cleanBillingMonth}, ${cleanAmount}, 0, 'pending', ${cleanDueDate}, ${cleanNotes})
            RETURNING id, member_id as "memberId", title, due_type as "dueType", billing_month as "billingMonth", amount, paid_amount as "paidAmount", status, due_date as "dueDate", notes, created_at as "createdAt";
          `) as any[];
          if (res.length > 0) {
            insertedList.push({
              ...res[0],
              amount: Number(res[0].amount) || 0,
              paidAmount: Number(res[0].paidAmount) || 0,
            });
          }
        }

        return NextResponse.json(
          {
            success: true,
            message: `সকল ${insertedList.length} জন মেম্বারের জন্য ডিউ সফলভাবে তৈরি করা হয়েছে।`,
            data: insertedList,
          },
          { status: 201 }
        );
      }

      // Single member due
      if (!memberId) {
        return NextResponse.json({ success: false, message: 'মেম্বার নির্বাচন করা আবশ্যক।' }, { status: 400 });
      }

      const inserted = (await sql`
        INSERT INTO member_dues (member_id, title, due_type, billing_month, amount, paid_amount, status, due_date, notes)
        VALUES (${memberId}, ${cleanTitle}, ${cleanDueType}, ${cleanBillingMonth}, ${cleanAmount}, 0, 'pending', ${cleanDueDate}, ${cleanNotes})
        RETURNING id, member_id as "memberId", title, due_type as "dueType", billing_month as "billingMonth", amount, paid_amount as "paidAmount", status, due_date as "dueDate", notes, created_at as "createdAt";
      `) as any[];

      return NextResponse.json(
        {
          success: true,
          message: 'ডিউ সফলভাবে তৈরি করা হয়েছে।',
          data: {
            ...inserted[0],
            amount: Number(inserted[0]?.amount) || 0,
            paidAmount: Number(inserted[0]?.paidAmount) || 0,
          } as MemberDue,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'ডিউ রেকর্ড করা হয়েছে (লোকাল মোড)',
        data: {
          id: Date.now(),
          memberId: memberId || 1,
          title: cleanTitle,
          dueType: cleanDueType,
          billingMonth: cleanBillingMonth,
          amount: cleanAmount,
          paidAmount: 0,
          status: 'pending',
          dueDate: cleanDueDate,
          notes: cleanNotes,
          createdAt: new Date().toISOString(),
        } as MemberDue,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error creating member due:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'ডিউ তৈরি করতে সমস্যা হয়েছে।',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
