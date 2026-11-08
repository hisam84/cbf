// ==============================================================================
// Donate Card Generation & Canvas Rendering Utility
// Matches exact layout of Donate Card-01.svg (1080 x 1182.6)
// ==============================================================================

import { toBengali } from './image-compress';

export interface DonateCardData {
  image?: string | null;
  date: string;
  number: string;
  donorName?: string;
  bloodGroup?: string;
  showDonorInfo?: boolean;
  useBengaliDigits?: boolean;
  orgName?: string;
  slogan?: string;
}

const BANGLA_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

/**
 * Formats a date string (YYYY-MM-DD or standard date) into Bengali month format.
 * e.g. "8 নভেম্বর 2026" or "৮ নভেম্বর ২০২৬"
 */
export function formatCardDate(dateStr: string, useBengaliDigits = false): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const monthName = BANGLA_MONTHS[monthNum - 1] || parts[1];

  if (useBengaliDigits) {
    return `${toBengali(day)} ${monthName} ${toBengali(year)}`;
  }
  return `${day} ${monthName} ${year}`;
}

/**
 * Preloads an image into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Draws the complete Donate Card onto a 1080 x 1183 HTML5 Canvas
 */
export async function drawDonateCardToCanvas(
  canvas: HTMLCanvasElement,
  data: DonateCardData
): Promise<void> {
  const WIDTH = 1080;
  const HEIGHT = 1183;

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Ensure fonts are loaded
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('bold 92px "Noto Sans Bengali"'),
        document.fonts.load('bold 50px "Noto Sans Bengali"'),
        document.fonts.load('bold 35px "Noto Sans Bengali"')
      ]);
      await document.fonts.ready;
    } catch {
      // ignore font loading fallback
    }
  }

  // 1. Draw Background Image
  if (data.image) {
    try {
      const bgImg = await loadImage(data.image);
      // Draw background covering entire 1080 x 1183
      ctx.drawImage(bgImg, 0, 0, WIDTH, HEIGHT);
    } catch {
      // Fallback background if image fails to load
      drawFallbackBackground(ctx, WIDTH, HEIGHT);
    }
  } else {
    drawFallbackBackground(ctx, WIDTH, HEIGHT);
  }

  // 2. Draw Top-Left CBF Logo & White Circle
  // Circle cx = 115.24, cy = 122.27, r = 67.8
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(115.24, 122.27, 67.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw Logo inside Circle
  try {
    const logoImg = await loadImage('/donate-card-logo.png');
    // Diameter is ~135.6, draw logo at 126x126 centered at (115.24, 122.27)
    ctx.drawImage(logoImg, 115.24 - 63, 122.27 - 63, 126, 126);
  } catch {
    // Fallback logo placeholder if file not reachable
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 32px "Noto Sans Bengali", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CBF', 115.24, 122.27);
  }

  // 3. Draw Optional Donor Badge (Top Right)
  if (data.showDonorInfo && data.donorName) {
    ctx.save();
    const donorText = `${data.donorName}${data.bloodGroup ? ` (${data.bloodGroup})` : ''}`;
    ctx.font = 'bold 28px "Noto Sans Bengali", sans-serif';
    const textWidth = ctx.measureText(donorText).width;
    const badgeW = textWidth + 50;
    const badgeH = 50;
    const badgeX = WIDTH - badgeW - 35;
    const badgeY = 60;

    // Semi-transparent dark frosted pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 25);
    ctx.fill();

    // Red dot indicator
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(badgeX + 22, badgeY + badgeH / 2, 7, 0, Math.PI * 2);
    ctx.fill();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(donorText, badgeX + 38, badgeY + badgeH / 2);
    ctx.restore();
  }

  // 4. Date Ribbon (Red Fade Gradient)
  // y = 651.63, height = 58.2
  const dateStr = formatCardDate(data.date, !!data.useBengaliDigits);
  const dateFullText = `তারিখ: ${dateStr}`;

  ctx.save();
  ctx.font = 'bold 34px "Noto Sans Bengali", sans-serif';
  const dateTextWidth = ctx.measureText(dateFullText).width;
  const dateRibbonWidth = Math.max(380, dateTextWidth + 80);

  const gradDate = ctx.createLinearGradient(0, 680.7, dateRibbonWidth, 680.7);
  gradDate.addColorStop(0, '#A51E22');
  gradDate.addColorStop(0.37, 'rgba(165, 32, 35, 0.95)');
  gradDate.addColorStop(0.65, 'rgba(175, 65, 50, 0.65)');
  gradDate.addColorStop(0.88, 'rgba(212, 156, 137, 0.25)');
  gradDate.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradDate;
  ctx.fillRect(0, 651.63, dateRibbonWidth, 58.2);

  // Date Text
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(dateFullText, 24, 691.5);
  ctx.restore();

  // 5. Donation Number Ribbon (Green Fade Gradient)
  // y = 719.23, height = 58.2
  const numStr = data.useBengaliDigits ? toBengali(data.number) : data.number;
  const numFullText = `ডোনেট নং: ${numStr || ''}`;

  ctx.save();
  ctx.font = 'bold 34px "Noto Sans Bengali", sans-serif';
  const numTextWidth = ctx.measureText(numFullText).width;
  const numRibbonWidth = Math.max(380, numTextWidth + 80);

  const gradNum = ctx.createLinearGradient(0, 748.3, numRibbonWidth, 748.3);
  gradNum.addColorStop(0, '#009444');
  gradNum.addColorStop(0.37, 'rgba(0, 148, 69, 0.95)');
  gradNum.addColorStop(0.65, 'rgba(46, 153, 77, 0.65)');
  gradNum.addColorStop(0.88, 'rgba(138, 185, 139, 0.25)');
  gradNum.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradNum;
  ctx.fillRect(0, 719.23, numRibbonWidth, 58.2);

  // Number Text
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(numFullText, 24, 760);
  ctx.restore();

  // 6. Bottom Banner
  // Green base rect y = 942.29, height = 240.71
  ctx.fillStyle = '#009444';
  ctx.fillRect(0, 942.29, WIDTH, 241);

  // Red gradient rect y = 947.76, height = 235.24 (revealing 5.47px green line at top)
  const gradBanner = ctx.createLinearGradient(0, 1065.2, WIDTH, 1065.2);
  gradBanner.addColorStop(0, '#A4181C');
  gradBanner.addColorStop(0.012, '#A7191D');
  gradBanner.addColorStop(0.13, '#C31B21');
  gradBanner.addColorStop(0.25, '#D71C23');
  gradBanner.addColorStop(0.37, '#E61C24');
  gradBanner.addColorStop(0.5, '#ED1C24');
  gradBanner.addColorStop(0.63, '#E61C24');
  gradBanner.addColorStop(0.75, '#D71C23');
  gradBanner.addColorStop(0.87, '#C31B21');
  gradBanner.addColorStop(1, '#A4181C');

  ctx.fillStyle = gradBanner;
  ctx.fillRect(0, 947.76, WIDTH, 235.24);

  // 7. Organization Title Text
  const orgName = data.orgName || 'চাঁভালি রক্ত ফাউন্ডেশন';
  ctx.save();
  ctx.font = 'bold 84px "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillText(orgName, WIDTH / 2, 1070);
  ctx.restore();

  // 8. Divider Line
  // x = 201.72, y = 1087.69, width = 676.57, height = 4.62
  const gradLine = ctx.createLinearGradient(201.72, 1089.99, 878.28, 1089.99);
  gradLine.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  gradLine.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  gradLine.addColorStop(1, 'rgba(255, 255, 255, 0.35)');

  ctx.fillStyle = gradLine;
  ctx.fillRect(201.72, 1087.69, 676.57, 4.62);

  // 9. Slogan Text
  const slogan = data.slogan || 'রক্তের বন্ধনে, চাঁভালি সবখানে';
  ctx.save();
  ctx.font = 'bold 46px "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  ctx.fillText(slogan, WIDTH / 2, 1142);
  ctx.restore();
}

/**
 * Fallback background when no user image is loaded yet
 */
function drawFallbackBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.font = '500 36px "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('রক্তদান কার্যক্রমের ছবি যুক্ত করুন', width / 2, 450);
  ctx.restore();
}

/**
 * Generates and downloads the Donate Card as a PNG or JPG file
 */
export async function downloadDonateCard(
  data: DonateCardData,
  format: 'png' | 'jpeg' = 'png',
  filename?: string
): Promise<void> {
  const canvas = document.createElement('canvas');
  await drawDonateCardToCanvas(canvas, data);

  const cleanNum = (data.number || 'card').replace(/[^a-zA-Z0-9_-]/g, '_');
  const finalName = filename || `CBF_Donate_Card_${cleanNum}.${format === 'png' ? 'png' : 'jpg'}`;

  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'png' ? undefined : 0.95;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas toBlob returned null'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, mime, quality);
  });
}

