'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { compressImage } from '@/lib/image-compress';
import {
  Donor,
  DonorInput,
  Donation,
  DonationInput,
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
} from 'lucide-react';

type AdminTab =
  | 'adminDonors'
  | 'adminDonations'
  | 'adminCertificates'
  | 'adminGallery'
  | 'adminMessages'
  | 'adminAnalytics'
  | 'adminSettings';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: any;
  count?: number;
  badge?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}


export default function AdminPage() {
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
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
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

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

  // 1. Initial auth check
  useEffect(() => {
    const savedToken = localStorage.getItem('cbf_admin_token');
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    }
  }, []);

  // 2. Fetch all data upon login
  useEffect(() => {
    if (isLoggedIn) {
      fetchAllData();
    }
  }, [isLoggedIn]);

  const verifyToken = async (jwtToken: string) => {
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('cbf_admin_token');
        setToken(null);
        setIsLoggedIn(false);
      }
    } catch {
      localStorage.removeItem('cbf_admin_token');
      setToken(null);
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
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) setDonors(d.data);
        })
        .catch(() => {});

      // 4. Donations (authorized)
      fetch('/api/donations', { headers })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) setDonations(d.data);
        })
        .catch(() => {});

      // 5. Gallery
      fetch('/api/gallery')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) setGallery(d.data);
        })
        .catch(() => {});

      // 6. Certificates (authorized)
      fetch('/api/certificates', { headers })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) setCertificates(d.data);
        })
        .catch(() => {});

      // 7. Messages (authorized)
      fetch('/api/contact', { headers })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) setMessages(d.data);
        })
        .catch(() => {});
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const curToken = token || localStorage.getItem('cbf_admin_token');
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
        localStorage.setItem('cbf_admin_token', data.token);
        setToken(data.token);
        setIsLoggedIn(true);
        setLoginForm({ username: '', password: '' });
      } else {
        setLoginMessage(data.message || 'Invalid username or password.');
      }
    } catch {
      setLoginMessage('Network error occurred while connecting to the server.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cbf_admin_token');
    setToken(null);
    setIsLoggedIn(false);
    setSidebarOpen(false);
  };

  const handleNavClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
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

  const navMenuItems: NavGroup[] = [
    {
      group: 'MANAGEMENT',
      items: [
        { id: 'adminDonors', label: 'Donors Directory', icon: Users, count: donors.length },
        { id: 'adminDonations', label: 'Donation Records', icon: FileText, count: donations.length },
        { id: 'adminCertificates', label: 'Certificate Generator', icon: Award, count: certificates.length },
        { id: 'adminGallery', label: 'Gallery Management', icon: ImageIcon, count: gallery.length },
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
        },
      ],
    },
    {
      group: 'INSIGHTS & SYSTEM',
      items: [
        { id: 'adminAnalytics', label: 'Analytics & Reports', icon: BarChart3 },
        { id: 'adminSettings', label: 'Settings & Security', icon: Key },
      ],
    },
  ];

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
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              AD
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                Administrator
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: '#166534',
                  background: '#dcfce7',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  fontWeight: 700,
                }}
              >
                Super Admin
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px',
            marginBottom: '26px',
          }}
        >
          <div className="admin-stat-card">
            <div>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Total Donors</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {(stats.totalDonors || donors.length).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Active in database</span>
            </div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
              }}
            >
              <Users size={22} />
            </div>
          </div>

          <div className="admin-stat-card">
            <div>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Donation Records</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {(stats.totalDonations || donations.length).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>Documented activities</span>
            </div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <FileText size={22} />
            </div>
          </div>

          <div className="admin-stat-card">
            <div>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Certificates Issued</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {(stats.totalCertificates || certificates.length).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Generated & saved</span>
            </div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Award size={22} />
            </div>
          </div>

          <div className="admin-stat-card">
            <div>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Unread Messages</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {messages.filter((m) => !m.isRead).length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600 }}>{messages.length} total received</span>
            </div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#f5f3ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b5cf6',
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
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by name, phone number, or area..."
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                  className="admin-search-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => setDonorGroupFilter('all')}
                  className={`admin-filter-chip ${donorGroupFilter === 'all' ? 'active' : ''}`}
                >
                  All
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

            {/* Clean Donors Table */}
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

            {/* Donor Add/Edit Modal */}
            {showDonorModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.5)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 2000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                }}
              >
                <div
                  className="admin-card"
                  style={{
                    maxWidth: '560px',
                    width: '100%',
                    padding: '30px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>
                      {editingDonorId ? 'Edit Donor Profile' : 'Add New Volunteer Donor'}
                    </h3>
                    <button
                      onClick={() => setShowDonorModal(false)}
                      type="button"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    >
                      <X size={20} />
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

                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                      <button
                        type="submit"
                        disabled={savingDonor}
                        style={{
                          flex: 1,
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
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
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #d1d5db',
                      }}
                    ></textarea>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                  <button
                    type="submit"
                    disabled={savingDonation || compressingImg}
                    style={{
                      flex: 1,
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
                      gap: '14px',
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {d.image ? (
                      <img
                        src={d.image}
                        alt={d.donorName}
                        style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '10px',
                          background: '#fee2e2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#dc2626',
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={22} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                        Date: {d.date} | ID: {d.number}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.donorAddress}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleEditDonation(d)}
                        type="button"
                        className="admin-btn-action admin-btn-edit"
                        title="Edit donation record"
                      >
                        <Edit2 size={13} />
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
        {/* TAB 3: CERTIFICATES GENERATOR */}
        {/* ========================================================================= */}
        {activeTab === 'adminCertificates' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
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
                    minWidth: '150px',
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
                    minWidth: '150px',
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
            <div className="admin-card" style={{ padding: '24px' }}>
              <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '14px' }}>
                Live Certificate Preview
              </h3>

              <div
                ref={certRef}
                style={{
                  background: '#ffffff',
                  padding: '30px 24px',
                  borderRadius: '16px',
                  border: '8px double #dc2626',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <img
                    src="/uploads/logo.png"
                    alt="Logo"
                    style={{ width: '42px', height: '42px', borderRadius: '50%' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <h4 style={{ color: '#dc2626', margin: 0, fontSize: '1.4rem' }}>Chavali Blood Foundation</h4>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 14px 0' }}>
                  Serving Humanity with Every Drop
                </p>

                <div style={{ margin: '10px auto', borderBottom: '2px solid #dc2626', width: '60px' }}></div>

                <h5 style={{ fontSize: '1.2rem', color: '#0f172a', margin: '10px 0', fontWeight: 700 }}>
                  Certificate of Appreciation
                </h5>

                <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: '1.8', margin: '14px 0' }}>
                  Presented with highest gratitude to{' '}
                  <strong style={{ color: '#dc2626', fontSize: '1.15rem' }}>
                    {certDonorName || '[Donor Name]'}
                  </strong>{' '}
                  for voluntarily donating blood through Chavali Blood Foundation to help save an invaluable human life.
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    background: '#fef2f2',
                    padding: '12px',
                    borderRadius: '12px',
                    margin: '16px 0',
                    border: '1px solid #fecaca',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Blood Group</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>
                      {certBloodGroup}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Date</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{certDate}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Certificate ID</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      {certNumber || 'CBF-2026'}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginTop: '36px',
                    padding: '0 20px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #94a3b8', width: '100px', marginBottom: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>General Secretary</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #94a3b8', width: '100px', marginBottom: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>President</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: GALLERY MANAGEMENT */}
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
              }}
            >
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
                    style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '12px' }}>
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
        {/* TAB 5: CONTACT MESSAGES INBOX */}
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
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                        {msg.phone && (
                          <a href={`tel:${msg.phone}`} style={{ marginRight: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                            {msg.phone}
                          </a>
                        )}
                        {msg.email && (
                          <a href={`mailto:${msg.email}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                            {msg.email}
                          </a>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
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

                  <p style={{ marginTop: '8px', color: '#475569', fontSize: '0.92rem', lineHeight: '1.6' }}>
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
        {/* TAB 6: ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'adminAnalytics' && (
          <div className="admin-card" style={{ padding: '24px' }}>
            <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '20px' }}>
              Blood Group Distribution & Analytics
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '30px',
              }}
            >
              {VALID_BLOOD_GROUPS.map((bg) => {
                const count = stats.bloodGroupBreakdown?.[bg] || 0;
                const total = stats.totalDonors || 1;
                const percent = Math.round((count / total) * 100);

                return (
                  <div
                    key={bg}
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>{bg}</span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>{percent}%</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '8px', color: '#0f172a' }}>
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
        {/* TAB 7: SETTINGS & PASSWORD */}
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
