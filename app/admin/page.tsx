'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { compressImage } from '@/lib/image-compress';
import {
  Donor,
  DonorInput,
  Donation,
  DonationInput,
  Member,
  MemberInput,
  MemberDue,
  MemberDueInput,
  DuePaymentInput,
  AdminUser,
  AdminUserInput,
  AdminPermissionKey,
  PERMISSIONS_LIST,
  Certificate,
  GalleryItem,
  ContactMessage,
  StatsData,
  DbStatus,
  VALID_BLOOD_GROUPS,
} from '@/lib/types';
import { calculateEligibility } from '@/lib/validators';
import {
  Lock,
  LogOut,
  Globe,
  Users,
  FileText,
  Award,
  Image as ImageIcon,
  Mail,
  BarChart3,
  Key,
  Check,
  AlertCircle,
  Calendar,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Download,
  Save,
  Upload,
  X,
  ExternalLink,
  Phone,
  Menu,
  Droplet,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  UserCheck,
  Send,
  SlidersHorizontal,
  CreditCard,
  Receipt,
  DollarSign,
  Wallet,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Layers,
  UserPlus,
  CheckSquare,
  Square,
  Shield,
  UserCog,
} from 'lucide-react';

type AdminTab =
  | 'adminDonors'
  | 'adminDonations'
  | 'adminMembers'
  | 'adminDues'
  | 'adminCertificates'
  | 'adminGallery'
  | 'adminMessages'
  | 'adminAnalytics'
  | 'adminUsers'
  | 'adminSettings';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: any;
  count?: number;
  badge?: number;
  perm?: AdminPermissionKey;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export default function AdminPage() {
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [loadingLogin, setLoadingLogin] = useState<boolean>(false);

  // Sidebar & Active tab
  const [activeTab, setActiveTab] = useState<AdminTab>('adminDonors');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Data states
  const [stats, setStats] = useState<StatsData>({
    totalDonors: 0,
    totalDonations: 0,
    totalCertificates: 0,
    bloodGroupBreakdown: {},
  });
  const [dbStatus, setDbStatus] = useState<DbStatus>({
    connected: false,
    configured: false,
    message: 'Checking connection...',
  });
  const [donors, setDonors] = useState<Donor[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [dues, setDues] = useState<MemberDue[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  // User Management state
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | number | null>(null);
  const [userFormData, setUserFormData] = useState<AdminUserInput>({
    username: '',
    password: '',
    name: '',
    role: 'sub_admin',
    permissions: ['donors', 'donations', 'members'],
    isActive: true,
  });
  const [userFormMsg, setUserFormMsg] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>('');

  // Donor Search & Filter
  const [donorSearch, setDonorSearch] = useState<string>('');
  const [donorGroupFilter, setDonorGroupFilter] = useState<string>('all');

  // Donor Modal / Edit state
  const [showDonorModal, setShowDonorModal] = useState<boolean>(false);
  const [editingDonorId, setEditingDonorId] = useState<string | number | null>(null);
  const [donorFormData, setDonorFormData] = useState<DonorInput>({
    name: '',
    mobile: '',
    bloodGroup: 'A+',
    address: '',
    lastDonation: '',
    gender: '',
    dob: '',
  });
  const [donorFormMsg, setDonorFormMsg] = useState<string | null>(null);
  const [savingDonor, setSavingDonor] = useState<boolean>(false);

  // Donation Form state
  const [donationForm, setDonationForm] = useState<DonationInput>({
    donorName: '',
    donorPhone: '',
    donorAddress: '',
    number: '',
    bloodGroup: 'A+',
    date: new Date().toISOString().split('T')[0],
    image: null,
    notes: '',
  });
  const [editingDonationId, setEditingDonationId] = useState<string | number | null>(null);
  const [donationFormMsg, setDonationFormMsg] = useState<string | null>(null);
  const [compressingImg, setCompressingImg] = useState<boolean>(false);
  const [savingDonation, setSavingDonation] = useState<boolean>(false);

  // Member Form state
  const [showMemberModal, setShowMemberModal] = useState<boolean>(false);
  const [editingMemberId, setEditingMemberId] = useState<string | number | null>(null);
  const [memberFormData, setMemberFormData] = useState<MemberInput>({
    name: '',
    designation: '',
    mobile: '',
    bloodGroup: '',
    image: null,
    bio: '',
    roleType: 'executive',
    orderIndex: 0,
    monthlyFee: 0,
    joinedAt: '',
  });
  const [memberFormMsg, setMemberFormMsg] = useState<string | null>(null);
  const [savingMember, setSavingMember] = useState<boolean>(false);
  const [compressingMemberImg, setCompressingMemberImg] = useState<boolean>(false);
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'executive' | 'adviser' | 'member'>('all');

  // Member Dues & Payments state
  const [dueStatusFilter, setDueStatusFilter] = useState<string>('all');
  const [dueTypeFilter, setDueTypeFilter] = useState<string>('all');
  const [dueSearchQuery, setDueSearchQuery] = useState<string>('');
  const [dueMemberFilter, setDueMemberFilter] = useState<string>('all');

  // Add Due Modal
  const [showAddDueModal, setShowAddDueModal] = useState<boolean>(false);
  const [addDueForm, setAddDueForm] = useState<MemberDueInput>({
    targetType: 'single',
    memberId: '',
    title: '',
    dueType: 'event',
    amount: 0,
    dueDate: '',
    notes: '',
  });
  const [addDueMsg, setAddDueMsg] = useState<string | null>(null);
  const [savingDue, setSavingDue] = useState<boolean>(false);

  // Pay Due Modal
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [payingDue, setPayingDue] = useState<MemberDue | null>(null);
  const [payForm, setPayForm] = useState<DuePaymentInput>({
    paidAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    paymentNote: '',
  });
  const [payMsg, setPayMsg] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);

  // Edit Due Modal
  const [showEditDueModal, setShowEditDueModal] = useState<boolean>(false);
  const [editingDue, setEditingDue] = useState<MemberDue | null>(null);
  const [editDueForm, setEditDueForm] = useState<{
    title: string;
    amount: number;
    paidAmount: number;
    status: string;
    dueDate: string;
    notes: string;
  }>({
    title: '',
    amount: 0,
    paidAmount: 0,
    status: 'pending',
    dueDate: '',
    notes: '',
  });
  const [editDueMsg, setEditDueMsg] = useState<string | null>(null);
  const [savingEditDue, setSavingEditDue] = useState<boolean>(false);

  // Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [receiptDue, setReceiptDue] = useState<MemberDue | null>(null);

  // Generating monthly dues
  const [generatingMonthly, setGeneratingMonthly] = useState<boolean>(false);

  // Gallery Form state
  const [galleryCaption, setGalleryCaption] = useState<string>('');
  const [galleryCategory, setGalleryCategory] = useState<string>('general');
  const [galleryImgData, setGalleryImgData] = useState<string | null>(null);
  const [galleryMsg, setGalleryMsg] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState<boolean>(false);

  // Certificate Generator state
  const [certDonorName, setCertDonorName] = useState<string>('');
  const [certBloodGroup, setCertBloodGroup] = useState<string>('A+');
  const [certDate, setCertDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [certPhone, setCertPhone] = useState<string>('');
  const [certAddress, setCertAddress] = useState<string>('');
  const [certNumber, setCertNumber] = useState<string>('');
  const [certMessageText, setCertMessageText] = useState<string>(
    'In sincere recognition and deep gratitude for your noble contribution of voluntary blood donation through Chavali Blood Foundation. Your generosity has saved an invaluable human life.'
  );
  const [certLoading, setCertLoading] = useState<boolean>(false);
  const [certSaveMsg, setCertSaveMsg] = useState<string | null>(null);
  const [savedCertId, setSavedCertId] = useState<string | number | null>(null);
  const certRef = useRef<HTMLDivElement | null>(null);

  // Password change state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [savingPwd, setSavingPwd] = useState<boolean>(false);

  // 1. Initial auth check & cleanup of old localStorage tokens
  useEffect(() => {
    // Clean up any lingering token from older versions
    localStorage.removeItem('cbf_admin_token');

    // Only restore session if active in current browser session
    const savedToken = sessionStorage.getItem('cbf_admin_token');
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // 2. Fetch all data upon login
  useEffect(() => {
    if (isLoggedIn) {
      fetchAllData();
    }
  }, [isLoggedIn]);

  // 3. Inactivity timeout (Auto-logout after 30 minutes of idle time)
  useEffect(() => {
    if (!isLoggedIn) return;

    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout('নিরাপত্তার স্বার্থে ৩০ মিনিট নিষ্ক্রিয় থাকার পর সেশন স্বয়ংক্রিয়ভাবে সমাপ্ত হয়েছে। পুনরায় লগইন করুন।');
      }, INACTIVITY_LIMIT_MS);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [isLoggedIn]);

  const hasPermission = (permKey: AdminPermissionKey): boolean => {
    if (!currentUser) return true; // Default while loading or super admin
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.permissions?.includes('all')) return true;
    return Boolean(currentUser.permissions?.includes(permKey));
  };

  const verifyToken = async (jwtToken: string) => {
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsLoggedIn(true);
        if (data.admin) setCurrentUser(data.admin);
      } else {
        sessionStorage.removeItem('cbf_admin_token');
        localStorage.removeItem('cbf_admin_token');
        setToken(null);
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    } catch {
      sessionStorage.removeItem('cbf_admin_token');
      localStorage.removeItem('cbf_admin_token');
      setToken(null);
      setCurrentUser(null);
      setIsLoggedIn(false);
    }
  };

  const fetchAllData = async () => {
    setRefreshing(true);
    const headers = getHeaders();

    try {
      // 1. Check health
      fetch('/api/health')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.db) setDbStatus(d.db);
        })
        .catch(() => {});

      // 2. Stats
      fetch('/api/stats')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.stats) setStats(d.stats);
        })
        .catch(() => {});

      // 3. Donors (authorized)
      fetch('/api/donors', { headers })
        .then((r) => {
          if (r.status === 401) { handleLogout('সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।'); return null; }
          return r.json();
        })
        .then((d) => {
          if (d && d.success && Array.isArray(d.data)) setDonors(d.data);
        })
        .catch(() => {});

      // 4. Donations (authorized)
      fetch('/api/donations', { headers })
        .then((r) => {
          if (r.status === 401) { handleLogout('সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।'); return null; }
          return r.json();
        })
        .then((d) => {
          if (d && d.success && Array.isArray(d.data)) setDonations(d.data);
        })
        .catch(() => {});

      // 5. Members (authorized)
      fetch('/api/members', { headers })
        .then((r) => {
          if (r.status === 401) { handleLogout('সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।'); return null; }
          return r.json();
        })
        .then((d) => {
          if (d && d.success && Array.isArray(d.data)) setMembers(d.data);
        })
        .catch(() => {});

      // 6. Member Dues & Subscription (authorized)
      fetch('/api/dues', { headers })
        .then((r) => {
          if (r.status === 401) { handleLogout('সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।'); return null; }
          return r.json();
        })
        .then((d) => {
          if (d && d.success && Array.isArray(d.data)) setDues(d.data);
        })
        .catch(() => {});

      // 7. Users & Permissions (authorized)
      fetch('/api/users', { headers })
        .then((r) => {
          if (r.status === 401) { handleLogout('সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।'); return null; }
          return r.json();
        })
        .then((d) => {
          if (d && d.success && Array.isArray(d.data)) setUsers(d.data);
        })
        .catch(() => {});

      // 8. Gallery
      fetch('/api/gallery')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) setGallery(d.data);
        })
        .catch(() => {});

      // 9. Certificates (authorized)
      fetch('/api/certificates', { headers })
        .then((r) => {
          if (r.status === 401) { handleLogout('সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।'); return null; }
          return r.json();
        })
        .then((d) => {
          if (d && d.success && Array.isArray(d.data)) setCertificates(d.data);
        })
        .catch(() => {});

      // 10. Messages (authorized)
      fetch('/api/contact', { headers })
        .then((r) => {
          if (r.status === 401) { handleLogout('সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।'); return null; }
          return r.json();
        })
        .then((d) => {
          if (d && d.success && Array.isArray(d.data)) setMessages(d.data);
        })
        .catch(() => {});
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const curToken = token || (typeof window !== 'undefined' ? sessionStorage.getItem('cbf_admin_token') : null);
    if (curToken) headers['Authorization'] = `Bearer ${curToken}`;
    return headers;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginMessage(null);
    setLoadingLogin(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        sessionStorage.setItem('cbf_admin_token', data.token);
        localStorage.removeItem('cbf_admin_token'); // Ensure clean state
        setToken(data.token);
        setIsLoggedIn(true);
        if (data.admin) setCurrentUser(data.admin);
        setLoginForm({ username: '', password: '' });
      } else {
        setLoginMessage(data.message || 'ভুল ইউজারনেম অথবা পাসওয়ার্ড');
      }
    } catch {
      setLoginMessage('সার্ভারের সাথে সংযোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = (messageOrEvent?: React.MouseEvent | string) => {
    sessionStorage.removeItem('cbf_admin_token');
    localStorage.removeItem('cbf_admin_token');
    setToken(null);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setSidebarOpen(false);
    if (typeof messageOrEvent === 'string') {
      setLoginMessage(messageOrEvent);
    }
  };

  const handleNavClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  // ----------------------------------------------------------------------------
  // USER & PERMISSION MANAGEMENT HANDLERS
  // ----------------------------------------------------------------------------
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setUserFormData({
      username: '',
      password: '',
      name: '',
      role: 'sub_admin',
      permissions: ['donors', 'donations', 'members'],
      isActive: true,
    });
    setUserFormMsg(null);
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: AdminUser) => {
    setEditingUserId(u.id);
    setUserFormData({
      username: u.username,
      password: '',
      name: u.name || '',
      role: u.role || 'sub_admin',
      permissions: u.permissions || [],
      isActive: u.isActive !== false,
    });
    setUserFormMsg(null);
    setShowUserModal(true);
  };

  const handleTogglePermission = (permKey: AdminPermissionKey) => {
    setUserFormData((prev) => {
      const currentPerms = (prev.permissions || []) as AdminPermissionKey[];
      if (currentPerms.includes(permKey)) {
        return { ...prev, permissions: currentPerms.filter((p) => p !== permKey) };
      } else {
        return { ...prev, permissions: [...currentPerms, permKey] };
      }
    });
  };

  const handleSelectAllPermissions = () => {
    setUserFormData((prev) => ({
      ...prev,
      permissions: PERMISSIONS_LIST.map((p) => p.key),
    }));
  };

  const handleClearAllPermissions = () => {
    setUserFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingUser(true);
    setUserFormMsg(null);

    try {
      const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
      const method = editingUserId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(userFormData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUserFormMsg(editingUserId ? 'ইউজার সফলভাবে আপডেট হয়েছে!' : 'নতুন ইউজার সফলভাবে তৈরি হয়েছে!');
        fetchAllData();
        setTimeout(() => {
          setShowUserModal(false);
          setUserFormMsg(null);
        }, 700);
      } else {
        setUserFormMsg(data.message || 'অপারেশন ব্যর্থ হয়েছে।');
      }
    } catch {
      setUserFormMsg('সার্ভার এরর হয়েছে।');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id: number | string, username: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে ইউজার "${username}"-কে সিস্টেম থেকে মুছে ফেলতে চান?`)) return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || 'ইউজার ডিলিট করা সম্ভব হয়নি।');
      }
    } catch {
      alert('সার্ভার এরর হয়েছে।');
    }
  };

  // Donor handlers
  const handleOpenAddDonor = () => {
    setEditingDonorId(null);
    setDonorFormData({
      name: '',
      mobile: '',
      bloodGroup: 'A+',
      address: '',
      lastDonation: '',
      gender: '',
      dob: '',
    });
    setDonorFormMsg(null);
    setShowDonorModal(true);
  };

  const handleEditDonor = (donor: Donor) => {
    setEditingDonorId(donor.id);
    setDonorFormData({
      name: donor.name,
      mobile: donor.mobile,
      bloodGroup: donor.bloodGroup,
      address: donor.address,
      lastDonation: donor.lastDonation || '',
      gender: donor.gender || '',
      dob: donor.dob || '',
    });
    setDonorFormMsg(null);
    setShowDonorModal(true);
  };

  const handleSaveDonor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingDonor(true);
    setDonorFormMsg(null);

    try {
      const url = editingDonorId ? `/api/donors/${editingDonorId}` : '/api/donors';
      const method = editingDonorId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(donorFormData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDonorFormMsg(editingDonorId ? 'Donor updated successfully!' : 'Donor added successfully!');
        fetchAllData();
        setTimeout(() => {
          setShowDonorModal(false);
          setDonorFormMsg(null);
        }, 800);
      } else {
        setDonorFormMsg(data.message || 'Operation failed.');
      }
    } catch {
      setDonorFormMsg('Network error occurred.');
    } finally {
      setSavingDonor(false);
    }
  };

  const handleDeleteDonor = async (id: string | number, name: string) => {
    if (!confirm(`Are you sure you want to delete donor "${name}" from the database?`)) return;

    try {
      const res = await fetch(`/api/donors/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || 'Could not delete donor.');
      }
    } catch {
      alert('Server error occurred.');
    }
  };

  // Member handlers
  const handleOpenAddMember = () => {
    setEditingMemberId(null);
    setMemberFormData({
      name: '',
      designation: '',
      mobile: '',
      bloodGroup: '',
      image: null,
      bio: '',
      roleType: 'executive',
      orderIndex: members.length + 1,
      monthlyFee: 0,
      joinedAt: '',
    });
    setMemberFormMsg(null);
    setShowMemberModal(true);
  };

  const handleEditMember = (m: Member) => {
    setEditingMemberId(m.id);
    setMemberFormData({
      name: m.name,
      designation: m.designation,
      mobile: m.mobile || '',
      bloodGroup: m.bloodGroup || '',
      image: m.image || null,
      bio: m.bio || '',
      roleType: m.roleType || 'executive',
      orderIndex: m.orderIndex || 0,
      monthlyFee: m.monthlyFee || 0,
      joinedAt: m.joinedAt || '',
    });
    setMemberFormMsg(null);
    setShowMemberModal(true);
  };

  const handleMemberImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCompressingMemberImg(true);
      const base64 = await compressImage(file, 600, 600, 0.8);
      setMemberFormData({ ...memberFormData, image: base64 });
    } catch (err: any) {
      alert('Image compression failed: ' + err?.message);
    } finally {
      setCompressingMemberImg(false);
    }
  };

  const handleSaveMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingMember(true);
    setMemberFormMsg(null);

    try {
      const url = editingMemberId ? `/api/members/${editingMemberId}` : '/api/members';
      const method = editingMemberId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(memberFormData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMemberFormMsg(editingMemberId ? 'Member updated successfully!' : 'Member added successfully!');
        fetchAllData();
        setTimeout(() => {
          setShowMemberModal(false);
          setMemberFormMsg(null);
        }, 700);
      } else {
        setMemberFormMsg(data.message || 'Operation failed.');
      }
    } catch {
      setMemberFormMsg('Network error occurred.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (id: string | number, name: string) => {
    if (!confirm(`Are you sure you want to remove member "${name}"?`)) return;
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || 'Could not delete member.');
      }
    } catch {
      alert('Server error occurred.');
    }
  };

  // ----------------------------------------------------------------------------
  // MEMBER DUES & PAYMENTS HANDLERS
  // ----------------------------------------------------------------------------
  const handleGenerateMonthlyDues = async () => {
    if (!confirm('চলতি মাসের জন্য সকল মেম্বারদের নির্ধারিত মাসিক চাঁদার ডিউ তৈরি করতে চান?')) return;
    try {
      setGeneratingMonthly(true);
      const res = await fetch('/api/dues/generate-monthly', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'মাসিক চাঁদা সফলভাবে জেনারেট করা হয়েছে।');
        fetchAllData();
      } else {
        alert(data.message || 'মাসিক চাঁদা জেনারেট করা সম্ভব হয়নি।');
      }
    } catch {
      alert('সার্ভারের সাথে সংযোগ করতে সমস্যা হয়েছে।');
    } finally {
      setGeneratingMonthly(false);
    }
  };

  const handleOpenAddDue = () => {
    setAddDueForm({
      targetType: 'single',
      memberId: members.length > 0 ? String(members[0].id) : '',
      title: '',
      dueType: 'event',
      amount: 0,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    });
    setAddDueMsg(null);
    setShowAddDueModal(true);
  };

  const handleSaveDue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!addDueForm.title || Number(addDueForm.amount) <= 0) {
      setAddDueMsg('চাঁদার বিবরণ এবং সঠিক টাকার পরিমাণ প্রদান করুন।');
      return;
    }
    setSavingDue(true);
    setAddDueMsg(null);

    try {
      const res = await fetch('/api/dues', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(addDueForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddDueMsg('ডিউ সফলভাবে তৈরি করা হয়েছে!');
        fetchAllData();
        setTimeout(() => {
          setShowAddDueModal(false);
          setAddDueMsg(null);
        }, 700);
      } else {
        setAddDueMsg(data.message || 'ডিউ তৈরি করা সম্ভব হয়নি।');
      }
    } catch {
      setAddDueMsg('সার্ভার এরর হয়েছে।');
    } finally {
      setSavingDue(false);
    }
  };

  const handleOpenPayModal = (due: MemberDue) => {
    setPayingDue(due);
    const remaining = Math.max(0, (Number(due.amount) || 0) - (Number(due.paidAmount) || 0));
    setPayForm({
      paidAmount: remaining > 0 ? remaining : Number(due.amount) || 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bkash',
      paymentNote: '',
    });
    setPayMsg(null);
    setShowPayModal(true);
  };

  const handleProcessPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!payingDue) return;
    const inputAmount = Number(payForm.paidAmount) || 0;
    if (inputAmount <= 0) {
      setPayMsg('সঠিক পেমেন্টের টাকার পরিমাণ লিখুন।');
      return;
    }

    setProcessingPayment(true);
    setPayMsg(null);

    try {
      const totalPaidSoFar = (Number(payingDue.paidAmount) || 0) + inputAmount;
      const res = await fetch(`/api/dues/${payingDue.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          paidAmount: totalPaidSoFar,
          paymentDate: payForm.paymentDate,
          paymentMethod: payForm.paymentMethod,
          paymentNote: payForm.paymentNote,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPayMsg('পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে!');
        fetchAllData();
        setTimeout(() => {
          setShowPayModal(false);
          setPayMsg(null);
          setPayingDue(null);
        }, 800);
      } else {
        setPayMsg(data.message || 'পেমেন্ট সম্পন্ন করা সম্ভব হয়নি।');
      }
    } catch {
      setPayMsg('সার্ভার এরর হয়েছে।');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleOpenEditDue = (due: MemberDue) => {
    setEditingDue(due);
    setEditDueForm({
      title: due.title,
      amount: Number(due.amount) || 0,
      paidAmount: Number(due.paidAmount) || 0,
      status: due.status || 'pending',
      dueDate: due.dueDate || '',
      notes: due.notes || '',
    });
    setEditDueMsg(null);
    setShowEditDueModal(true);
  };

  const handleSaveEditDue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDue) return;
    setSavingEditDue(true);
    setEditDueMsg(null);

    try {
      const res = await fetch(`/api/dues/${editingDue.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(editDueForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditDueMsg('ডিউ সফলভাবে আপডেট হয়েছে!');
        fetchAllData();
        setTimeout(() => {
          setShowEditDueModal(false);
          setEditDueMsg(null);
          setEditingDue(null);
        }, 700);
      } else {
        setEditDueMsg(data.message || 'আপডেট করা সম্ভব হয়নি।');
      }
    } catch {
      setEditDueMsg('সার্ভার এরর হয়েছে।');
    } finally {
      setSavingEditDue(false);
    }
  };

  const handleDeleteDue = async (id: number | string, title: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${title}" ডিউটি ডিলিট করতে চান?`)) return;

    try {
      const res = await fetch(`/api/dues/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || 'ডিউ ডিলিট করা সম্ভব হয়নি।');
      }
    } catch {
      alert('সার্ভার এরর হয়েছে।');
    }
  };

  const handleOpenReceipt = (due: MemberDue) => {
    setReceiptDue(due);
    setShowReceiptModal(true);
  };

  // Donation handlers
  const handleDonationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCompressingImg(true);
      const base64 = await compressImage(file, 800, 800, 0.8);
      setDonationForm({ ...donationForm, image: base64 });
    } catch (err: any) {
      alert('Image compression failed: ' + err?.message);
    } finally {
      setCompressingImg(false);
    }
  };

  const handleSaveDonation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingDonation(true);
    setDonationFormMsg(null);

    try {
      const url = editingDonationId ? `/api/donations/${editingDonationId}` : '/api/donations';
      const method = editingDonationId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(donationForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDonationFormMsg(
          editingDonationId ? 'Donation record updated successfully!' : 'Donation record added successfully!'
        );
        fetchAllData();
        setEditingDonationId(null);
        setDonationForm({
          donorName: '',
          donorPhone: '',
          donorAddress: '',
          number: '',
          bloodGroup: 'A+',
          date: new Date().toISOString().split('T')[0],
          image: null,
          notes: '',
        });
      } else {
        setDonationFormMsg(data.message || 'Operation failed.');
      }
    } catch {
      setDonationFormMsg('Network error occurred.');
    } finally {
      setSavingDonation(false);
    }
  };

  const handleEditDonation = (d: Donation) => {
    setEditingDonationId(d.id);
    setDonationForm({
      donorName: d.donorName,
      donorPhone: d.donorPhone,
      donorAddress: d.donorAddress,
      number: d.number,
      bloodGroup: d.bloodGroup,
      date: d.date,
      image: d.image || null,
      notes: d.notes || '',
    });
    setDonationFormMsg(null);
  };

  const handleDeleteDonation = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this donation record?')) return;
    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || 'Could not delete record.');
      }
    } catch {
      alert('Server error occurred.');
    }
  };

  const handleSelectDonationForCert = (dId: string) => {
    if (!dId) return;
    const selected = donations.find((d) => String(d.id) === dId);
    if (selected) {
      setCertDonorName(selected.donorName);
      setCertBloodGroup(selected.bloodGroup);
      setCertDate(selected.date);
      setCertPhone(selected.donorPhone);
      setCertAddress(selected.donorAddress);
      setCertNumber(selected.number || `CBF-${selected.id}`);
    }
  };

  const handleSaveCertificate = async () => {
    if (!certDonorName || !certBloodGroup || !certDate) {
      alert('Please fill in Donor Name, Blood Group, and Donation Date.');
      return;
    }

    setCertLoading(true);
    setCertSaveMsg(null);

    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          donorName: certDonorName,
          bloodGroup: certBloodGroup,
          donationDate: certDate,
          phone: certPhone,
          address: certAddress,
          donationNumber: certNumber,
          message: certMessageText,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setSavedCertId(data.data.id);
        setCertSaveMsg(`Certificate saved to database successfully! (Certificate ID: ${data.data.id})`);
        fetchAllData();
      } else {
        setCertSaveMsg(data.message || 'Could not save certificate.');
      }
    } catch {
      setCertSaveMsg('Network error while saving certificate.');
    } finally {
      setCertLoading(false);
    }
  };

  const handleDownloadCert = async () => {
    if (!certRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `Certificate_${certDonorName.replace(/\s+/g, '_') || 'Donor'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err: any) {
      alert('Download generation error: ' + err?.message);
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 1200, 1200, 0.85);
      setGalleryImgData(base64);
    } catch (err: any) {
      alert('Image compression error: ' + err?.message);
    }
  };

  const handleSaveGallery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!galleryImgData) {
      alert('Please select an image file to upload.');
      return;
    }

    setUploadingGallery(true);
    setGalleryMsg(null);

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          imageData: galleryImgData,
          caption: galleryCaption,
          category: galleryCategory,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setGalleryMsg('Photo uploaded to gallery successfully!');
        setGalleryCaption('');
        setGalleryImgData(null);
        fetchAllData();
      } else {
        setGalleryMsg(data.message || 'Failed to upload photo.');
      }
    } catch {
      setGalleryMsg('Network error while uploading photo.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteGalleryItem = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this photo from the gallery?')) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || 'Could not delete photo.');
      }
    } catch {
      alert('Server error occurred.');
    }
  };

  const handleToggleMessageRead = async (msg: ContactMessage) => {
    try {
      const res = await fetch(`/api/contact/${msg.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isRead: !msg.isRead }),
      });
      if (res.ok) fetchAllData();
    } catch {
      // ignore
    }
  };

  const handleDeleteMessage = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) fetchAllData();
    } catch {
      alert('Server error occurred.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg('New password and confirm password do not match.');
      return;
    }

    setSavingPwd(true);
    setPwdMsg(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPwdMsg('Admin password updated successfully!');
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPwdMsg(data.message || 'Could not update password.');
      }
    } catch {
      setPwdMsg('Network error while updating password.');
    } finally {
      setSavingPwd(false);
    }
  };

  const filteredDonors = donors.filter((d) => {
    const matchGroup = donorGroupFilter === 'all' || d.bloodGroup === donorGroupFilter;
    const q = donorSearch.toLowerCase().trim();
    const matchQuery =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.mobile.includes(q) ||
      d.address.toLowerCase().includes(q);
    return matchGroup && matchQuery;
  });

  const filteredMembers = members.filter((m) => {
    const matchRole =
      memberRoleFilter === 'all' ||
      (memberRoleFilter === 'executive' && (m.roleType === 'executive' || !m.roleType)) ||
      (memberRoleFilter === 'adviser' && m.roleType === 'adviser') ||
      (memberRoleFilter === 'member' && m.roleType === 'member');
    const q = memberSearch.toLowerCase().trim();
    const matchQuery =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.designation.toLowerCase().includes(q) ||
      (m.mobile && m.mobile.includes(q)) ||
      (m.bloodGroup && m.bloodGroup.toLowerCase().includes(q)) ||
      (m.bio && m.bio.toLowerCase().includes(q));
    return matchRole && matchQuery;
  });

  const filteredDues = dues.filter((d) => {
    const matchStatus = dueStatusFilter === 'all' || d.status === dueStatusFilter;
    const matchType = dueTypeFilter === 'all' || d.dueType === dueTypeFilter;
    const matchMember = dueMemberFilter === 'all' || String(d.memberId) === String(dueMemberFilter);
    const q = dueSearchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      (d.memberName && d.memberName.toLowerCase().includes(q)) ||
      (d.memberPhone && d.memberPhone.includes(q)) ||
      (d.title && d.title.toLowerCase().includes(q)) ||
      (d.notes && d.notes.toLowerCase().includes(q));
    return matchStatus && matchType && matchMember && matchQuery;
  });

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    return !q || (u.name && u.name.toLowerCase().includes(q)) || u.username.toLowerCase().includes(q);
  });

  const duesStats = {
    totalDueAmount: dues.reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    totalPaidAmount: dues.reduce((sum, d) => sum + (Number(d.paidAmount) || 0), 0),
    totalPendingAmount: dues.reduce((sum, d) => sum + Math.max(0, (Number(d.amount) || 0) - (Number(d.paidAmount) || 0)), 0),
    pendingCount: dues.filter((d) => d.status === 'pending' || d.status === 'partial').length,
    paidCount: dues.filter((d) => d.status === 'paid').length,
  };

  const rawNavMenuItems: NavGroup[] = [
    {
      group: 'MANAGEMENT',
      items: [
        { id: 'adminDonors', label: 'Donors Directory', icon: Users, count: donors.length, perm: 'donors' },
        { id: 'adminDonations', label: 'Donation Records', icon: FileText, count: donations.length, perm: 'donations' },
        { id: 'adminMembers', label: 'Members & Committee', icon: UserCheck, count: members.length, perm: 'members' },
        {
          id: 'adminDues',
          label: 'মেম্বার চাঁদা ও পেমেন্ট',
          icon: CreditCard,
          badge: duesStats.pendingCount > 0 ? duesStats.pendingCount : undefined,
          count: duesStats.pendingCount === 0 ? dues.length : undefined,
          perm: 'dues',
        },
        { id: 'adminCertificates', label: 'Certificate Generator', icon: Award, count: certificates.length, perm: 'certificates' },
        { id: 'adminGallery', label: 'Gallery Management', icon: ImageIcon, count: gallery.length, perm: 'gallery' },
      ],
    },
    {
      group: 'ENGAGEMENT',
      items: [
        {
          id: 'adminMessages',
          label: 'Messages Inbox',
          icon: Mail,
          badge: messages.filter((m) => !m.isRead).length,
          perm: 'messages',
        },
      ],
    },
    {
      group: 'INSIGHTS & SYSTEM',
      items: [
        { id: 'adminAnalytics', label: 'Analytics & Reports', icon: BarChart3, perm: 'analytics' },
        { id: 'adminUsers', label: 'ইউজার ও পারমিশন', icon: ShieldCheck, count: users.length, perm: 'users' },
        { id: 'adminSettings', label: 'Settings & Security', icon: Key, perm: 'settings' },
      ],
    },
  ];

  const navMenuItems: NavGroup[] = rawNavMenuItems
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => hasPermission(item.perm as AdminPermissionKey)),
    }))
    .filter((g) => g.items.length > 0);

  // ----------------------------------------------------------------------------
  // CLEAN MODERN LOGIN SCREEN
  // ----------------------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <section className="admin-login-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
          <div
            className="admin-card"
            style={{
              padding: '40px 32px',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                borderRadius: '18px',
                color: '#dc2626',
                marginBottom: '20px',
                boxShadow: '0 8px 16px -4px rgba(220, 38, 38, 0.25)',
              }}
            >
              <Droplet size={32} fill="#dc2626" />
            </div>

            <h2 style={{ color: '#0f172a', fontSize: '1.45rem', fontWeight: 800, marginBottom: '6px' }}>
              Admin Portal
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '28px', lineHeight: 1.5 }}>
              Sign in to manage donors, donations, and blood foundation records
            </p>

            {loginMessage && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  borderRadius: '12px',
                  marginBottom: '22px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{loginMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter admin username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontSize: '0.95rem',
                    background: '#f8fafc',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#dc2626';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      fontSize: '0.95rem',
                      background: '#f8fafc',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#dc2626';
                      e.currentTarget.style.background = '#ffffff';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingLogin}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#dc2626')}
              >
                <Lock size={16} />
                <span>{loadingLogin ? 'Signing In...' : 'Sign In to Dashboard'}</span>
              </button>
            </form>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
              <Link
                href="/"
                style={{
                  color: '#64748b',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                }}
              >
                <Globe size={14} />
                <span>Back to Live Website</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ----------------------------------------------------------------------------
  // CLEAN MODERN LOGGED-IN ADMIN DASHBOARD
  // ----------------------------------------------------------------------------
  const activeNavLabel =
    navMenuItems.flatMap((g) => g.items).find((m) => m.id === activeTab)?.label || 'Dashboard';

  return (
    <div className="admin-shell">
      {/* Mobile Top Header */}
      <div className="admin-mobile-header">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#1e293b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '6px',
          }}
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
            }}
          >
            <Droplet size={16} fill="#dc2626" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Chavali Admin</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: '#fee2e2',
            border: 'none',
            color: '#991b1b',
            borderRadius: '8px',
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
          title="Sign Out"
        >
          <LogOut size={14} />
          <span>Exit</span>
        </button>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      <div
        className={`admin-sidebar-backdrop ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        role="presentation"
      ></div>

      {/* Modern Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Brand */}
        <div
          style={{
            padding: '22px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(220, 38, 38, 0.3)',
              }}
            >
              <Droplet size={22} fill="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                Chavali Admin
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Blood Foundation Panel</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Database Status Indicator Pill */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot" style={{ background: dbStatus.connected ? '#10b981' : '#f59e0b' }}></span>
              <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 700 }}>
                {dbStatus.connected ? 'PostgreSQL Active' : 'Database Offline'}
              </span>
            </div>
            {dbStatus.latencyMs !== undefined && (
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                {dbStatus.latencyMs}ms
              </span>
            )}
          </div>
        </div>

        {/* Categorized Nav Items */}
        <nav style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {navMenuItems.map((group, gIdx) => (
            <div key={gIdx}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#94a3b8',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '0 8px',
                  marginBottom: '8px',
                }}
              >
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`admin-nav-item ${isActive ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon size={18} className="nav-icon" color={isActive ? '#dc2626' : '#64748b'} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && item.badge > 0 ? (
                        <span
                          style={{
                            background: '#dc2626',
                            color: '#ffffff',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          {item.badge}
                        </span>
                      ) : item.count !== undefined ? (
                        <span className="admin-badge-count">{item.count}</span>
                      ) : (
                        <ChevronRight size={14} color={isActive ? '#dc2626' : '#cbd5e1'} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Bottom Profile Section */}
        <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '0 4px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: currentUser?.role === 'super_admin' ? '#fee2e2' : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentUser?.role === 'super_admin' ? '#dc2626' : '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {(currentUser?.name || currentUser?.username || 'AD').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.name || currentUser?.username || 'Administrator'}
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: currentUser?.role === 'super_admin' ? '#166534' : '#1e40af',
                  background: currentUser?.role === 'super_admin' ? '#dcfce7' : '#dbeafe',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  fontWeight: 700,
                }}
              >
                {currentUser?.role === 'super_admin' ? 'Super Admin' : 'Sub-Admin / Moderator'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <Link
              href="/"
              target="_blank"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                borderRadius: '8px',
                background: '#ffffff',
                color: '#475569',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              <Globe size={14} />
              <span>Visit Site</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                borderRadius: '8px',
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Top Header Card */}
        <div
          className="admin-card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '20px 24px',
            marginBottom: '24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
              <span>Dashboard</span>
              <ChevronRight size={12} />
              <span style={{ color: '#dc2626' }}>{activeNavLabel}</span>
            </div>
            <h2 style={{ color: '#0f172a', margin: '4px 0 0 0', fontSize: '1.45rem', fontWeight: 800 }}>
              {activeNavLabel}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={fetchAllData}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                color: '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <span
              style={{
                padding: '6px 12px',
                background: '#f0fdf4',
                border: '1px solid #dcfce7',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#166534',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ShieldCheck size={14} />
              <span>Admin Verified</span>
            </span>
          </div>
        </div>

        {/* Overview Stats Cards (4 Grid) */}
        <div className="admin-overview-grid">
          <div className="admin-stat-card">
            <div>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Total Donors</span>
              <div className="stat-val" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {(stats.totalDonors || donors.length).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Active in database</span>
            </div>
            <div
              className="stat-icon"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
                flexShrink: 0,
              }}
            >
              <Users size={22} />
            </div>
          </div>

          <div className="admin-stat-card">
            <div>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Donation Records</span>
              <div className="stat-val" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {(stats.totalDonations || donations.length).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>Documented activities</span>
            </div>
            <div
              className="stat-icon"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                flexShrink: 0,
              }}
            >
              <FileText size={22} />
            </div>
          </div>

          <div className="admin-stat-card">
            <div>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Committee Members</span>
              <div className="stat-val" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {members.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Executives & Advisers</span>
            </div>
            <div
              className="stat-icon"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                flexShrink: 0,
              }}
            >
              <UserCheck size={22} />
            </div>
          </div>

          <div className="admin-stat-card">
            <div>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Unread Messages</span>
              <div className="stat-val" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {messages.filter((m) => !m.isRead).length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600 }}>{messages.length} total received</span>
            </div>
            <div
              className="stat-icon"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#f5f3ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b5cf6',
                flexShrink: 0,
              }}
            >
              <Mail size={22} />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DONORS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'adminDonors' && (
          <div className="admin-card" style={{ padding: '24px' }}>
            <div
              className="admin-card-header-responsive"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: 800 }}>
                  Donors Directory
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Total {filteredDonors.length} registered donors
                </p>
              </div>

              <button
                onClick={handleOpenAddDonor}
                type="button"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                }}
              >
                <Plus size={16} />
                <span>Add New Donor</span>
              </button>
            </div>

            {/* Filter and search bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by name, phone number, or area..."
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                  className="admin-search-input"
                  style={{ paddingRight: donorSearch ? '38px' : '16px' }}
                />
                {donorSearch && (
                  <button
                    type="button"
                    onClick={() => setDonorSearch('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="admin-filter-scroll">
                <button
                  type="button"
                  onClick={() => setDonorGroupFilter('all')}
                  className={`admin-filter-chip ${donorGroupFilter === 'all' ? 'active' : ''}`}
                >
                  All Donors ({donors.length})
                </button>
                {VALID_BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setDonorGroupFilter(bg)}
                    className={`admin-filter-chip ${donorGroupFilter === bg ? 'active' : ''}`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. DESKTOP VIEW: Full Donors Table */}
            <div className="admin-desktop-view">
              <div className="admin-table-container">
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Donor Name</th>
                        <th>Mobile Number</th>
                        <th>Group</th>
                        <th>Address</th>
                        <th>Last Donation</th>
                        <th>Eligibility</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDonors.map((donor) => {
                        const eligibility = calculateEligibility(donor.lastDonation);
                        return (
                          <tr key={donor.id}>
                            <td style={{ fontWeight: 700, color: '#0f172a' }}>{donor.name}</td>
                            <td>
                              <a href={`tel:${donor.mobile}`} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                                {donor.mobile}
                              </a>
                            </td>
                            <td>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                }}
                              >
                                {donor.bloodGroup}
                              </span>
                            </td>
                            <td style={{ color: '#475569' }}>{donor.address}</td>
                            <td style={{ color: '#64748b' }}>
                              {donor.lastDonation || 'None recorded'}
                            </td>
                            <td>
                              <span
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: eligibility.isEligible ? '#dcfce7' : '#fef3c7',
                                  color: eligibility.isEligible ? '#166534' : '#92400e',
                                  border: `1px solid ${eligibility.isEligible ? '#bbf7d0' : '#fde68a'}`,
                                }}
                              >
                                {eligibility.isEligible ? 'Eligible' : `Wait (${eligibility.daysUntilEligible}d)`}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                onClick={() => handleEditDonor(donor)}
                                type="button"
                                className="admin-btn-action admin-btn-edit"
                                style={{ marginRight: '6px' }}
                                title="Edit donor details"
                              >
                                <Edit2 size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteDonor(donor.id, donor.name)}
                                type="button"
                                className="admin-btn-action admin-btn-delete"
                                title="Delete donor"
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredDonors.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            No donors found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 2. MOBILE VIEW: Responsive Donor Cards */}
            <div className="admin-mobile-cards-view">
              {filteredDonors.map((donor) => {
                const eligibility = calculateEligibility(donor.lastDonation);
                return (
                  <div key={donor.id} className="admin-donor-card">
                    {/* Header: Name and Blood Group */}
                    <div className="admin-donor-card-header">
                      <div>
                        <h4 className="admin-donor-card-name">{donor.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>
                          <MapPin size={13} color="#94a3b8" />
                          <span>{donor.address}</span>
                        </div>
                      </div>
                      <span className="admin-badge-blood">
                        <Droplet size={12} fill="#dc2626" color="#dc2626" />
                        <span>{donor.bloodGroup}</span>
                      </span>
                    </div>

                    {/* Details Box */}
                    <div className="admin-donor-card-details">
                      <div className="admin-donor-card-row">
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>মোবাইল নম্বর:</span>
                        <a
                          href={`tel:${donor.mobile}`}
                          style={{
                            color: '#2563eb',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.82rem',
                          }}
                        >
                          <Phone size={12} />
                          <span>{donor.mobile}</span>
                        </a>
                      </div>

                      <div className="admin-donor-card-row">
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>সর্বশেষ রক্তদান:</span>
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.82rem' }}>
                          {donor.lastDonation || 'তথ্য নেই'}
                        </span>
                      </div>

                      <div className="admin-donor-card-row" style={{ paddingTop: '2px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>যোগ্যতা:</span>
                        <span
                          style={{
                            padding: '3px 9px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: eligibility.isEligible ? '#dcfce7' : '#fef3c7',
                            color: eligibility.isEligible ? '#166534' : '#92400e',
                            border: `1px solid ${eligibility.isEligible ? '#bbf7d0' : '#fde68a'}`,
                          }}
                        >
                          {eligibility.isEligible ? 'রক্তদানের জন্য প্রস্তুত' : `অপেক্ষা করুন (${eligibility.daysUntilEligible} দিন)`}
                        </span>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="admin-donor-card-actions">
                      <button
                        onClick={() => handleEditDonor(donor)}
                        type="button"
                        className="admin-btn-action admin-btn-edit"
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDonor(donor.id, donor.name)}
                        type="button"
                        className="admin-btn-action admin-btn-delete"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredDonors.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <Users size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontWeight: 600 }}>
                    কোনো রক্তদাতার তথ্য পাওয়া যায়নি
                  </p>
                  {(donorSearch || donorGroupFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setDonorSearch('');
                        setDonorGroupFilter('all');
                      }}
                      style={{
                        marginTop: '12px',
                        padding: '6px 14px',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ফিল্টার রিসেট করুন
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Donor Add/Edit Modal */}
            {showDonorModal && (
              <div className="admin-modal-overlay">
                <div className="admin-card admin-modal-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>
                      {editingDonorId ? 'Edit Donor Profile' : 'Add New Volunteer Donor'}
                    </h3>
                    <button
                      onClick={() => setShowDonorModal(false)}
                      type="button"
                      style={{
                        background: '#f1f5f9',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        borderRadius: '8px',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {donorFormMsg && (
                    <div
                      style={{
                        padding: '12px 14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        marginBottom: '18px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#0f172a',
                      }}
                    >
                      {donorFormMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveDonor}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Hisam Uddin"
                          value={donorFormData.name}
                          onChange={(e) => setDonorFormData({ ...donorFormData, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="01XXXXXXXXX"
                          value={donorFormData.mobile}
                          onChange={(e) => setDonorFormData({ ...donorFormData, mobile: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Blood Group *</label>
                        <select
                          value={donorFormData.bloodGroup}
                          onChange={(e) => setDonorFormData({ ...donorFormData, bloodGroup: e.target.value })}
                        >
                          {VALID_BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Last Donation Date</label>
                        <input
                          type="date"
                          value={donorFormData.lastDonation || ''}
                          onChange={(e) => setDonorFormData({ ...donorFormData, lastDonation: e.target.value })}
                        />
                      </div>
                      <div className="form-group full">
                        <label>Address / Area *</label>
                        <input
                          type="text"
                          required
                          placeholder="Village/Thana, Chapainawabganj"
                          value={donorFormData.address}
                          onChange={(e) => setDonorFormData({ ...donorFormData, address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                      <button
                        type="submit"
                        disabled={savingDonor}
                        style={{
                          flex: 1,
                          minWidth: '130px',
                          padding: '12px',
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        {savingDonor ? 'Saving...' : editingDonorId ? 'Update Donor' : 'Save Donor'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDonorModal(false)}
                        style={{
                          padding: '12px 18px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DONATIONS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'adminDonations' && (
          <div className="admin-tab-two-col">
            {/* Add Donation Form */}
            <div className="admin-card" style={{ padding: '24px' }}>
              <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>
                {editingDonationId ? 'Edit Donation Record' : 'Record New Blood Donation'}
              </h3>

              {donationFormMsg && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    marginBottom: '18px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    color: '#0f172a',
                  }}
                >
                  {donationFormMsg}
                </div>
              )}

              <form onSubmit={handleSaveDonation}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Donor Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hisam Uddin"
                      value={donationForm.donorName}
                      onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={donationForm.donorPhone}
                      onChange={(e) => setDonationForm({ ...donationForm, donorPhone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Blood Group *</label>
                    <select
                      value={donationForm.bloodGroup}
                      onChange={(e) => setDonationForm({ ...donationForm, bloodGroup: e.target.value })}
                    >
                      {VALID_BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Donation Date *</label>
                    <input
                      type="date"
                      required
                      value={donationForm.date}
                      onChange={(e) => setDonationForm({ ...donationForm, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Donation ID / Serial No. *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CBF-2026-001"
                      value={donationForm.number}
                      onChange={(e) => setDonationForm({ ...donationForm, number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Activity Photo (Optional)</label>
                    <input type="file" accept="image/*" onChange={handleDonationImageUpload} />
                    {compressingImg && <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>Compressing image...</span>}
                  </div>
                  <div className="form-group full">
                    <label>Donor Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="Village/Area, Chapainawabganj"
                      value={donationForm.donorAddress}
                      onChange={(e) => setDonationForm({ ...donationForm, donorAddress: e.target.value })}
                    />
                  </div>
                  <div className="form-group full">
                    <label>Notes / Medical Remarks</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Emergency voluntary donation at Sadar Hospital..."
                      value={donationForm.notes || ''}
                      onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    disabled={savingDonation || compressingImg}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      padding: '12px',
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    {savingDonation ? 'Saving Record...' : editingDonationId ? 'Update Record' : 'Save Record'}
                  </button>
                  {editingDonationId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDonationId(null);
                        setDonationForm({
                          donorName: '',
                          donorPhone: '',
                          donorAddress: '',
                          number: '',
                          bloodGroup: 'A+',
                          date: new Date().toISOString().split('T')[0],
                          image: null,
                          notes: '',
                        });
                      }}
                      style={{
                        padding: '12px 18px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Donation Records List */}
            <div className="admin-card" style={{ padding: '24px' }}>
              <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>
                Donation History ({donations.length} Records)
              </h3>

              <div style={{ maxHeight: '640px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {donations.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease',
                      flexWrap: 'wrap',
                    }}
                  >
                    {d.image ? (
                      <img
                        src={d.image}
                        alt={d.donorName}
                        style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '10px',
                          background: '#fee2e2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#dc2626',
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={20} />
                      </div>
                    )}
                    <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{d.donorName}</span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 6px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '6px',
                            fontWeight: 800,
                          }}
                        >
                          {d.bloodGroup}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        Date: {d.date} | ID: {d.number}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.donorAddress}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                      <button
                        onClick={() => handleEditDonation(d)}
                        type="button"
                        className="admin-btn-action admin-btn-edit"
                        title="Edit donation record"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDonation(d.id)}
                        type="button"
                        className="admin-btn-action admin-btn-delete"
                        title="Delete donation record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {donations.length === 0 && (
                  <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No donation records found.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MEMBERS & COMMITTEE MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'adminMembers' && (
          <div className="admin-card" style={{ padding: '24px' }}>
            <div
              className="admin-card-header-responsive"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: 800 }}>
                  Organization Members & Executive Committee
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Total {filteredMembers.length} of {members.length} members shown
                </p>
              </div>

              <button
                onClick={handleOpenAddMember}
                type="button"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                }}
              >
                <Plus size={16} />
                <span>Add New Member</span>
              </button>
            </div>

            {/* Search and Category Filters */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by name, role, phone or blood group..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="admin-search-input"
                  style={{ paddingRight: memberSearch ? '38px' : '16px' }}
                />
                {memberSearch && (
                  <button
                    type="button"
                    onClick={() => setMemberSearch('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="admin-filter-scroll">
                <button
                  type="button"
                  onClick={() => setMemberRoleFilter('all')}
                  className={`admin-filter-chip ${memberRoleFilter === 'all' ? 'active' : ''}`}
                >
                  সকল সদস্য ({members.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMemberRoleFilter('executive')}
                  className={`admin-filter-chip ${memberRoleFilter === 'executive' ? 'active' : ''}`}
                >
                  কার্যনির্বাহী ({members.filter((m) => m.roleType === 'executive' || !m.roleType).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMemberRoleFilter('adviser')}
                  className={`admin-filter-chip ${memberRoleFilter === 'adviser' ? 'active' : ''}`}
                >
                  উপদেষ্টা পরিষদ ({members.filter((m) => m.roleType === 'adviser').length})
                </button>
                <button
                  type="button"
                  onClick={() => setMemberRoleFilter('member')}
                  className={`admin-filter-chip ${memberRoleFilter === 'member' ? 'active' : ''}`}
                >
                  সাধারণ সদস্য ({members.filter((m) => m.roleType === 'member').length})
                </button>
              </div>
            </div>

            {/* 1. DESKTOP VIEW: Full Data Table */}
            <div className="admin-desktop-view">
              <div className="admin-table-container">
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Member Name</th>
                        <th>Designation / Role</th>
                        <th>Monthly Fee</th>
                        <th>Mobile Number</th>
                        <th>Blood Group</th>
                        <th>Category</th>
                        <th>Order</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((m) => (
                        <tr key={m.id}>
                          <td>
                            {m.image ? (
                              <img
                                src={m.image}
                                alt={m.name}
                                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '50%',
                                  background: '#fee2e2',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#dc2626',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                }}
                              >
                                {m.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                            {m.bio && (
                              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>{m.bio}</div>
                            )}
                          </td>
                          <td>
                            <span className="admin-badge-role">
                              {m.designation}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontWeight: 800, color: '#0f172a' }}>৳{m.monthlyFee || 0}</span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/মাস</span>
                            </div>
                          </td>
                          <td>
                            {m.mobile ? (
                              <a
                                href={`tel:${m.mobile}`}
                                style={{
                                  color: '#2563eb',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Phone size={12} />
                                <span>{m.mobile}</span>
                              </a>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                          <td>
                            {m.bloodGroup ? (
                              <span className="admin-badge-blood">
                                <Droplet size={11} fill="#dc2626" color="#dc2626" />
                                <span>{m.bloodGroup}</span>
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={
                                m.roleType === 'adviser'
                                  ? 'admin-badge-adviser'
                                  : m.roleType === 'executive' || !m.roleType
                                  ? 'admin-badge-executive'
                                  : 'admin-badge-general'
                              }
                            >
                              {m.roleType === 'adviser'
                                ? 'উপদেষ্টা পরিষদ'
                                : m.roleType === 'executive' || !m.roleType
                                ? 'কার্যনির্বাহী পরিষদ'
                                : 'সাধারণ সদস্য'}
                            </span>
                          </td>
                          <td style={{ color: '#64748b', fontWeight: 600 }}>{m.orderIndex || 0}</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => handleEditMember(m)}
                              type="button"
                              className="admin-btn-action admin-btn-edit"
                              style={{ marginRight: '6px' }}
                              title="Edit member"
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteMember(m.id, m.name)}
                              type="button"
                              className="admin-btn-action admin-btn-delete"
                              title="Remove member"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredMembers.length === 0 && (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            No committee or organization members recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 2. MOBILE VIEW: Responsive Member Cards */}
            <div className="admin-mobile-cards-view">
              {filteredMembers.map((m) => (
                <div key={m.id} className="admin-member-card">
                  {/* Card Header: Avatar & Name */}
                  <div className="admin-member-card-header">
                    {m.image ? (
                      <img src={m.image} alt={m.name} className="admin-member-card-avatar" />
                    ) : (
                      <div className="admin-member-card-avatar-fallback">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="admin-member-card-title">
                      <div className="admin-member-card-name">{m.name}</div>
                      <div className="admin-member-card-badges">
                        <span
                          className={
                            m.roleType === 'adviser'
                              ? 'admin-badge-adviser'
                              : m.roleType === 'executive' || !m.roleType
                              ? 'admin-badge-executive'
                              : 'admin-badge-general'
                          }
                        >
                          {m.roleType === 'adviser'
                            ? 'উপদেষ্টা'
                            : m.roleType === 'executive' || !m.roleType
                            ? 'কার্যনির্বাহী'
                            : 'সদস্য'}
                        </span>
                        <span className="admin-badge-order">#{m.orderIndex || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Details: Role & Blood Group */}
                  <div className="admin-member-card-details">
                    <div className="admin-member-card-row">
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>পদবী / ভূমিকা:</span>
                        <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{m.designation}</span>
                      </div>
                      {m.bloodGroup && (
                        <div className="admin-badge-blood">
                          <Droplet size={12} fill="#dc2626" color="#dc2626" />
                          <span>{m.bloodGroup}</span>
                        </div>
                      )}
                    </div>

                    <div className="admin-member-card-row" style={{ paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>মাসিক নির্ধারিত চাঁদা:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>৳{m.monthlyFee || 0} / মাস</span>
                    </div>

                    {m.mobile && (
                      <div className="admin-member-card-row" style={{ paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>মোবাইল:</span>
                        <a
                          href={`tel:${m.mobile}`}
                          style={{
                            color: '#2563eb',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          <Phone size={12} />
                          <span>{m.mobile}</span>
                        </a>
                      </div>
                    )}

                    {m.bio && (
                      <div style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', paddingTop: '2px' }}>
                        "{m.bio}"
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="admin-member-card-actions">
                    <button
                      onClick={() => handleEditMember(m)}
                      type="button"
                      className="admin-btn-action admin-btn-edit"
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteMember(m.id, m.name)}
                      type="button"
                      className="admin-btn-action admin-btn-delete"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}

              {filteredMembers.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <Users size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontWeight: 600 }}>
                    কোনো সদস্যের তথ্য পাওয়া যায়নি
                  </p>
                  {(memberSearch || memberRoleFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMemberSearch('');
                        setMemberRoleFilter('all');
                      }}
                      style={{
                        marginTop: '12px',
                        padding: '6px 14px',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ফিল্টার রিসেট করুন
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Member Add/Edit Modal */}
            {showMemberModal && (
              <div className="admin-modal-overlay">
                <div className="admin-card admin-modal-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>
                      {editingMemberId ? 'Edit Member Details' : 'Add New Organization Member'}
                    </h3>
                    <button
                      onClick={() => setShowMemberModal(false)}
                      type="button"
                      style={{
                        background: '#f1f5f9',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        borderRadius: '8px',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {memberFormMsg && (
                    <div
                      style={{
                        padding: '12px 14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        marginBottom: '18px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#0f172a',
                      }}
                    >
                      {memberFormMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveMember}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Member Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. মোঃ হিশাম উদ্দিন"
                          value={memberFormData.name}
                          onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Designation / Position *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. সভাপতি / সাধারণ সম্পাদক / উপদেষ্টা"
                          value={memberFormData.designation}
                          onChange={(e) => setMemberFormData({ ...memberFormData, designation: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Category / Committee</label>
                        <select
                          value={memberFormData.roleType}
                          onChange={(e) => setMemberFormData({ ...memberFormData, roleType: e.target.value })}
                        >
                          <option value="executive">কার্যনির্বাহী পরিষদ (Executive)</option>
                          <option value="adviser">উপদেষ্টা পরিষদ (Adviser)</option>
                          <option value="member">সাধারণ সদস্য (Member)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>মাসিক নির্ধারিত চাঁদা (টাকা)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="যেমন: ২০০ বা ৫০০"
                          value={memberFormData.monthlyFee ?? 0}
                          onChange={(e) => setMemberFormData({ ...memberFormData, monthlyFee: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Blood Group</label>
                        <select
                          value={memberFormData.bloodGroup || ''}
                          onChange={(e) => setMemberFormData({ ...memberFormData, bloodGroup: e.target.value })}
                        >
                          <option value="">-- নির্বাচন করুন --</option>
                          {VALID_BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Mobile Number (Admin only)</label>
                        <input
                          type="tel"
                          placeholder="01XXXXXXXXX"
                          value={memberFormData.mobile || ''}
                          onChange={(e) => setMemberFormData({ ...memberFormData, mobile: e.target.value })}
                        />
                      </div>
                      <div className="form-group full">
                        <label>Display Order Index (ক্রমিক)</label>
                        <input
                          type="number"
                          placeholder="1, 2, 3..."
                          value={memberFormData.orderIndex || 0}
                          onChange={(e) => setMemberFormData({ ...memberFormData, orderIndex: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="form-group full">
                        <label>Profile Photo</label>
                        <input type="file" accept="image/*" onChange={handleMemberImageUpload} />
                        {compressingMemberImg && <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>Compressing image...</span>}
                        {memberFormData.image && (
                          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={memberFormData.image}
                              alt="Preview"
                              style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #dc2626' }}
                            />
                            <button
                              type="button"
                              onClick={() => setMemberFormData({ ...memberFormData, image: null })}
                              style={{
                                padding: '5px 10px',
                                fontSize: '0.78rem',
                                color: '#ef4444',
                                background: '#fee2e2',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              Remove Photo
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="form-group full">
                        <label>Short Bio / Note (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. প্রতিষ্ঠাতাকালীন সদস্য"
                          value={memberFormData.bio || ''}
                          onChange={(e) => setMemberFormData({ ...memberFormData, bio: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                      <button
                        type="submit"
                        disabled={savingMember || compressingMemberImg}
                        style={{
                          flex: 1,
                          minWidth: '130px',
                          padding: '12px',
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        {savingMember ? 'Saving...' : editingMemberId ? 'Update Member' : 'Save Member'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMemberModal(false)}
                        style={{
                          padding: '12px 18px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: MEMBER DUES & PAYMENTS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'adminDues' && (
          <div className="admin-card" style={{ padding: '24px' }}>
            {/* Header with Title & Action Buttons */}
            <div
              className="admin-card-header-responsive"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>
                  মেম্বার চাঁদা ও পেমেন্ট ব্যবস্থাপনা
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  সংগঠনের মেম্বারদের মাসিক সাবস্ক্রিপশন, ইভেন্ট চাঁদা ও পেমেন্ট হিস্ট্রি
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleGenerateMonthlyDues}
                  disabled={generatingMonthly}
                  style={{
                    padding: '10px 16px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #dbeafe',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <RefreshCw size={15} className={generatingMonthly ? 'spin-icon' : ''} />
                  <span>{generatingMonthly ? 'জেনারেট হচ্ছে...' : 'চলতি মাসের চাঁদা তৈরি করুন'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddDue}
                  style={{
                    padding: '10px 18px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                  }}
                >
                  <Plus size={16} />
                  <span>নতুন চাঁদা / ইভেন্ট ডিউ</span>
                </button>
              </div>
            </div>

            {/* Top 4 Financial Overview Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div className="admin-stat-card">
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>মোট ধার্যকৃত চাঁদা</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                    ৳{duesStats.totalDueAmount.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>সর্বমোট {dues.length} টি ডিউ</span>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <Wallet size={20} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>সংগৃহীত মোট চাঁদা</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: '3px' }}>
                    ৳{duesStats.totalPaidAmount.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>{duesStats.paidCount} টি সম্পূর্ণ পরিশোধিত</span>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                  <CheckCircle2 size={20} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>মোট বকেয়া টাকা</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '3px' }}>
                    ৳{duesStats.totalPendingAmount.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>{duesStats.pendingCount} টি ডিউ বকেয়া/আংশিক</span>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <Clock size={20} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>আদায় সম্পন্ন হার</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginTop: '3px' }}>
                    {duesStats.totalDueAmount > 0 ? Math.round((duesStats.totalPaidAmount / duesStats.totalDueAmount) * 100) : 0}%
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>মোট চাঁদার অনুপাত</span>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <BarChart3 size={20} />
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="মেম্বারের নাম, মোবাইল বা চাঁদার শিরোনাম দিয়ে খুঁজুন..."
                  value={dueSearchQuery}
                  onChange={(e) => setDueSearchQuery(e.target.value)}
                  className="admin-search-input"
                  style={{ paddingRight: dueSearchQuery ? '38px' : '16px' }}
                />
                {dueSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDueSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Chips */}
              <div className="admin-filter-scroll">
                <button
                  type="button"
                  onClick={() => setDueStatusFilter('all')}
                  className={`admin-filter-chip ${dueStatusFilter === 'all' ? 'active' : ''}`}
                >
                  সকল ({dues.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDueStatusFilter('pending')}
                  className={`admin-filter-chip ${dueStatusFilter === 'pending' ? 'active' : ''}`}
                >
                  বকেয়া ({dues.filter((d) => d.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setDueStatusFilter('partial')}
                  className={`admin-filter-chip ${dueStatusFilter === 'partial' ? 'active' : ''}`}
                >
                  আংশিক পরিশোধ ({dues.filter((d) => d.status === 'partial').length})
                </button>
                <button
                  type="button"
                  onClick={() => setDueStatusFilter('paid')}
                  className={`admin-filter-chip ${dueStatusFilter === 'paid' ? 'active' : ''}`}
                >
                  পরিশোধিত ({dues.filter((d) => d.status === 'paid').length})
                </button>
              </div>

              {/* Type Filter */}
              <div className="admin-filter-scroll">
                <button
                  type="button"
                  onClick={() => setDueTypeFilter('all')}
                  className={`admin-filter-chip ${dueTypeFilter === 'all' ? 'active' : ''}`}
                >
                  সকল ধরন
                </button>
                <button
                  type="button"
                  onClick={() => setDueTypeFilter('monthly')}
                  className={`admin-filter-chip ${dueTypeFilter === 'monthly' ? 'active' : ''}`}
                >
                  মাসিক চাঁদা
                </button>
                <button
                  type="button"
                  onClick={() => setDueTypeFilter('event')}
                  className={`admin-filter-chip ${dueTypeFilter === 'event' ? 'active' : ''}`}
                >
                  ইভেন্ট / অন্যান্য
                </button>
              </div>

              {/* Member Selector Filter */}
              <select
                value={dueMemberFilter}
                onChange={(e) => setDueMemberFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  outline: 'none',
                }}
              >
                <option value="all">সকল মেম্বার</option>
                {members.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.name} ({m.designation})
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Table View */}
            <div className="admin-desktop-view">
              <div className="admin-table-container">
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>মেম্বার</th>
                        <th>চাঁদার বিবরণ ও ধরন</th>
                        <th>ধার্যকৃত টাকা</th>
                        <th>পরিশোধিত</th>
                        <th>বকেয়া</th>
                        <th>স্ট্যাটাস</th>
                        <th>পেমেন্ট তথ্য</th>
                        <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDues.map((d) => {
                        const remaining = Math.max(0, (Number(d.amount) || 0) - (Number(d.paidAmount) || 0));
                        return (
                          <tr key={d.id}>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.memberName || 'মেম্বার'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {d.memberDesignation} {d.memberPhone ? `• ${d.memberPhone}` : ''}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>{d.title}</div>
                              <div style={{ marginTop: '3px', display: 'flex', gap: '6px' }}>
                                <span className={d.dueType === 'monthly' ? 'admin-badge-monthly' : 'admin-badge-event'}>
                                  {d.dueType === 'monthly' ? 'মাসিক চাঁদা' : 'ইভেন্ট / কাস্টম'}
                                </span>
                                {d.dueDate && (
                                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    শেষ তারিখ: {d.dueDate}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontWeight: 800, color: '#0f172a' }}>৳{d.amount}</span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: '#15803d' }}>৳{d.paidAmount}</span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: remaining > 0 ? '#dc2626' : '#15803d' }}>
                                ৳{remaining}
                              </span>
                            </td>
                            <td>
                              <span
                                className={
                                  d.status === 'paid'
                                    ? 'admin-badge-paid'
                                    : d.status === 'partial'
                                    ? 'admin-badge-partial'
                                    : 'admin-badge-pending'
                                }
                              >
                                {d.status === 'paid' && <Check size={11} />}
                                {d.status === 'partial' && <CircleDollarSign size={11} />}
                                {d.status === 'pending' && <Clock size={11} />}
                                <span>
                                  {d.status === 'paid'
                                    ? 'পরিশোধিত'
                                    : d.status === 'partial'
                                    ? 'আংশিক পরিশোধ'
                                    : 'বকেয়া'}
                                </span>
                              </span>
                            </td>
                            <td>
                              {d.paymentDate ? (
                                <div style={{ fontSize: '0.78rem' }}>
                                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{d.paymentDate}</div>
                                  <div style={{ color: '#64748b', textTransform: 'capitalize' }}>
                                    {d.paymentMethod || 'Cash'} {d.paymentNote ? `(${d.paymentNote})` : ''}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>পরিশোধ হয়নি</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              {d.status !== 'paid' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPayModal(d)}
                                  className="admin-btn-action admin-btn-pay"
                                  style={{ marginRight: '6px' }}
                                  title="পেমেন্ট গ্রহণ করুন"
                                >
                                  <DollarSign size={13} />
                                  <span>পেমেন্ট নিন</span>
                                </button>
                              )}
                              {d.paidAmount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceipt(d)}
                                  className="admin-btn-action admin-btn-receipt"
                                  style={{ marginRight: '6px' }}
                                  title="রশিদ দেখুন / প্রিন্ট"
                                >
                                  <Receipt size={13} />
                                  <span>রশিদ</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEditDue(d)}
                                className="admin-btn-action admin-btn-edit"
                                style={{ marginRight: '6px' }}
                                title="এডিট করুন"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDue(d.id, d.title)}
                                className="admin-btn-action admin-btn-delete"
                                title="ডিলিট করুন"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredDues.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            কোনো চাঁদা বা ডিউ রেকর্ড পাওয়া যায়নি।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="admin-mobile-cards-view">
              {filteredDues.map((d) => {
                const remaining = Math.max(0, (Number(d.amount) || 0) - (Number(d.paidAmount) || 0));
                return (
                  <div key={d.id} className="admin-member-card">
                    <div className="admin-member-card-header">
                      <div className="admin-member-card-title" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div className="admin-member-card-name">{d.memberName || 'মেম্বার'}</div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.memberDesignation}</span>
                          </div>
                          <span
                            className={
                              d.status === 'paid'
                                ? 'admin-badge-paid'
                                : d.status === 'partial'
                                ? 'admin-badge-partial'
                                : 'admin-badge-pending'
                            }
                          >
                            {d.status === 'paid' ? 'পরিশোধিত' : d.status === 'partial' ? 'আংশিক' : 'বকেয়া'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="admin-member-card-details">
                      <div className="admin-member-card-row">
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{d.title}</span>
                        <span className={d.dueType === 'monthly' ? 'admin-badge-monthly' : 'admin-badge-event'}>
                          {d.dueType === 'monthly' ? 'মাসিক চাঁদা' : 'ইভেন্ট'}
                        </span>
                      </div>

                      <div className="admin-member-card-row" style={{ paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>ধার্যকৃত:</span>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>৳{d.amount}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>পরিশোধিত:</span>
                          <span style={{ fontWeight: 700, color: '#15803d' }}>৳{d.paidAmount}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>বকেয়া:</span>
                          <span style={{ fontWeight: 800, color: remaining > 0 ? '#dc2626' : '#15803d' }}>৳{remaining}</span>
                        </div>
                      </div>

                      {d.paymentDate && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                          পেমেন্ট: {d.paymentDate} • {d.paymentMethod || 'Cash'} {d.paymentNote ? `(${d.paymentNote})` : ''}
                        </div>
                      )}
                    </div>

                    <div className="admin-member-card-actions">
                      {d.status !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => handleOpenPayModal(d)}
                          className="admin-btn-action admin-btn-pay"
                          style={{ flex: 1 }}
                        >
                          <DollarSign size={14} />
                          <span>পেমেন্ট নিন</span>
                        </button>
                      )}
                      {d.paidAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(d)}
                          className="admin-btn-action admin-btn-receipt"
                        >
                          <Receipt size={14} />
                          <span>রশিদ</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEditDue(d)}
                        className="admin-btn-action admin-btn-edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDue(d.id, d.title)}
                        className="admin-btn-action admin-btn-delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredDues.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontWeight: 600 }}>
                    কোনো চাঁদা বা ডিউ পাওয়া যায়নি
                  </p>
                </div>
              )}
            </div>

            {/* Modal 1: Add New Due Modal */}
            {showAddDueModal && (
              <div className="admin-modal-overlay">
                <div className="admin-card admin-modal-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>
                      নতুন চাঁদা / ইভেন্ট ডিউ তৈরি করুন
                    </h3>
                    <button
                      onClick={() => setShowAddDueModal(false)}
                      type="button"
                      style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '8px', padding: '6px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {addDueMsg && (
                    <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '18px', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                      {addDueMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveDue}>
                    <div className="form-grid">
                      <div className="form-group full">
                        <label>কার জন্য ডিউ তৈরি হবে? *</label>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                            <input
                              type="radio"
                              name="targetType"
                              checked={addDueForm.targetType === 'single'}
                              onChange={() => setAddDueForm({ ...addDueForm, targetType: 'single', memberId: members.length > 0 ? String(members[0].id) : '' })}
                            />
                            নির্দিষ্ট একজন মেম্বার
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                            <input
                              type="radio"
                              name="targetType"
                              checked={addDueForm.targetType === 'all'}
                              onChange={() => setAddDueForm({ ...addDueForm, targetType: 'all', memberId: 'all' })}
                            />
                            সকল মেম্বারদের জন্য একসাথে ({members.length} জন)
                          </label>
                        </div>
                      </div>

                      {addDueForm.targetType === 'single' && (
                        <div className="form-group full">
                          <label>মেম্বার নির্বাচন করুন *</label>
                          <select
                            required
                            value={addDueForm.memberId}
                            onChange={(e) => setAddDueForm({ ...addDueForm, memberId: e.target.value })}
                          >
                            <option value="">-- মেম্বার নির্বাচন করুন --</option>
                            {members.map((m) => (
                              <option key={m.id} value={String(m.id)}>
                                {m.name} ({m.designation}) - বর্তমান ফি: ৳{m.monthlyFee || 0}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="form-group full">
                        <label>চাঁদার শিরোনাম / বিবরণ *</label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: ইফতার মাহফিল চাঁদা ২০২৬ / বিশেষ অনুদান"
                          value={addDueForm.title}
                          onChange={(e) => setAddDueForm({ ...addDueForm, title: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>চাঁদার ধরন *</label>
                        <select
                          value={addDueForm.dueType}
                          onChange={(e) => setAddDueForm({ ...addDueForm, dueType: e.target.value })}
                        >
                          <option value="event">ইভেন্ট চাঁদা (Event Fee)</option>
                          <option value="monthly">মাসিক চাঁদা (Monthly Subscription)</option>
                          <option value="custom">অন্যান্য কাস্টম ডিউ (Custom)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>টাকার পরিমাণ (৳) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="যেমন: ৫০০"
                          value={addDueForm.amount || ''}
                          onChange={(e) => setAddDueForm({ ...addDueForm, amount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="form-group">
                        <label>পরিশোধের শেষ তারিখ</label>
                        <input
                          type="date"
                          value={addDueForm.dueDate || ''}
                          onChange={(e) => setAddDueForm({ ...addDueForm, dueDate: e.target.value })}
                        />
                      </div>

                      <div className="form-group full">
                        <label>নোট / মন্তব্য (ঐচ্ছিক)</label>
                        <input
                          type="text"
                          placeholder="যেমন: চাঁভালি ঈদ পুনর্মিলনী উপলক্ষ্যে"
                          value={addDueForm.notes || ''}
                          onChange={(e) => setAddDueForm({ ...addDueForm, notes: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                      <button
                        type="submit"
                        disabled={savingDue}
                        style={{
                          flex: 1,
                          minWidth: '130px',
                          padding: '12px',
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        {savingDue ? 'তৈরি হচ্ছে...' : 'ডিউ সংরক্ষণ করুন'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddDueModal(false)}
                        style={{
                          padding: '12px 18px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        বাতিল
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal 2: Pay Due Modal */}
            {showPayModal && payingDue && (
              <div className="admin-modal-overlay">
                <div className="admin-card admin-modal-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>
                        পেমেন্ট গ্রহণ ও পরিশোধ
                      </h3>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {payingDue.memberName} • {payingDue.title}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowPayModal(false)}
                      type="button"
                      style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '8px', padding: '6px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '14px',
                      borderRadius: '12px',
                      marginBottom: '18px',
                      border: '1px solid #e2e8f0',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '10px',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>মোট চাঁদা</span>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>৳{payingDue.amount}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>পূর্ব পরিশোধিত</span>
                      <strong style={{ fontSize: '1.1rem', color: '#15803d' }}>৳{payingDue.paidAmount}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>অবশিষ্ট বকেয়া</span>
                      <strong style={{ fontSize: '1.1rem', color: '#dc2626' }}>
                        ৳{Math.max(0, payingDue.amount - payingDue.paidAmount)}
                      </strong>
                    </div>
                  </div>

                  {payMsg && (
                    <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '18px', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                      {payMsg}
                    </div>
                  )}

                  <form onSubmit={handleProcessPayment}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>জমার পরিমাণ (টাকা) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="টাকার পরিমাণ লিখুন"
                          value={payForm.paidAmount || ''}
                          onChange={(e) => setPayForm({ ...payForm, paidAmount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="form-group">
                        <label>পেমেন্টের তারিখ *</label>
                        <input
                          type="date"
                          required
                          value={payForm.paymentDate}
                          onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>পেমেন্ট মাধ্যম *</label>
                        <select
                          value={payForm.paymentMethod}
                          onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                        >
                          <option value="cash">নগদ গ্রহণ (Cash)</option>
                          <option value="bkash">বিকাশ (bKash)</option>
                          <option value="nagad">নগদ (Nagad App)</option>
                          <option value="rocket">রকেট (Rocket)</option>
                          <option value="bank">ব্যাংক একাউন্ট (Bank Transfer)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>ট্রানজেকশন আইডি / রেফারেন্স নোট</label>
                        <input
                          type="text"
                          placeholder="যেমন: TrxID: 9X7B6... বা ক্যাশ গ্রহণকারী"
                          value={payForm.paymentNote || ''}
                          onChange={(e) => setPayForm({ ...payForm, paymentNote: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                      <button
                        type="submit"
                        disabled={processingPayment}
                        style={{
                          flex: 1,
                          minWidth: '130px',
                          padding: '12px',
                          background: '#15803d',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        {processingPayment ? 'পেমেন্ট হচ্ছে...' : 'পেমেন্ট নিশ্চিত করুন'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPayModal(false)}
                        style={{
                          padding: '12px 18px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        বাতিল
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal 3: Edit Due Modal */}
            {showEditDueModal && editingDue && (
              <div className="admin-modal-overlay">
                <div className="admin-card admin-modal-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>
                      ডিউ তথ্য এডিট করুন
                    </h3>
                    <button
                      onClick={() => setShowEditDueModal(false)}
                      type="button"
                      style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '8px', padding: '6px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {editDueMsg && (
                    <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '18px', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                      {editDueMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveEditDue}>
                    <div className="form-grid">
                      <div className="form-group full">
                        <label>চাঁদার শিরোনাম *</label>
                        <input
                          type="text"
                          required
                          value={editDueForm.title}
                          onChange={(e) => setEditDueForm({ ...editDueForm, title: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>মোট ধার্যকৃত টাকা *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editDueForm.amount}
                          onChange={(e) => setEditDueForm({ ...editDueForm, amount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="form-group">
                        <label>পরিশোধিত টাকা</label>
                        <input
                          type="number"
                          min="0"
                          value={editDueForm.paidAmount}
                          onChange={(e) => setEditDueForm({ ...editDueForm, paidAmount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="form-group">
                        <label>স্ট্যাটাস</label>
                        <select
                          value={editDueForm.status}
                          onChange={(e) => setEditDueForm({ ...editDueForm, status: e.target.value })}
                        >
                          <option value="pending">বকেয়া (Pending)</option>
                          <option value="partial">আংশিক পরিশোধ (Partial)</option>
                          <option value="paid">পরিশোধিত (Paid)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>পরিশোধের শেষ তারিখ</label>
                        <input
                          type="date"
                          value={editDueForm.dueDate}
                          onChange={(e) => setEditDueForm({ ...editDueForm, dueDate: e.target.value })}
                        />
                      </div>

                      <div className="form-group full">
                        <label>মন্তব্য / নোট</label>
                        <input
                          type="text"
                          value={editDueForm.notes}
                          onChange={(e) => setEditDueForm({ ...editDueForm, notes: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                      <button
                        type="submit"
                        disabled={savingEditDue}
                        style={{
                          flex: 1,
                          minWidth: '130px',
                          padding: '12px',
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        {savingEditDue ? 'সংরক্ষণ হচ্ছে...' : 'আপডেট সম্পন্ন করুন'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEditDueModal(false)}
                        style={{
                          padding: '12px 18px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        বাতিল
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal 4: Digital Receipt / Voucher Modal */}
            {showReceiptModal && receiptDue && (
              <div className="admin-modal-overlay">
                <div className="admin-card admin-modal-card" style={{ maxWidth: '520px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: 800 }}>
                      পেমেন্ট মানি রিসিট
                    </h3>
                    <button
                      onClick={() => setShowReceiptModal(false)}
                      type="button"
                      style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '8px', padding: '6px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Printable Receipt Card */}
                  <div className="due-receipt-card">
                    <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '18px' }}>
                      <div style={{ width: '48px', height: '48px', margin: '0 auto 8px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                        <Droplet size={26} fill="#dc2626" />
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                        চাঁভালি রক্ত ফাউন্ডেশন
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                        মেম্বার চাঁদা ও অনুদান জমা রশিদ
                      </p>
                      <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                        রশিদ নং: #CBF-REC-{receiptDue.id} | তারিখ: {receiptDue.paymentDate || new Date().toISOString().split('T')[0]}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>মেম্বারের নাম:</span>
                        <strong style={{ color: '#0f172a' }}>{receiptDue.memberName}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>পদবী:</span>
                        <span style={{ color: '#0f172a' }}>{receiptDue.memberDesignation || 'সদস্য'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>চাঁদার বিবরণ:</span>
                        <span style={{ color: '#0f172a', fontWeight: 600 }}>{receiptDue.title}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>পেমেন্ট মাধ্যম:</span>
                        <span style={{ color: '#0f172a', textTransform: 'capitalize' }}>
                          {receiptDue.paymentMethod || 'নগদ গ্রহণ'} {receiptDue.paymentNote ? `(${receiptDue.paymentNote})` : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>মোট নির্ধারিত চাঁদা:</span>
                        <span style={{ color: '#0f172a' }}>৳{receiptDue.amount}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                        <span style={{ color: '#065f46', fontWeight: 700 }}>পরিশোধিত টাকা:</span>
                        <strong style={{ color: '#15803d', fontSize: '1.15rem' }}>৳{receiptDue.paidAmount}</strong>
                      </div>
                      {Math.max(0, receiptDue.amount - receiptDue.paidAmount) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#fef2f2', borderRadius: '8px' }}>
                          <span style={{ color: '#991b1b', fontWeight: 600 }}>অবশিষ্ট বকেয়া:</span>
                          <strong style={{ color: '#dc2626' }}>৳{Math.max(0, receiptDue.amount - receiptDue.paidAmount)}</strong>
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '14px', fontSize: '0.78rem', color: '#64748b' }}>
                      <p style={{ margin: 0 }}>স্বেচ্ছাসেবী রক্তদানে আপনার নিয়মিত অবদান প্রশংসনীয়। ধন্যবাদ!</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{
                        flex: 1,
                        padding: '11px',
                        background: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Printer size={16} />
                      <span>রশিদ প্রিন্ট / PDF সংরক্ষণ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReceiptModal(false)}
                      style={{
                        padding: '11px 18px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CERTIFICATES GENERATOR */}
        {/* ========================================================================= */}
        {activeTab === 'adminCertificates' && (
          <div className="admin-tab-two-col">
            {/* Left form controls */}
            <div className="admin-card" style={{ padding: '24px' }}>
              <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>
                Certificate Generator
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Auto-fill from Donation Record
                </label>
                <select
                  onChange={(e) => handleSelectDonationForCert(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontWeight: 600,
                  }}
                >
                  <option value="">-- Choose a donation record --</option>
                  {donations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.donorName} ({d.bloodGroup}) - {d.date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Donor Name *</label>
                  <input
                    type="text"
                    required
                    value={certDonorName}
                    onChange={(e) => setCertDonorName(e.target.value)}
                    placeholder="Donor's Full Name"
                  />
                </div>
                <div className="form-group">
                  <label>Blood Group *</label>
                  <select value={certBloodGroup} onChange={(e) => setCertBloodGroup(e.target.value)}>
                    {VALID_BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Donation Date *</label>
                  <input type="date" required value={certDate} onChange={(e) => setCertDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Certificate / Donation ID</label>
                  <input
                    type="text"
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    placeholder="e.g. CBF-2026-001"
                  />
                </div>
                <div className="form-group full">
                  <label>Certificate Citation / Message</label>
                  <textarea
                    rows={3}
                    value={certMessageText}
                    onChange={(e) => setCertMessageText(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                  ></textarea>
                </div>
              </div>

              {certSaveMsg && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    margin: '16px 0',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    color: '#0f172a',
                  }}
                >
                  {certSaveMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSaveCertificate}
                  disabled={certLoading}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '12px',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Save size={16} />
                  <span>{certLoading ? 'Saving...' : 'Save to Database'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCert}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '12px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Download size={16} />
                  <span>Download (PNG)</span>
                </button>
              </div>

              {savedCertId && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Link
                    href={`/certificates/${savedCertId}`}
                    target="_blank"
                    style={{
                      color: '#2563eb',
                      textDecoration: 'underline',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>Open Public Certificate Page</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              )}
            </div>

            {/* Right preview canvas */}
            <div className="admin-card" style={{ padding: '24px', overflowX: 'auto' }}>
              <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '14px' }}>
                Live Certificate Preview
              </h3>

              <div
                ref={certRef}
                style={{
                  background: '#ffffff',
                  padding: '24px 16px',
                  borderRadius: '16px',
                  border: '6px double #dc2626',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  minWidth: '280px',
                  maxWidth: '100%',
                  margin: '0 auto',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <img
                    src="/uploads/logo.png"
                    alt="Logo"
                    style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <h4 style={{ color: '#dc2626', margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Chavali Blood Foundation</h4>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '4px 0 12px 0' }}>
                  Serving Humanity with Every Drop
                </p>

                <div style={{ margin: '10px auto', borderBottom: '2px solid #dc2626', width: '50px' }}></div>

                <h5 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '10px 0', fontWeight: 700 }}>
                  Certificate of Appreciation
                </h5>

                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.7', margin: '12px 0' }}>
                  Presented with highest gratitude to{' '}
                  <strong style={{ color: '#dc2626', fontSize: '1.05rem' }}>
                    {certDonorName || '[Donor Name]'}
                  </strong>{' '}
                  for voluntarily donating blood through Chavali Blood Foundation to help save an invaluable human life.
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    background: '#fef2f2',
                    padding: '10px',
                    borderRadius: '10px',
                    margin: '14px 0',
                    border: '1px solid #fecaca',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Blood Group</span>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#dc2626' }}>
                      {certBloodGroup}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Date</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{certDate}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Certificate ID</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                      {certNumber || 'CBF-2026'}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginTop: '28px',
                    padding: '0 10px',
                    gap: '12px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #94a3b8', width: '80px', marginBottom: '4px' }}></div>
                    <span style={{ fontSize: '0.72rem', color: '#475569' }}>General Secretary</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #94a3b8', width: '80px', marginBottom: '4px' }}></div>
                    <span style={{ fontSize: '0.72rem', color: '#475569' }}>President</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: GALLERY MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'adminGallery' && (
          <div className="admin-card" style={{ padding: '24px' }}>
            <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>
              Gallery Photos & Uploads
            </h3>

            <form onSubmit={handleSaveGallery} style={{ maxWidth: '600px', marginBottom: '30px' }}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Photo Title / Caption</label>
                  <input
                    type="text"
                    placeholder="e.g. Free Blood Grouping Campaign 2026"
                    value={galleryCaption}
                    onChange={(e) => setGalleryCaption(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={galleryCategory} onChange={(e) => setGalleryCategory(e.target.value)}>
                    <option value="general">Campaigns & Assemblies (General)</option>
                    <option value="donation">Donation Activities (Donation)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Select Photo File *</label>
                  <input type="file" accept="image/*" required onChange={handleGalleryImageUpload} />
                </div>
              </div>

              {galleryImgData && (
                <div style={{ margin: '14px 0' }}>
                  <img
                    src={galleryImgData}
                    alt="Preview"
                    style={{ maxWidth: '200px', borderRadius: '10px', border: '2px solid #dc2626' }}
                  />
                </div>
              )}

              {galleryMsg && (
                <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', margin: '14px 0', fontSize: '0.88rem', fontWeight: 600 }}>
                  {galleryMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={uploadingGallery}
                style={{
                  marginTop: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <Upload size={16} />
                <span>{uploadingGallery ? 'Uploading Photo...' : 'Upload Photo'}</span>
              </button>
            </form>

            <h4 style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 800, marginBottom: '14px' }}>
              Current Gallery Photos ({gallery.length} Total)
            </h4>

            <div className="admin-gallery-grid">
              {gallery.map((img) => (
                <div
                  key={img.id}
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    position: 'relative',
                  }}
                >
                  <img
                    src={img.data || img.imageData}
                    alt={img.caption || 'Gallery Photo'}
                    style={{ width: '100%', height: '130px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '10px 12px' }}>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        margin: 0,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {img.caption || 'Untitled Photo'}
                    </p>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'capitalize' }}>
                      {img.category}
                    </span>
                    <button
                      onClick={() => handleDeleteGalleryItem(img.id)}
                      type="button"
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '6px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {gallery.length === 0 && (
                <p style={{ color: '#94a3b8', gridColumn: '1 / -1', padding: '20px 0' }}>
                  No photos uploaded to gallery yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CONTACT MESSAGES INBOX */}
        {/* ========================================================================= */}
        {activeTab === 'adminMessages' && (
          <div className="admin-card" style={{ padding: '24px' }}>
            <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>
              Contact Messages Inbox ({messages.length} Messages)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    background: msg.isRead ? '#ffffff' : '#fef2f2',
                    border: msg.isRead ? '1px solid #e2e8f0' : '1px solid #fecaca',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        {msg.name}{' '}
                        {!msg.isRead && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              background: '#dc2626',
                              color: '#fff',
                              borderRadius: '10px',
                              fontWeight: 800,
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </h4>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {msg.phone && (
                          <a href={`tel:${msg.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Phone size={12} />
                            <span>{msg.phone}</span>
                          </a>
                        )}
                        {msg.email && (
                          <a href={`mailto:${msg.email}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Mail size={12} />
                            <span>{msg.email}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleToggleMessageRead(msg)}
                        type="button"
                        style={{
                          padding: '6px 12px',
                          background: '#f1f5f9',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#475569',
                        }}
                      >
                        {msg.isRead ? 'Mark as Unread' : 'Mark as Read'}
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        type="button"
                        style={{
                          padding: '6px 12px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {msg.subject && (
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', marginTop: '10px' }}>
                      Subject: {msg.subject}
                    </div>
                  )}

                  <p style={{ marginTop: '8px', color: '#475569', fontSize: '0.92rem', lineHeight: '1.6', wordBreak: 'break-word' }}>
                    {msg.message}
                  </p>
                </div>
              ))}
              {messages.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No messages in inbox.</p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'adminAnalytics' && (
          <div className="admin-card" style={{ padding: '24px' }}>
            <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '20px' }}>
              Blood Group Distribution & Analytics
            </h3>

            <div className="admin-analytics-grid">
              {VALID_BLOOD_GROUPS.map((bg) => {
                const count = stats.bloodGroupBreakdown?.[bg] || 0;
                const total = stats.totalDonors || 1;
                const percent = Math.round((count / total) * 100);

                return (
                  <div
                    key={bg}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626' }}>{bg}</span>
                      <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>{percent}%</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '6px', color: '#0f172a' }}>
                      {count} Donors
                    </div>
                    <div
                      style={{
                        marginTop: '8px',
                        height: '6px',
                        background: '#f1f5f9',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{ width: `${percent}%`, height: '100%', background: '#dc2626', borderRadius: '3px' }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: USERS & PERMISSIONS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'adminUsers' && (
          <div className="admin-card" style={{ padding: '24px' }}>
            {/* Header */}
            <div
              className="admin-card-header-responsive"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>
                  ইউজার ও পারমিশন ব্যবস্থাপনা
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  নতুন ইউজার তৈরি করুন এবং টিকমার্কের মাধ্যমে নির্দিষ্ট মডিউলের পারমিশন নির্ধারণ করুন
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddUser}
                style={{
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                }}
              >
                <UserPlus size={16} />
                <span>নতুন ইউজার তৈরি করুন</span>
              </button>
            </div>

            {/* Top 4 Stat Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div className="admin-stat-card">
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>মোট সিস্টেম ইউজার</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                    {users.length} জন
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>রেজিস্টার্ড একাউন্ট</span>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <Users size={20} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>সুপার এডমিন</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8', marginTop: '3px' }}>
                    {users.filter((u) => u.role === 'super_admin').length} জন
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600 }}>পূর্ণ এক্সেসপ্রাপ্ত</span>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
                  <ShieldCheck size={20} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>সাব-এডমিন / মডারেটর</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                    {users.filter((u) => u.role !== 'super_admin').length} জন
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>কাস্টম পারমিশনপ্রাপ্ত</span>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <UserCog size={20} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>সক্রিয় একাউন্ট</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: '3px' }}>
                    {users.filter((u) => u.isActive !== false).length} জন
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>লগইন সক্রিয়</span>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                  <CheckCircle2 size={20} />
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="ইউজারের নাম অথবা ইউজারনেম দিয়ে খুঁজুন..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="admin-search-input"
                  style={{ paddingRight: userSearch ? '38px' : '16px' }}
                />
                {userSearch && (
                  <button
                    type="button"
                    onClick={() => setUserSearch('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Users Table */}
            <div className="admin-desktop-view">
              <div className="admin-table-container">
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ইউজার তথ্য</th>
                        <th>রোল / ভূমিকা</th>
                        <th>অনুমোদিত পারমিশনসমূহ</th>
                        <th>স্ট্যাটাস</th>
                        <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const isSuper = u.role === 'super_admin' || u.permissions?.includes('all');
                        return (
                          <tr key={u.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    background: isSuper ? '#fee2e2' : '#eff6ff',
                                    color: isSuper ? '#dc2626' : '#1d4ed8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  {(u.name || u.username).slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.name || u.username}</div>
                                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>@{u.username}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={isSuper ? 'user-role-super' : 'user-role-sub'}>
                                {isSuper ? <Shield size={12} /> : <UserCheck size={12} />}
                                <span>{isSuper ? 'সুপার এডমিন' : 'সাব-এডমিন'}</span>
                              </span>
                            </td>
                            <td>
                              {isSuper ? (
                                <span className="perm-tag-chip" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#a7f3d0' }}>
                                  <Check size={11} />
                                  <span>সকল মডিউলে পূর্ণ এক্সেস</span>
                                </span>
                              ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '400px' }}>
                                  {(u.permissions || []).map((permKey) => {
                                    const def = PERMISSIONS_LIST.find((p) => p.key === permKey);
                                    return (
                                      <span key={permKey} className="perm-tag-chip">
                                        {def?.label || permKey}
                                      </span>
                                    );
                                  })}
                                  {(!u.permissions || u.permissions.length === 0) && (
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>কোনো পারমিশন দেওয়া হয়নি</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={u.isActive !== false ? 'user-status-active' : 'user-status-inactive'}>
                                {u.isActive !== false ? <Check size={11} /> : <X size={11} />}
                                <span>{u.isActive !== false ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}</span>
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                className="admin-btn-action admin-btn-edit"
                                style={{ marginRight: '6px' }}
                                title="এডিট ও পারমিশন পরিবর্তন"
                              >
                                <Edit2 size={13} />
                                <span>এডিট</span>
                              </button>
                              {String(u.id) !== String(currentUser?.id) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  className="admin-btn-action admin-btn-delete"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 size={13} />
                                  <span>ডিলিট</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            কোনো ইউজার পাওয়া যায়নি।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Mobile Users Cards View */}
            <div className="admin-mobile-cards-view">
              {filteredUsers.map((u) => {
                const isSuper = u.role === 'super_admin' || u.permissions?.includes('all');
                return (
                  <div key={u.id} className="admin-member-card">
                    <div className="admin-member-card-header">
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: isSuper ? '#fee2e2' : '#eff6ff',
                          color: isSuper ? '#dc2626' : '#1d4ed8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          flexShrink: 0,
                        }}
                      >
                        {(u.name || u.username).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="admin-member-card-title" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div className="admin-member-card-name">{u.name || u.username}</div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>@{u.username}</span>
                          </div>
                          <span className={u.isActive !== false ? 'user-status-active' : 'user-status-inactive'}>
                            {u.isActive !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="admin-member-card-details">
                      <div className="admin-member-card-row">
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>রোল / ভূমিকা:</span>
                        <span className={isSuper ? 'user-role-super' : 'user-role-sub'}>
                          {isSuper ? 'সুপার এডমিন' : 'সাব-এডমিন'}
                        </span>
                      </div>

                      <div style={{ paddingTop: '6px', borderTop: '1px dashed #e2e8f0' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                          পারমিশনসমূহ:
                        </span>
                        {isSuper ? (
                          <span className="perm-tag-chip" style={{ background: '#dcfce7', color: '#15803d' }}>
                            সকল মডিউলে পূর্ণ এক্সেস
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(u.permissions || []).map((permKey) => {
                              const def = PERMISSIONS_LIST.find((p) => p.key === permKey);
                              return (
                                <span key={permKey} className="perm-tag-chip">
                                  {def?.label || permKey}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="admin-member-card-actions">
                      <button
                        type="button"
                        onClick={() => handleOpenEditUser(u)}
                        className="admin-btn-action admin-btn-edit"
                        style={{ flex: 1 }}
                      >
                        <Edit2 size={14} />
                        <span>এডিট ও পারমিশন</span>
                      </button>
                      {String(u.id) !== String(currentUser?.id) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="admin-btn-action admin-btn-delete"
                        >
                          <Trash2 size={14} />
                          <span>ডিলিট</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal: Add/Edit User Modal with Checkboxes */}
            {showUserModal && (
              <div className="admin-modal-overlay">
                <div className="admin-card admin-modal-card" style={{ maxWidth: '640px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>
                      {editingUserId ? 'ইউজার তথ্য ও পারমিশন পরিবর্তন' : 'নতুন ইউজার তৈরি ও পারমিশন নির্ধারণ'}
                    </h3>
                    <button
                      onClick={() => setShowUserModal(false)}
                      type="button"
                      style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '8px', padding: '6px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {userFormMsg && (
                    <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '18px', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                      {userFormMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveUser}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>ইউজারের নাম (Full Name) *</label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: আহমদ করিম"
                          value={userFormData.name || ''}
                          onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>লগইন ইউজারনেম *</label>
                        <input
                          type="text"
                          required
                          disabled={Boolean(editingUserId)}
                          placeholder="যেমন: karim_admin"
                          value={userFormData.username}
                          onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                          style={{ background: editingUserId ? '#f1f5f9' : '#ffffff' }}
                        />
                      </div>

                      <div className="form-group">
                        <label>{editingUserId ? 'নতুন পাসওয়ার্ড (ঐচ্ছিক)' : 'লগইন পাসওয়ার্ড *'}</label>
                        <input
                          type="password"
                          required={!editingUserId}
                          placeholder={editingUserId ? 'পরিবর্তন না করতে চাইলে খালি রাখুন' : 'কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড'}
                          value={userFormData.password || ''}
                          onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>ইউজারের ভূমিকা (Role) *</label>
                        <select
                          value={userFormData.role}
                          onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as any })}
                        >
                          <option value="sub_admin">সাব-এডমিন / মডারেটর (কাস্টম পারমিশন)</option>
                          <option value="super_admin">সুপার এডমিন (পূর্ণ এক্সেস)</option>
                        </select>
                      </div>

                      <div className="form-group full">
                        <label>একাউন্ট স্ট্যাটাস</label>
                        <select
                          value={userFormData.isActive !== false ? 'active' : 'inactive'}
                          onChange={(e) => setUserFormData({ ...userFormData, isActive: e.target.value === 'active' })}
                        >
                          <option value="active">সক্রিয় (Active - লগইন করতে পারবে)</option>
                          <option value="inactive">নিষ্ক্রিয় (Inactive - সাময়িক ব্লক)</option>
                        </select>
                      </div>

                      {/* Permission Checkboxes Section */}
                      <div className="form-group full" style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <label style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                            মডিউলভিত্তিক এক্সেস পারমিশনসমূহ (টিক দিন) *
                          </label>

                          {userFormData.role !== 'super_admin' && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={handleSelectAllPermissions}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                              >
                                সব সিলেক্ট করুন
                              </button>
                              <button
                                type="button"
                                onClick={handleClearAllPermissions}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: '#f8fafc',
                                  color: '#64748b',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                              >
                                ক্লিয়ার করুন
                              </button>
                            </div>
                          )}
                        </div>

                        {userFormData.role === 'super_admin' ? (
                          <div style={{ padding: '14px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '0.88rem', fontWeight: 600 }}>
                            <ShieldCheck size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                            সুপার এডমিন রোল নির্বাচিত থাকায় এই ইউজার স্বয়ংক্রিয়ভাবে সবকটি মডিউলে পূর্ণ এক্সেস পাবেন।
                          </div>
                        ) : (
                          <div className="perm-checkbox-grid">
                            {PERMISSIONS_LIST.map((perm) => {
                              const isChecked = (userFormData.permissions || []).includes(perm.key);
                              return (
                                <label
                                  key={perm.key}
                                  className={`perm-checkbox-card ${isChecked ? 'checked' : ''}`}
                                  onClick={(e) => {
                                    // Prevent double toggle from label + checkbox native event
                                    if ((e.target as HTMLElement).tagName !== 'INPUT') {
                                      handleTogglePermission(perm.key);
                                    }
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleTogglePermission(perm.key)}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isChecked ? '#991b1b' : '#1e293b' }}>
                                      {perm.label}
                                    </div>
                                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                                      {perm.description}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                      <button
                        type="submit"
                        disabled={savingUser}
                        style={{
                          flex: 1,
                          minWidth: '130px',
                          padding: '12px',
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        {savingUser ? 'সংরক্ষণ হচ্ছে...' : editingUserId ? 'আপডেট সম্পন্ন করুন' : 'ইউজার সংরক্ষণ করুন'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUserModal(false)}
                        style={{
                          padding: '12px 18px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        বাতিল
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: SETTINGS & PASSWORD */}
        {/* ========================================================================= */}
        {activeTab === 'adminSettings' && (
          <div className="admin-card" style={{ padding: '24px' }}>
            <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>
              Change Admin Password
            </h3>

            {pwdMsg && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  marginBottom: '18px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  color: '#0f172a',
                }}
              >
                {pwdMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ maxWidth: '440px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new secure password"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                  }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={savingPwd}
                style={{
                  padding: '12px 24px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                {savingPwd ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
