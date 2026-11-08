import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { getFacebookSettings, saveFacebookSettings } from '@/lib/db';
import { ApiResponse, FacebookSettings } from '@/lib/types';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<FacebookSettings>>> {
  const auth = verifyAdminRequest(req, 'settings');
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, message: auth.error || 'অননুমোদিত এক্সেস' }, { status: 401 });
  }

  try {
    const settings = await getFacebookSettings();
    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        hasToken: Boolean(settings.pageAccessToken && settings.pageAccessToken.length > 5),
      },
    });
  } catch (err: any) {
    console.error('Error getting Facebook settings:', err);
    return NextResponse.json(
      { success: false, message: 'ফেসবুক সেটিংস লোড করতে সমস্যা হয়েছে: ' + (err?.message || err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<FacebookSettings>>> {
  const auth = verifyAdminRequest(req, 'settings');
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, message: auth.error || 'অননুমোদিত এক্সেস' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { postingMode, pageId, pageAccessToken, groupUrl, captionTemplate } = body;

    const updated = await saveFacebookSettings({
      postingMode: postingMode || 'both',
      pageId: typeof pageId === 'string' ? pageId.trim() : undefined,
      pageAccessToken: typeof pageAccessToken === 'string' ? pageAccessToken.trim() : undefined,
      groupUrl: typeof groupUrl === 'string' ? groupUrl.trim() : undefined,
      captionTemplate: typeof captionTemplate === 'string' ? captionTemplate : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'ফেসবুক সেটিংস সফলভাবে সংরক্ষিত হয়েছে।',
      data: {
        ...updated,
        hasToken: Boolean(updated.pageAccessToken && updated.pageAccessToken.length > 5),
      },
    });
  } catch (err: any) {
    console.error('Error saving Facebook settings:', err);
    return NextResponse.json(
      { success: false, message: 'ফেসবুক সেটিংস সংরক্ষণে ত্রুটি: ' + (err?.message || err) },
      { status: 500 }
    );
  }
}

