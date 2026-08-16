import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getSql, ensureTablesExist } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { sanitizeText } from '@/lib/validators';
import { ApiResponse, MemberDue } from '@/lib/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<MemberDue>>> {
  try {
    await ensureTablesExist();
    const auth = verifyAdminRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const {
      title,
      amount,
      paidAmount,
      status,
      dueDate,
      paymentDate,
      paymentMethod,
      paymentNote,
      notes,
    } = body;

    if (isConfigured()) {
      const sql = getSql();
      if (!sql) {
        return NextResponse.json({ success: false, message: 'Database client not ready' }, { status: 500 });
      }

      // Check existing due
      const existing = (await sql`SELECT * FROM member_dues WHERE id = ${id};`) as any[];
      if (existing.length === 0) {
        return NextResponse.json({ success: false, message: 'ডিউ পাওয়া যায়নি।' }, { status: 404 });
      }

      const cur = existing[0];
      const newTitle = title !== undefined ? sanitizeText(title) : cur.title;
      const newAmount = amount !== undefined && Number(amount) >= 0 ? Number(amount) : Number(cur.amount);
      const newPaidAmount = paidAmount !== undefined && Number(paidAmount) >= 0 ? Number(paidAmount) : Number(cur.paid_amount);
      
      // Compute status based on paid amount if not explicitly given
      let newStatus = status;
      if (!newStatus) {
        if (newPaidAmount >= newAmount && newAmount > 0) {
          newStatus = 'paid';
        } else if (newPaidAmount > 0 && newPaidAmount < newAmount) {
          newStatus = 'partial';
        } else {
          newStatus = 'pending';
        }
      }

      const newDueDate = dueDate !== undefined ? (dueDate ? sanitizeText(dueDate) : null) : cur.due_date;
      const newPaymentDate = paymentDate !== undefined ? (paymentDate ? sanitizeText(paymentDate) : null) : cur.payment_date;
      const newPaymentMethod = paymentMethod !== undefined ? (paymentMethod ? sanitizeText(paymentMethod) : null) : cur.payment_method;
      const newPaymentNote = paymentNote !== undefined ? (paymentNote ? sanitizeText(paymentNote) : null) : cur.payment_note;
      const newNotes = notes !== undefined ? (notes ? sanitizeText(notes) : null) : cur.notes;

      const updated = (await sql`
        UPDATE member_dues
        SET title = ${newTitle},
            amount = ${newAmount},
            paid_amount = ${newPaidAmount},
            status = ${newStatus},
            due_date = ${newDueDate},
            payment_date = ${newPaymentDate},
            payment_method = ${newPaymentMethod},
            payment_note = ${newPaymentNote},
            notes = ${newNotes},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, member_id as "memberId", title, due_type as "dueType", billing_month as "billingMonth", amount, paid_amount as "paidAmount", status, due_date as "dueDate", payment_date as "paymentDate", payment_method as "paymentMethod", payment_note as "paymentNote", notes, created_at as "createdAt", updated_at as "updatedAt";
      `) as any[];

      return NextResponse.json({
        success: true,
        message: 'ডিউ তথ্য সফলভাবে আপডেট করা হয়েছে।',
        data: {
          ...updated[0],
          amount: Number(updated[0]?.amount) || 0,
          paidAmount: Number(updated[0]?.paidAmount) || 0,
        } as MemberDue,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'ডিউ আপডেট করা হয়েছে (লোকাল মোড)',
      data: {
        id,
        memberId: 1,
        title: title || 'Updated Due',
        amount: Number(amount) || 0,
        paidAmount: Number(paidAmount) || 0,
        status: status || 'paid',
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      } as MemberDue,
    });
  } catch (err: any) {
    console.error('Error updating member due:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'ডিউ আপডেট করতে সমস্যা হয়েছে।',
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

      await sql`DELETE FROM member_dues WHERE id = ${id};`;

      return NextResponse.json({
        success: true,
        message: 'ডিউ সফলভাবে ডিলিট করা হয়েছে।',
        deletedId: id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'ডিউ ডিলিট করা হয়েছে (লোকাল মোড)',
      deletedId: id,
    });
  } catch (err: any) {
    console.error('Error deleting member due:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'ডিউ ডিলিট করতে সমস্যা হয়েছে।',
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
