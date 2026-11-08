import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { getFacebookSettings } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const auth = verifyAdminRequest(req, 'settings');
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, message: auth.error || 'অননুমোদিত এক্সেস' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const settings = await getFacebookSettings();

    const pageId = (body.pageId || settings.pageId || '').trim();
    const pageAccessToken = (body.pageAccessToken || settings.pageAccessToken || '').trim();

    if (!pageId) {
      return NextResponse.json(
        { success: false, message: 'ফেসবুক পেজ আইডি (Page ID) প্রদান করুন।' },
        { status: 400 }
      );
    }

    if (!pageAccessToken) {
      return NextResponse.json(
        { success: false, message: 'ফেসবুক পেজ অ্যাক্সেস টোকেন (Page Access Token) প্রদান করুন।' },
        { status: 400 }
      );
    }

    const fbUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}?fields=id,name,link,category,verification_status&access_token=${encodeURIComponent(pageAccessToken)}`;

    const response = await fetch(fbUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `ফেসবুক API রেসপন্স কোড: ${response.status}`;
      return NextResponse.json({
        success: false,
        message: `কানেকশন ব্যর্থ হয়েছে: ${errorMsg}`,
        error: errorMsg,
      });
    }

    return NextResponse.json({
      success: true,
      message: `কানেকশন সফল! পেজের নাম: "${data.name || pageId}"`,
      data: {
        pageId: data.id,
        pageName: data.name,
        pageLink: data.link,
      },
    });
  } catch (err: any) {
    console.error('Error testing Facebook connection:', err);
    return NextResponse.json(
      { success: false, message: 'ফেসবুক সার্ভারে কানেক্ট করতে ব্যর্থ হয়েছে: ' + (err?.message || err) },
      { status: 500 }
    );
  }
}

