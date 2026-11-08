import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { getFacebookSettings } from '@/lib/db';
import { ApiResponse, FacebookPostResponse } from '@/lib/types';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<FacebookPostResponse>>> {
  const auth = verifyAdminRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, message: auth.error || 'অননুমোদিত এক্সেস' }, { status: 401 });
  }

  try {
    const settings = await getFacebookSettings();

    const contentType = req.headers.get('content-type') || '';
    let imageBase64: string = '';
    let caption: string = '';

    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      imageBase64 = body.image || '';
      caption = body.caption || '';
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const imageField = formData.get('image');
      caption = (formData.get('caption') as string) || '';

      if (typeof imageField === 'string') {
        imageBase64 = imageField;
      } else if (imageField && typeof (imageField as Blob).arrayBuffer === 'function') {
        const arrayBuf = await (imageField as Blob).arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const mime = (imageField as Blob).type || 'image/png';
        imageBase64 = `data:${mime};base64,${buffer.toString('base64')}`;
      }
    }

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, message: 'পোস্ট করার জন্য ফটোকার্ড ইমেজ প্রদান করুন।' },
        { status: 400 }
      );
    }

    const pageId = settings.pageId;
    const pageAccessToken = settings.pageAccessToken;

    if (!pageId || !pageAccessToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'ফেসবুক পেজ আইডি অথবা পেজ অ্যাক্সেস টোকেন কনফিগার করা নেই। অনুগ্রহ করে এডমিন সেটিংস থেকে কনফিগার করুন।',
        },
        { status: 400 }
      );
    }

    // Parse base64
    let mimeType = 'image/png';
    let base64Data = imageBase64;
    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');
    const imageBlob = new Blob([imageBuffer], { type: mimeType });

    const fbFormData = new FormData();
    fbFormData.append('access_token', pageAccessToken);
    fbFormData.append('caption', caption || '');
    fbFormData.append('published', 'true');
    fbFormData.append('source', imageBlob, `donate_card_${Date.now()}.${mimeType.includes('jpeg') ? 'jpg' : 'png'}`);

    const fbEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/photos`;

    const fbResponse = await fetch(fbEndpoint, {
      method: 'POST',
      body: fbFormData,
    });

    const fbData = await fbResponse.json();

    if (!fbResponse.ok || fbData.error) {
      const errorMsg = fbData.error?.message || `ফেসবুক API রেসপন্স কোড: ${fbResponse.status}`;
      return NextResponse.json(
        {
          success: false,
          message: `ফেসবুকে পোস্ট ব্যর্থ হয়েছে: ${errorMsg}`,
          error: errorMsg,
        },
        { status: 400 }
      );
    }

    const photoId = fbData.id;
    const postId = fbData.post_id || photoId;

    let postUrl = '';
    if (fbData.post_id && fbData.post_id.includes('_')) {
      const parts = fbData.post_id.split('_');
      postUrl = `https://www.facebook.com/${parts[0]}/posts/${parts[1]}`;
    } else if (photoId) {
      postUrl = `https://www.facebook.com/photo.php?fbid=${photoId}`;
    }

    return NextResponse.json({
      success: true,
      message: 'ফটোকার্ডটি সফলভাবে ফেসবুক পেজে পোস্ট করা হয়েছে!',
      data: {
        success: true,
        postId: postId,
        postUrl: postUrl,
        groupUrl: settings.groupUrl || 'https://www.facebook.com/groups/chavalibloodfoundation',
      },
    });
  } catch (err: any) {
    console.error('Error posting donate card to Facebook:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'সার্ভারে ত্রুটি হয়েছে: ' + (err?.message || err),
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

