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
  showDonorName?: boolean;
  showBloodBadge?: boolean;
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

  // 1b. Cinematic Vignette Gradients for Contrast & Pop
  // Top Vignette (makes logo & top badge stand out regardless of photo background)
  const topVignette = ctx.createLinearGradient(0, 0, 0, 240);
  topVignette.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  topVignette.addColorStop(0.5, 'rgba(0, 0, 0, 0.28)');
  topVignette.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topVignette;
  ctx.fillRect(0, 0, WIDTH, 240);

  // Bottom Vignette (smoothly fades photo into footer banner)
  const bottomVignette = ctx.createLinearGradient(0, 740, 0, 943);
  bottomVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottomVignette.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
  bottomVignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  ctx.fillStyle = bottomVignette;
  ctx.fillRect(0, 740, WIDTH, 203);

  // 2. Draw Top-Left CBF Logo & White Circle
  // Circle cx = 115.24, cy = 122.27, r = 67.8
  ctx.save();
  // Outer glowing ring
  ctx.shadowColor = 'rgba(220, 38, 38, 0.45)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.arc(115.24, 122.27, 72, 0, Math.PI * 2);
  ctx.fill();

  // Main white circle
  ctx.shadowColor = 'rgba(0, 0, 0, 0.38)';
  ctx.shadowBlur = 14;
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
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 32px "Noto Sans Bengali", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CBF', 115.24, 122.27);
  }

  // 3. Top-Right Blood Group & Noble Donor Badge (NEW & OPTIMIZED!)
  if (data.bloodGroup) {
    ctx.save();
    const bgText = String(data.bloodGroup).trim();
    const badgeW = 210;
    const badgeH = 76;
    const badgeX = WIDTH - badgeW - 35;
    const badgeY = 84;

    // Glowing Pill Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 5;

    // Gradient Pill Background
    const pillGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
    pillGrad.addColorStop(0, '#991B1B');
    pillGrad.addColorStop(0.5, '#DC2626');
    pillGrad.addColorStop(1, '#991B1B');

    ctx.fillStyle = pillGrad;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 18);
    ctx.fill();

    // Golden / White Frosted Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Reset shadow for text
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';

    // Blood Drop / Heart symbol + Blood Group
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Noto Sans Bengali", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`🩸 ${bgText}`, badgeX + badgeW / 2, badgeY + 40);

    // Sub-text: "স্বেচ্ছায় রক্তদান"
    ctx.font = '600 18px "Noto Sans Bengali", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText('স্বেচ্ছায় রক্তদান', badgeX + badgeW / 2, badgeY + 64);
    ctx.restore();
  }

  // 4. Left-Side Information Ribbons
  // If donorName is present, we draw 3 ribbons: Donor Name, Date, and Donate No.
  const hasDonorName = Boolean(data.donorName && data.donorName.trim() !== '');

  // Positions:
  // With Donor Name: Donor at y=583, Date at y=651.63, Number at y=719.23
  // Without Donor Name: Date at y=651.63, Number at y=719.23
  const dateStr = formatCardDate(data.date, !!data.useBengaliDigits);
  const dateFullText = `তারিখ: ${dateStr}`;

  const numStr = data.useBengaliDigits ? toBengali(data.number) : data.number;
  const numFullText = `ডোনেট নং: ${numStr || ''}`;

  // 4a. DONOR NAME RIBBON (NEW & HIGHLIGHTED!)
  if (hasDonorName) {
    const donorFullText = `রক্তদাতা: ${data.donorName}`;
    ctx.save();
    ctx.font = 'bold 34px "Noto Sans Bengali", sans-serif';
    const donorTextWidth = ctx.measureText(donorFullText).width;
    const donorRibbonWidth = Math.max(420, donorTextWidth + 85);

    // Royal Deep Burgundy/Red Gradient
    const gradDonor = ctx.createLinearGradient(0, 612, donorRibbonWidth, 612);
    gradDonor.addColorStop(0, '#7F1D1D');
    gradDonor.addColorStop(0.35, 'rgba(153, 27, 27, 0.96)');
    gradDonor.addColorStop(0.7, 'rgba(185, 28, 28, 0.65)');
    gradDonor.addColorStop(0.9, 'rgba(220, 38, 38, 0.25)');
    gradDonor.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradDonor;
    ctx.fillRect(0, 583, donorRibbonWidth, 58.2);

    // Accent line at top of donor ribbon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(0, 583, donorRibbonWidth * 0.85, 1.5);

    // Donor Text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(donorFullText, 24, 623);
    ctx.restore();
  }

  // 4b. DATE RIBBON
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

  // 4c. DONATION NUMBER RIBBON
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

  // 5. Bottom Foundation Banner (REDESIGNED & ELEVATED!)
  // Green base rect y = 942.29, height = 240.71
  ctx.fillStyle = '#009444';
  ctx.fillRect(0, 942.29, WIDTH, 241);

  // Glowing Green/Gold Highlight Hairline
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(0, 942.29, WIDTH, 2);

  // Red gradient rect y = 947.76, height = 235.24 (revealing 5.47px green line at top)
  const gradBanner = ctx.createLinearGradient(0, 1065.2, WIDTH, 1065.2);
  gradBanner.addColorStop(0, '#7F1D1D');
  gradBanner.addColorStop(0.015, '#991B1B');
  gradBanner.addColorStop(0.15, '#B91C1C');
  gradBanner.addColorStop(0.35, '#DC2626');
  gradBanner.addColorStop(0.5, '#EF4444');
  gradBanner.addColorStop(0.65, '#DC2626');
  gradBanner.addColorStop(0.85, '#B91C1C');
  gradBanner.addColorStop(0.985, '#991B1B');
  gradBanner.addColorStop(1, '#7F1D1D');

  ctx.fillStyle = gradBanner;
  ctx.fillRect(0, 947.76, WIDTH, 235.24);

  // Radial illumination in banner center for depth
  const radGlow = ctx.createRadialGradient(WIDTH / 2, 1070, 20, WIDTH / 2, 1070, 480);
  radGlow.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
  radGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = radGlow;
  ctx.fillRect(0, 947.76, WIDTH, 235.24);

  // 6. Organization Title Text
  const orgName = data.orgName || 'চাঁভালি রক্ত ফাউন্ডেশন';
  ctx.save();
  ctx.font = 'bold 84px "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillText(orgName, WIDTH / 2, 1068);
  ctx.restore();

  // 7. Divider Line with Center Diamond Emblem
  const gradLine = ctx.createLinearGradient(180, 1089.99, 900, 1089.99);
  gradLine.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  gradLine.addColorStop(0.42, 'rgba(255, 255, 255, 0.15)');
  gradLine.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  gradLine.addColorStop(0.58, 'rgba(255, 255, 255, 0.15)');
  gradLine.addColorStop(1, 'rgba(255, 255, 255, 0.45)');

  ctx.fillStyle = gradLine;
  ctx.fillRect(180, 1087.69, 720, 3.5);

  // Center Emblem: Diamond ❖
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('❖', WIDTH / 2, 1089);
  ctx.restore();

  // 8. Slogan Text
  const slogan = data.slogan || 'রক্তের বন্ধনে, চাঁভালি সবখানে';
  ctx.save();
  ctx.font = 'bold 46px "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  ctx.fillText(slogan, WIDTH / 2, 1142);
  ctx.restore();

  // 9. Premium Inset Border Framing
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(12, 12, WIDTH - 24, HEIGHT - 24);
  ctx.restore();
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

/**
 * Automatically computes the next serial / donation ID from existing donation records.
 * Supports pure numeric formats (e.g. 3747 -> 3748, 3800 -> 3801) as well as
 * prefixed formats (e.g. CBF-2026-001 -> CBF-2026-002).
 */
export function getNextDonationNumber(donations: Array<{ number?: string | null }>): string {
  if (!donations || donations.length === 0) return '3800';

  let maxNum = -1;
  let bestPrefix = '';
  let bestPadLength = 0;

  for (const d of donations) {
    const str = String((d && d.number) || '').trim();
    const match = str.match(/^(.*?)(\d+)$/);
    if (match) {
      const num = parseInt(match[2], 10);
      if (num > maxNum) {
        maxNum = num;
        bestPrefix = match[1];
        bestPadLength = match[2].length;
      }
    }
  }

  if (maxNum >= 0) {
    const nextNum = maxNum + 1;
    const padded = bestPadLength > 1 ? String(nextNum).padStart(bestPadLength, '0') : String(nextNum);
    return bestPrefix + padded;
  }

  return '3800';
}

