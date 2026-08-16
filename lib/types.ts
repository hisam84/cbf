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
  { key: 'donors', label: 'Donors Directory', category: 'Management', description: 'Access to add, edit, view, and delete donor records' },
  { key: 'donations', label: 'Donation Records', category: 'Management', description: 'Log and manage blood donation histories and entries' },
  { key: 'members', label: 'Members & Committee', category: 'Management', description: 'Manage organization committee and member profiles' },
  { key: 'dues', label: 'Member Fees & Dues', category: 'Management', description: 'Manage monthly fees, custom event dues & payment collection' },
  { key: 'certificates', label: 'Certificate Generator', category: 'Services', description: 'Generate, preview, and download donation certificates' },
  { key: 'gallery', label: 'Photo Gallery', category: 'Content', description: 'Upload, manage, and delete foundation activity photos' },
  { key: 'messages', label: 'Messages Inbox', category: 'Communication', description: 'View, read, and manage contact form inquiries' },
  { key: 'analytics', label: 'Analytics & Reports', category: 'System', description: 'View blood group distribution and donation statistics' },
  { key: 'settings', label: 'Settings & Security', category: 'System', description: 'Change admin password and monitor database status' },
  { key: 'users', label: 'User & Permissions', category: 'System', description: 'Create sub-admin users and manage granular permissions' },
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
