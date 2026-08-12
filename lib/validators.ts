// ==============================================================================
// Validation & Formatting Helpers (TypeScript)
// Phone normalization, blood group validation, text sanitizers, eligibility calculation
// ==============================================================================

import { ValidBloodGroup, VALID_BLOOD_GROUPS, BloodCompatibility } from './types';

/**
 * Normalizes Bangladeshi phone numbers into standard 11-digit local format: 01XXXXXXXXX
 */
export function normalizePhone(phone: string | number | null | undefined): string {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');

  // Format +8801XXXXXXXXX or 8801XXXXXXXXX -> 01XXXXXXXXX
  if (digits.startsWith('880') && digits.length >= 13) {
    digits = '0' + digits.slice(3);
  }
  // Format 1XXXXXXXXX (missing leading zero) -> 01XXXXXXXXX
  if (digits.startsWith('1') && digits.length === 10) {
    digits = '0' + digits;
  }
  return digits;
}

/**
 * Checks if a string is a valid blood group
 */
export function isValidBloodGroup(bg: string | null | undefined): bg is ValidBloodGroup {
  if (!bg) return false;
  const formatted = bg.trim().toUpperCase();
  return (VALID_BLOOD_GROUPS as readonly string[]).includes(formatted);
}

export function validateBloodGroup(bg: string | null | undefined): boolean {
  return isValidBloodGroup(bg);
}

/**
 * Sanitizes text to prevent injection / trim whitespace
 */
export function sanitizeText(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.trim();
}

/**
 * Calculate donor eligibility based on last donation date (standard 90 days interval)
 */
export function calculateEligibility(lastDonationDateStr?: string | null): {
  isEligible: boolean;
  daysUntilEligible: number;
  daysSinceLastDonation: number | null;
  nextEligibleDate: string | null;
  statusTextBengali: string;
} {
  if (!lastDonationDateStr || !lastDonationDateStr.trim()) {
    return {
      isEligible: true,
      daysUntilEligible: 0,
      daysSinceLastDonation: null,
      nextEligibleDate: null,
      statusTextBengali: 'রক্তদানের জন্য প্রস্তুত 🩸',
    };
  }

  const lastDate = new Date(lastDonationDateStr);
  if (isNaN(lastDate.getTime())) {
    return {
      isEligible: true,
      daysUntilEligible: 0,
      daysSinceLastDonation: null,
      nextEligibleDate: null,
      statusTextBengali: 'রক্তদানের জন্য প্রস্তুত 🩸',
    };
  }

  const now = new Date();
  const diffTime = now.getTime() - lastDate.getTime();
  const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const MIN_DAYS_BETWEEN_DONATIONS = 90; // 3 months in Bangladesh standard

  if (daysSince >= MIN_DAYS_BETWEEN_DONATIONS) {
    return {
      isEligible: true,
      daysUntilEligible: 0,
      daysSinceLastDonation: daysSince,
      nextEligibleDate: null,
      statusTextBengali: 'রক্তদানের জন্য প্রস্তুত 🩸',
    };
  } else {
    const daysRemaining = MIN_DAYS_BETWEEN_DONATIONS - daysSince;
    const nextDate = new Date(lastDate.getTime() + MIN_DAYS_BETWEEN_DONATIONS * 24 * 60 * 60 * 1000);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    return {
      isEligible: false,
      daysUntilEligible: daysRemaining,
      daysSinceLastDonation: daysSince,
      nextEligibleDate: nextDateStr,
      statusTextBengali: `অপেক্ষমাণ (${daysRemaining} দিন পর রক্তদান করতে পারবেন)`,
    };
  }
}

/**
 * Blood Compatibility Table and Information
 */
export const BLOOD_COMPATIBILITY_MAP: Record<ValidBloodGroup, BloodCompatibility> = {
  'O-': {
    group: 'O-',
    canGiveTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    canReceiveFrom: ['O-'],
    description: 'সর্বজনীন রক্তদাতা (Universal Red Cell Donor)। যে কোনো রক্তের গ্রুপের রোগীকে রক্ত দিতে পারেন।',
    isUniversalDonor: true,
  },
  'O+': {
    group: 'O+',
    canGiveTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O+', 'O-'],
    description: 'সর্বাধিক চাহিদাসম্পন্ন রক্তের গ্রুপ। সকল পজিটিভ গ্রুপের রোগীকে রক্ত দিতে পারেন।',
  },
  'A-': {
    group: 'A-',
    canGiveTo: ['A+', 'A-', 'AB+', 'AB-'],
    canReceiveFrom: ['A-', 'O-'],
    description: 'A ও AB পজিটিভ এবং নেগেটিভ রোগীদের রক্ত দিতে পারেন।',
  },
  'A+': {
    group: 'A+',
    canGiveTo: ['A+', 'AB+'],
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    description: 'A+ এবং AB+ গ্রুপের রোগীদের রক্ত দিতে পারেন।',
  },
  'B-': {
    group: 'B-',
    canGiveTo: ['B+', 'B-', 'AB+', 'AB-'],
    canReceiveFrom: ['B-', 'O-'],
    description: 'B ও AB পজিটিভ এবং নেগেটিভ উভয় গ্রুপের রোগীদের রক্ত দিতে পারেন।',
  },
  'B+': {
    group: 'B+',
    canGiveTo: ['B+', 'AB+'],
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    description: 'B+ এবং AB+ গ্রুপের রোগীদের রক্ত দিতে পারেন।',
  },
  'AB-': {
    group: 'AB-',
    canGiveTo: ['AB+', 'AB-'],
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    description: 'AB+ এবং AB- গ্রুপের রোগীদের রক্ত দিতে পারেন।',
  },
  'AB+': {
    group: 'AB+',
    canGiveTo: ['AB+'],
    canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    description: 'সর্বজনীন গ্রহীতা (Universal Recipient)। যেকোনো রক্তের গ্রুপের কাছ থেকে রক্ত গ্রহণ করতে পারেন।',
    isUniversalRecipient: true,
  },
};
