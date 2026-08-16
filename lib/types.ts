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

export interface Member {
  id: number | string;
  name: string;
  designation: string;
  mobile?: string | null;
  bloodGroup?: ValidBloodGroup | string | null;
  image?: string | null;
  bio?: string | null;
  roleType?: 'adviser' | 'executive' | 'member' | string;
  orderIndex?: number;
  monthlyFee?: number;
  joinedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MemberInput {
  name: string;
  designation: string;
  mobile?: string | null;
  bloodGroup?: string | null;
  image?: string | null;
  bio?: string | null;
  roleType?: string;
  orderIndex?: number;
  monthlyFee?: number;
  joinedAt?: string | null;
}

export interface MemberDue {
  id: number | string;
  memberId: number | string;
  memberName?: string;
  memberPhone?: string | null;
  memberDesignation?: string | null;
  title: string;
  dueType: 'monthly' | 'event' | 'custom' | string;
  billingMonth?: string | null;
  amount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'partial' | string;
  dueDate?: string | null;
  paymentDate?: string | null;
  paymentMethod?: 'cash' | 'bkash' | 'nagad' | 'bank' | string | null;
  paymentNote?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MemberDueInput {
  memberId?: number | string | 'all';
  title: string;
  dueType?: 'monthly' | 'event' | 'custom' | string;
  billingMonth?: string | null;
  amount: number;
  paidAmount?: number;
  status?: string;
  dueDate?: string | null;
  notes?: string | null;
  // If creating for all members or single
  targetType?: 'single' | 'all';
}

export interface DuePaymentInput {
  paidAmount: number;
  paymentDate?: string;
  paymentMethod?: 'cash' | 'bkash' | 'nagad' | 'bank' | string;
  paymentNote?: string;
  status?: string;
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

export type AdminPermissionKey =
  | 'donors'
  | 'donations'
  | 'members'
  | 'dues'
  | 'certificates'
  | 'gallery'
  | 'messages'
  | 'analytics'
  | 'settings'
  | 'users'
  | 'all';

export interface PermissionDefinition {
  key: AdminPermissionKey;
  label: string;
  category: string;
  description: string;
}

export const PERMISSIONS_LIST: readonly PermissionDefinition[] = [
  { key: 'donors', label: 'রক্তদাতা ডিরেক্টরি', category: 'ম্যানেজমেন্ট', description: 'রক্তদাতা যোগ, এডিট, ভিউ ও ডিলিট করার এক্সেস' },
  { key: 'donations', label: 'রক্তদান রেকর্ড', category: 'ম্যানেজমেন্ট', description: 'রক্তদানের হিস্ট্রি ও নতুন রক্তদান এন্ট্রি' },
  { key: 'members', label: 'মেম্বার ও কমিটি', category: 'ম্যানেজমেন্ট', description: 'কমিটি ও সাধারণ মেম্বারদের তালিকা ও প্রোফাইল' },
  { key: 'dues', label: 'মেম্বার চাঁদা ও পেমেন্ট', category: 'ম্যানেজমেন্ট', description: 'মাসিক চাঁদা, ইভেন্ট ফি তৈরি ও পেমেন্ট কালেকশন' },
  { key: 'certificates', label: 'সার্টিফিকেট জেনারেটর', category: 'সার্ভিস', description: 'রক্তদাতাদের সার্টিফিকেট তৈরি ও প্রিন্ট/ডাউনলোড' },
  { key: 'gallery', label: 'ফটো গ্যালারি', category: 'কন্টেন্ট', description: 'অ্যাক্টিভিটি ছবি আপলোড ও ম্যানেজমেন্ট' },
  { key: 'messages', label: 'মেসেজ ইনবক্স', category: 'কমিউনিকেশন', description: 'ওয়েবসাইটের কন্টাক্ট মেসেজ দেখা ও হ্যান্ডেল করা' },
  { key: 'analytics', label: 'অ্যানালিটিক্স ও রিপোর্টস', category: 'সিস্টেম', description: 'রক্তদান ও ড্যাশবোর্ডের সার্বিক পরিসংখ্যান' },
  { key: 'settings', label: 'সেটিংস ও নিরাপত্তা', category: 'সিস্টেম', description: 'পাসওয়ার্ড পরিবর্তন ও সিস্টেম ডাটাবেজ হেলথ' },
  { key: 'users', label: 'ইউজার ও পারমিশন কন্ট্রোল', category: 'সিস্টেম', description: 'নতুন ইউজার তৈরি ও পারমিশন নিয়ন্ত্রণ' },
] as const;

export interface AdminUser {
  id: number | string;
  username: string;
  name?: string;
  role?: 'super_admin' | 'sub_admin' | string;
  permissions?: string[];
  isActive?: boolean;
  passwordHash?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUserInput {
  username: string;
  password?: string;
  name?: string;
  role?: 'super_admin' | 'sub_admin' | string;
  permissions?: string[];
  isActive?: boolean;
}

export interface JWTPayload {
  id: number | string;
  username: string;
  name?: string;
  role?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface AuthVerificationResult {
  authenticated: boolean;
  admin?: {
    id: number | string;
    username: string;
    name?: string;
    role?: string;
    permissions?: string[];
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
