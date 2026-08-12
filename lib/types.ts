// ==============================================================================
// Chavali Blood Foundation (চাঁভালি রক্ত ফাউন্ডেশন) - Core TypeScript Definitions
// ==============================================================================

export type ValidBloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type BloodGroupFilter = 'all' | ValidBloodGroup;

export const VALID_BLOOD_GROUPS: readonly ValidBloodGroup[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;

export const ALL_BLOOD_GROUP_FILTERS: readonly BloodGroupFilter[] = [
  'all',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;

// ------------------------------------------------------------------------------
// Database & Entity Models
// ------------------------------------------------------------------------------

export interface Donor {
  id: number | string;
  name: string;
  mobile: string;
  bloodGroup: ValidBloodGroup | string;
  address: string;
  lastDonation?: string | null;
  gender?: string | null;
  dob?: string | null;
  registeredAt?: string | null;
  updatedAt?: string | null;
  // Computed helpers for client display
  isEligible?: boolean;
  daysUntilEligible?: number;
  daysSinceLastDonation?: number | null;
}

export interface DonorInput {
  name: string;
  mobile: string;
  bloodGroup: string;
  address: string;
  lastDonation?: string | null;
  gender?: string | null;
  dob?: string | null;
}

export interface Donation {
  id: number | string;
  donorName: string;
  donorPhone: string;
  donorAddress: string;
  number: string;
  bloodGroup: ValidBloodGroup | string;
  date: string;
  image?: string | null;
  notes?: string | null;
  addedAt?: string | null;
  updatedAt?: string | null;
}

export interface DonationInput {
  donorName: string;
  donorPhone: string;
  donorAddress: string;
  number: string;
  bloodGroup: string;
  date: string;
  image?: string | null;
  notes?: string | null;
}

export interface Certificate {
  id: number | string;
  donationId?: number | string | null;
  donorName: string;
  bloodGroup: ValidBloodGroup | string;
  donationDate: string;
  phone?: string | null;
  address?: string | null;
  donationNumber?: string | null;
  message?: string | null;
  htmlContent?: string | null;
  generatedAt?: string | null;
}

export interface CertificateInput {
  donationId?: number | string | null;
  donorName: string;
  bloodGroup: string;
  donationDate: string;
  phone?: string | null;
  address?: string | null;
  donationNumber?: string | null;
  message?: string | null;
  htmlContent?: string | null;
}

export interface GalleryItem {
  id: number | string;
  caption?: string | null;
  data: string;
  imageData?: string;
  category: 'general' | 'donation' | 'campaign' | string;
  uploadedAt?: string | null;
}

export interface ContactMessage {
  id: number | string;
  name: string;
  phone?: string | null;
  email?: string | null;
  subject?: string | null;
  message: string;
  isRead?: boolean;
  createdAt?: string | null;
}

export interface AdminUser {
  id: number | string;
  username: string;
  passwordHash?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JWTPayload {
  id: number | string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthVerificationResult {
  authenticated: boolean;
  admin?: {
    id: number | string;
    username: string;
  };
  error?: string;
}

// ------------------------------------------------------------------------------
// API & Analytics Models
// ------------------------------------------------------------------------------

export interface StatsData {
  totalDonors: number;
  totalDonations: number;
  totalCertificates: number;
  bloodGroupBreakdown: Record<string, number>;
}

export interface DbStatus {
  connected: boolean;
  configured: boolean;
  message: string;
  latencyMs?: number | null;
  timestamp?: string;
  version?: string;
  tables?: string[];
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  count?: number;
  stats?: StatsData;
  source?: string;
  token?: string;
  admin?: {
    username: string;
    id?: number | string;
  };
  valid?: boolean;
  deletedId?: string;
  existingDonorId?: number | string;
  database?: DbStatus;
}

// ------------------------------------------------------------------------------
// Blood Compatibility Types
// ------------------------------------------------------------------------------

export interface BloodCompatibility {
  group: ValidBloodGroup;
  canGiveTo: ValidBloodGroup[];
  canReceiveFrom: ValidBloodGroup[];
  description: string;
  isUniversalDonor?: boolean;
  isUniversalRecipient?: boolean;
}
