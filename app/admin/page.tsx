'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { compressImage, toBengali } from '@/lib/image-compress';
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

type AdminTab =
  | 'adminDonors'
  | 'adminDonations'
  | 'adminCertificates'
  | 'adminGallery'
  | 'adminMessages'
  | 'adminAnalytics'
  | 'adminSettings';

export default function AdminPage() {
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [loadingLogin, setLoadingLogin] = useState<boolean>(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<AdminTab>('adminDonors');

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
    message: 'Checking...',
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
    'Thank you for your generous blood donation. Your contribution helps save lives and makes our community healthier.'
  );
  const [certLoading, setCertLoading] = useState<boolean>(false);
  const [certSaveMsg, setCertSaveMsg] = useState<string | null>(null);
  const [savedCertId, setSavedCertId] = useState<string | number | null>(null);
  const certRef = useRef<HTMLDivElement | null>(null);

  // Password change state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [savingPwd, setSavingPwd] = useState<boolean>(false);

  // Initial session check
  useEffect(() => {
    const savedToken =
      localStorage.getItem('chavali_admin_token') || sessionStorage.getItem('chavali_admin_token');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  // Load data when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchAllData();
  }, [isLoggedIn, token]);

  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-admin-auth': 'admin',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchAllData = async () => {
    // Health
    fetch('/api/health')
      .then((res) => res.json())
      .then((d) => {
        if (d.database) setDbStatus(d.database);
      })
      .catch(() => {});

    // Stats
    fetch('/api/stats')
      .then((res) => res.json())
      .then((d) => {
        if (d.stats) setStats(d.stats);
      })
      .catch(() => {});

    // Donors
    fetch('/api/donors')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setDonors(d.data);
      })
      .catch(() => {});

    // Donations
    fetch('/api/donations')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setDonations(d.data);
      })
      .catch(() => {});

    // Gallery
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setGallery(d.data);
      })
      .catch(() => {});

    // Certificates
    fetch('/api/certificates', { headers: getHeaders() })
      .then((res) => res.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setCertificates(d.data);
      })
      .catch(() => {});

    // Messages
    fetch('/api/contact', { headers: getHeaders() })
      .then((res) => res.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setMessages(d.data);
      })
      .catch(() => {});
  };

  // ----------------------------------------------------------------------------
  // Auth Handlers
  // ----------------------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingLogin(true);
    setLoginMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        setToken(data.token);
        setIsLoggedIn(true);
        localStorage.setItem('chavali_admin_token', data.token);
      } else {
        setLoginMessage(data.message || 'ইউজারনেম বা পাসওয়ার্ড সঠিক নয়');
      }
    } catch {
      setLoginMessage('সার্ভারের সাথে যোগাযোগ করা যায়নি');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setIsLoggedIn(false);
    localStorage.removeItem('chavali_admin_token');
    sessionStorage.removeItem('chavali_admin_token');
  };

  // ----------------------------------------------------------------------------
  // Donor Handlers
  // ----------------------------------------------------------------------------
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
        setDonorFormMsg('✓ তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
        fetchAllData();
        setTimeout(() => {
          setShowDonorModal(false);
        }, 1000);
      } else {
        setDonorFormMsg(`⚠️ ${data.message || 'সংরক্ষণ ব্যর্থ হয়েছে'}`);
      }
    } catch {
      setDonorFormMsg('⚠️ নেটওয়ার্ক ত্রুটি');
    } finally {
      setSavingDonor(false);
    }
  };

  const handleDeleteDonor = async (id: string | number, name: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${name}"-কে তালিকা থেকে মুছে ফেলতে চান?`)) return;

    try {
      const res = await fetch(`/api/donors/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || 'মুছে ফেলা যায়নি');
      }
    } catch {
      alert('সার্ভার ত্রুটি');
    }
  };

  // ----------------------------------------------------------------------------
  // Donation Handlers
  // ----------------------------------------------------------------------------
  const handleDonationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressingImg(true);
    try {
      const compressedBase64 = await compressImage(file, 1200, 1200, 0.82);
      setDonationForm((prev) => ({ ...prev, image: compressedBase64 }));
    } catch (err: any) {
      alert('ছবি প্রসেসিং ত্রুটি: ' + err?.message);
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
        setDonationFormMsg('✓ রক্তদান রেকর্ড সফলভাবে সংরক্ষিত হয়েছে!');
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
        setEditingDonationId(null);
        fetchAllData();
      } else {
        setDonationFormMsg(`⚠️ ${data.message || 'সংরক্ষণ সম্ভব হয়নি'}`);
      }
    } catch {
      setDonationFormMsg('⚠️ নেটওয়ার্ক ত্রুটি');
    } finally {
      setSavingDonation(false);
    }
  };

  const handleEditDonation = (donation: Donation) => {
    setEditingDonationId(donation.id);
    setDonationForm({
      donorName: donation.donorName,
      donorPhone: donation.donorPhone,
      donorAddress: donation.donorAddress,
      number: donation.number,
      bloodGroup: donation.bloodGroup,
      date: donation.date,
      image: donation.image || null,
      notes: donation.notes || '',
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteDonation = async (id: string | number) => {
    if (!confirm('আপনি কি এই রক্তদান রেকর্ডটি মুছে ফেলতে চান?')) return;

    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || 'মুছে ফেলা যায়নি');
      }
    } catch {
      alert('সার্ভার ত্রুটি');
    }
  };

  // ----------------------------------------------------------------------------
  // Certificate Generator Handlers
  // ----------------------------------------------------------------------------
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
      alert('রক্তদাতার নাম, রক্তের গ্রুপ এবং তারিখ পূরণ করুন');
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
        setCertSaveMsg(`✓ প্রশংসাপত্র সফলভাবে সংরক্ষিত হয়েছে! ID: ${data.data.id}`);
        fetchAllData();
      } else {
        setCertSaveMsg(`⚠️ ${data.message || 'প্রশংসাপত্র সংরক্ষণ করা যায়নি'}`);
      }
    } catch {
      setCertSaveMsg('⚠️ নেটওয়ার্ক ত্রুটি');
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
      link.download = `Certificate_${certDonorName || 'Donor'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err: any) {
      alert('ডাউনলোড ত্রুটি: ' + err?.message);
    }
  };

  const handleDeleteCertificate = async (id: string | number) => {
    if (!confirm('আপনি কি এই প্রশংসাপত্র রেকর্ডটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || 'মুছে ফেলা যায়নি');
      }
    } catch {
      alert('সার্ভার ত্রুটি');
    }
  };

  // ----------------------------------------------------------------------------
  // Gallery Handlers
  // ----------------------------------------------------------------------------
  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 1200, 1200, 0.85);
      setGalleryImgData(base64);
    } catch (err: any) {
      alert('ছবি প্রসেসিং ত্রুটি: ' + err?.message);
    }
  };

  const handleSaveGallery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!galleryImgData) {
      alert('অনুগ্রহ করে একটি ছবি নির্বাচন করুন');
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
        setGalleryMsg('✓ ছবি সফলভাবে গ্যালারিতে যুক্ত হয়েছে!');
        setGalleryCaption('');
        setGalleryImgData(null);
        fetchAllData();
      } else {
        setGalleryMsg(`⚠️ ${data.message || 'ছবি আপলোড ব্যর্থ হয়েছে'}`);
      }
    } catch {
      setGalleryMsg('⚠️ নেটওয়ার্ক ত্রুটি');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteGalleryItem = async (id: string | number) => {
    if (!confirm('আপনি কি এই ছবিটি গ্যালারি থেকে মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || 'মুছে ফেলা যায়নি');
      }
    } catch {
      alert('সার্ভার ত্রুটি');
    }
  };

  // ----------------------------------------------------------------------------
  // Message Handlers
  // ----------------------------------------------------------------------------
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
    if (!confirm('আপনি কি এই বার্তাটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) fetchAllData();
    } catch {
      alert('সার্ভার ত্রুটি');
    }
  };

  // ----------------------------------------------------------------------------
  // Password Change Handler
  // ----------------------------------------------------------------------------
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg('⚠️ নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না');
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
        setPwdMsg('✓ পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!');
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPwdMsg(`⚠️ ${data.message || 'পাসওয়ার্ড পরিবর্তন করা যায়নি'}`);
      }
    } catch {
      setPwdMsg('⚠️ নেটওয়ার্ক ত্রুটি');
    } finally {
      setSavingPwd(false);
    }
  };

  // Filtered Donors
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

  // ----------------------------------------------------------------------------
  // LOGIN SCREEN
  // ----------------------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <section className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '440px', margin: '0 auto' }}>
          <div
            style={{
              background: '#ffffff',
              padding: '40px 30px',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid rgba(220, 38, 38, 0.15)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔐</div>
            <h2 style={{ color: '#DC2626', marginBottom: '6px' }}>চাঁভালি এডমিন লগইন</h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '24px' }}>
              ওয়েবসাইট ব্যবস্থাপনা ও ডেটাবেস নিয়ন্ত্রণ প্যানেল
            </p>

            {loginMessage && (
              <div
                style={{
                  padding: '12px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                ⚠️ {loginMessage}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>
                  ইউজারনেম
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    outline: 'none',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>
                  পাসওয়ার্ড
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
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      outline: 'none',
                      fontSize: '1rem',
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
                      fontSize: '0.9rem',
                      color: '#6b7280',
                    }}
                  >
                    {showPassword ? 'লুকান' : 'দেখান'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loadingLogin}
                style={{ width: '100%', padding: '14px' }}
              >
                {loadingLogin ? 'লগইন হচ্ছে...' : 'লগইন করুন 🚀'}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  // ----------------------------------------------------------------------------
  // LOGGED-IN ADMIN DASHBOARD
  // ----------------------------------------------------------------------------
  return (
    <section className="section section-alt" style={{ paddingTop: '30px', minHeight: '90vh' }}>
      <div className="container">
        {/* Top Header & DB Status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            background: '#fff',
            padding: '20px 24px',
            borderRadius: '16px',
            boxShadow: 'var(--shadow)',
            marginBottom: '24px',
          }}
        >
          <div>
            <h2 style={{ color: '#DC2626', margin: 0, fontSize: '1.6rem' }}>চাঁভালি রক্ত ফাউন্ডেশন এডমিন</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: dbStatus.connected ? '#10b981' : '#f59e0b',
                }}
              ></span>
              <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                {dbStatus.connected
                  ? `Neon PostgreSQL সংযুক্ত (${dbStatus.latencyMs}ms)`
                  : dbStatus.message}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              href="/"
              target="_blank"
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                color: '#374151',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              🌐 ওয়েবসাইট দেখুন
            </Link>
            <button
              onClick={handleLogout}
              type="button"
              style={{
                padding: '8px 16px',
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              🚪 লগআউট
            </button>
          </div>
        </div>

        {/* Stats summary cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '14px',
              boxShadow: 'var(--shadow)',
              borderLeft: '4px solid #DC2626',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>মোট রক্তদাতা</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DC2626' }}>
              {toBengali(stats.totalDonors || donors.length)}
            </div>
          </div>
          <div
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '14px',
              boxShadow: 'var(--shadow)',
              borderLeft: '4px solid #2563eb',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>মোট রক্তদান রেকর্ড</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb' }}>
              {toBengali(stats.totalDonations || donations.length)}
            </div>
          </div>
          <div
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '14px',
              boxShadow: 'var(--shadow)',
              borderLeft: '4px solid #10b981',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>প্রশংসাপত্র প্রস্তুত</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
              {toBengali(stats.totalCertificates || certificates.length)}
            </div>
          </div>
          <div
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '14px',
              boxShadow: 'var(--shadow)',
              borderLeft: '4px solid #8b5cf6',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>নতুন বার্তা</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6' }}>
              {toBengali(messages.filter((m) => !m.isRead).length)}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '10px',
            marginBottom: '20px',
          }}
        >
          {[
            { id: 'adminDonors', label: '🩸 রক্তদাতা তালিকা' },
            { id: 'adminDonations', label: '📋 রক্তদান কার্যক্রম' },
            { id: 'adminCertificates', label: '🏆 প্রশংসাপত্র জেনারেটর' },
            { id: 'adminGallery', label: '🖼️ গ্যালারি আপলোড' },
            { id: 'adminMessages', label: `✉️ বার্তা ইনবক্স (${messages.filter((m) => !m.isRead).length})` },
            { id: 'adminAnalytics', label: '📊 অ্যানালিটিক্স' },
            { id: 'adminSettings', label: '🔒 সেটিংস ও পাসওয়ার্ড' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === tab.id ? '#DC2626' : '#fff',
                color: activeTab === tab.id ? '#fff' : '#374151',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DONORS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'adminDonors' && (
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
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
              <h3 style={{ margin: 0, color: '#1f2937' }}>
                রক্তদাতা ব্যবস্থাপনা ({toBengali(filteredDonors.length)})
              </h3>
              <button
                onClick={handleOpenAddDonor}
                type="button"
                className="submit-btn"
                style={{ padding: '10px 18px', fontSize: '0.9rem' }}
              >
                + নতুন রক্তদাতা যুক্ত করুন
              </button>
            </div>

            {/* Filter and search bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="🔍 নাম, ফোন নম্বর বা এলাকা দিয়ে খুঁজুন..."
                value={donorSearch}
                onChange={(e) => setDonorSearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                }}
              />
              <select
                value={donorGroupFilter}
                onChange={(e) => setDonorGroupFilter(e.target.value)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  fontWeight: 600,
                }}
              >
                <option value="all">সকল রক্তের গ্রুপ</option>
                {VALID_BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 14px' }}>নাম</th>
                    <th style={{ padding: '12px 14px' }}>মোবাইল নম্বর</th>
                    <th style={{ padding: '12px 14px' }}>গ্রুপ</th>
                    <th style={{ padding: '12px 14px' }}>ঠিকানা</th>
                    <th style={{ padding: '12px 14px' }}>সর্বশেষ দান</th>
                    <th style={{ padding: '12px 14px' }}>স্ট্যাটাস</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonors.map((donor) => {
                    const eligibility = calculateEligibility(donor.lastDonation);
                    return (
                      <tr key={donor.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{donor.name}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <a href={`tel:${donor.mobile}`} style={{ color: '#2563eb', fontWeight: 600 }}>
                            {donor.mobile}
                          </a>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#fee2e2',
                              color: '#991b1b',
                              fontWeight: 700,
                            }}
                          >
                            {donor.bloodGroup}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#4b5563' }}>{donor.address}</td>
                        <td style={{ padding: '12px 14px', color: '#6b7280' }}>
                          {donor.lastDonation || 'তথ্য নেই'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: eligibility.isEligible ? '#dcfce7' : '#fef3c7',
                              color: eligibility.isEligible ? '#166534' : '#92400e',
                            }}
                          >
                            {eligibility.isEligible ? 'প্রস্তুত' : `${eligibility.daysUntilEligible} দিন বাকি`}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleEditDonor(donor)}
                            type="button"
                            style={{
                              marginRight: '6px',
                              padding: '4px 10px',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            সম্পাদনা
                          </button>
                          <button
                            onClick={() => handleDeleteDonor(donor.id, donor.name)}
                            type="button"
                            style={{
                              padding: '4px 10px',
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            মুছুন
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDonors.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                        কোনো রক্তদাতা পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Donor Add/Edit Modal */}
            {showDonorModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  zIndex: 2000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: '20px',
                    maxWidth: '560px',
                    width: '100%',
                    padding: '30px',
                    boxShadow: 'var(--shadow-xl)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#DC2626' }}>
                      {editingDonorId ? 'রক্তদাতার তথ্য সম্পাদনা' : 'নতুন রক্তদাতা যুক্ত করুন'}
                    </h3>
                    <button
                      onClick={() => setShowDonorModal(false)}
                      type="button"
                      style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>

                  {donorFormMsg && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: '#f3f4f6',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      {donorFormMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveDonor}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>পূর্ণ নাম *</label>
                        <input
                          type="text"
                          required
                          value={donorFormData.name}
                          onChange={(e) => setDonorFormData({ ...donorFormData, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>মোবাইল নম্বর *</label>
                        <input
                          type="tel"
                          required
                          value={donorFormData.mobile}
                          onChange={(e) => setDonorFormData({ ...donorFormData, mobile: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>রক্তের গ্রুপ *</label>
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
                        <label>শেষ রক্তদানের তারিখ</label>
                        <input
                          type="date"
                          value={donorFormData.lastDonation || ''}
                          onChange={(e) => setDonorFormData({ ...donorFormData, lastDonation: e.target.value })}
                        />
                      </div>
                      <div className="form-group full">
                        <label>ঠিকানা *</label>
                        <input
                          type="text"
                          required
                          value={donorFormData.address}
                          onChange={(e) => setDonorFormData({ ...donorFormData, address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button type="submit" className="submit-btn" disabled={savingDonor} style={{ flex: 1 }}>
                        {savingDonor ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDonorModal(false)}
                        style={{
                          padding: '10px 20px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontWeight: 600,
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
        {/* TAB 2: DONATIONS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'adminDonations' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            {/* Add Donation Form */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ color: '#DC2626', marginBottom: '16px' }}>
                {editingDonationId ? 'রক্তদান রেকর্ড সম্পাদনা' : 'নতুন রক্তদান রেকর্ড যুক্ত করুন'}
              </h3>

              {donationFormMsg && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    background: '#f3f4f6',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  {donationFormMsg}
                </div>
              )}

              <form onSubmit={handleSaveDonation}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>রক্তদাতার নাম *</label>
                    <input
                      type="text"
                      required
                      placeholder="রক্তদাতার নাম"
                      value={donationForm.donorName}
                      onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      required
                      placeholder="০১XXXXXXXXX"
                      value={donationForm.donorPhone}
                      onChange={(e) => setDonationForm({ ...donationForm, donorPhone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>রক্তের গ্রুপ *</label>
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
                    <label>রক্তদানের তারিখ *</label>
                    <input
                      type="date"
                      required
                      value={donationForm.date}
                      onChange={(e) => setDonationForm({ ...donationForm, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>ডোনেশন আইডি / সিরিয়াল নম্বর *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: CBF-2026-001"
                      value={donationForm.number}
                      onChange={(e) => setDonationForm({ ...donationForm, number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>রক্তদান কর্মকাণ্ডের ছবি (ঐচ্ছিক)</label>
                    <input type="file" accept="image/*" onChange={handleDonationImageUpload} />
                    {compressingImg && <span style={{ fontSize: '0.8rem', color: '#DC2626' }}>ছবি কমপ্রেস হচ্ছে...</span>}
                  </div>
                  <div className="form-group full">
                    <label>রক্তদাতার বর্তমান ঠিকানা *</label>
                    <input
                      type="text"
                      required
                      placeholder="গ্রাম/এলাকা, চাঁপাইনবাবগঞ্জ"
                      value={donationForm.donorAddress}
                      onChange={(e) => setDonationForm({ ...donationForm, donorAddress: e.target.value })}
                    />
                  </div>
                  <div className="form-group full">
                    <label>মন্তব্য / নোট</label>
                    <textarea
                      rows={2}
                      placeholder="যেমন: সদর হাসপাতালে জরুরি রক্তদান..."
                      value={donationForm.notes || ''}
                      onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                      }}
                    ></textarea>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button type="submit" className="submit-btn" disabled={savingDonation || compressingImg} style={{ flex: 1 }}>
                    {savingDonation ? 'সংরক্ষণ হচ্ছে...' : editingDonationId ? 'আপডেট করুন' : 'রেকর্ড সংরক্ষণ করুন 🩸'}
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
                        padding: '10px 16px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      বাতিল
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Donation Records List */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ color: '#1f2937', marginBottom: '16px' }}>
                সাম্প্রতিক রক্তদান তালিকা ({toBengali(donations.length)})
              </h3>

              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {donations.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#f9fafb',
                      marginBottom: '12px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {d.image ? (
                      <img
                        src={d.image}
                        alt={d.donorName}
                        style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '10px',
                          background: '#fee2e2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                        }}
                      >
                        🩸
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>
                        {d.donorName}{' '}
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 6px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '6px',
                          }}
                        >
                          {d.bloodGroup}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        📅 {d.date} | ID: {d.number}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>📍 {d.donorAddress}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button
                        onClick={() => handleEditDonation(d)}
                        type="button"
                        style={{
                          padding: '4px 10px',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        সম্পাদনা
                      </button>
                      <button
                        onClick={() => handleDeleteDonation(d.id)}
                        type="button"
                        style={{
                          padding: '4px 10px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        মুছুন
                      </button>
                    </div>
                  </div>
                ))}
                {donations.length === 0 && (
                  <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    এখনও কোনো রক্তদান রেকর্ড নেই।
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
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ color: '#DC2626', marginBottom: '16px' }}>প্রশংসাপত্র প্রস্তুত করুন</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  রক্তদান রেকর্ড থেকে নির্বাচন করুন (স্বয়ংক্রিয় পূরণ)
                </label>
                <select
                  onChange={(e) => handleSelectDonationForCert(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                  }}
                >
                  <option value="">-- রক্তদান রেকর্ড বেছে নিন --</option>
                  {donations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.donorName} ({d.bloodGroup}) - {d.date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>রক্তদাতার নাম *</label>
                  <input
                    type="text"
                    required
                    value={certDonorName}
                    onChange={(e) => setCertDonorName(e.target.value)}
                    placeholder="রক্তদাতার নাম"
                  />
                </div>
                <div className="form-group">
                  <label>রক্তের গ্রুপ *</label>
                  <select value={certBloodGroup} onChange={(e) => setCertBloodGroup(e.target.value)}>
                    {VALID_BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>রক্তদানের তারিখ *</label>
                  <input type="date" required value={certDate} onChange={(e) => setCertDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>সার্টিফিকেট / ডোনেশন আইডি</label>
                  <input
                    type="text"
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    placeholder="যেমন: CBF-2026-001"
                  />
                </div>
                <div className="form-group full">
                  <label>প্রশংসাপত্র বার্তা</label>
                  <textarea
                    rows={2}
                    value={certMessageText}
                    onChange={(e) => setCertMessageText(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  ></textarea>
                </div>
              </div>

              {certSaveMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    margin: '14px 0',
                    background: '#f3f4f6',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  {certSaveMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSaveCertificate}
                  className="submit-btn"
                  disabled={certLoading}
                  style={{ flex: 1, minWidth: '160px' }}
                >
                  {certLoading ? 'সংরক্ষণ হচ্ছে...' : '💾 ডেটাবেসে সংরক্ষণ করুন'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCert}
                  className="submit-btn"
                  style={{ background: '#2563eb', flex: 1, minWidth: '160px' }}
                >
                  📥 ডাউনলোড (PNG)
                </button>
              </div>

              {savedCertId && (
                <div style={{ marginTop: '14px', textAlign: 'center' }}>
                  <Link
                    href={`/certificates/${savedCertId}`}
                    target="_blank"
                    style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    🔗 পাবলিক সার্টিফিকেট পেজ ওপেন করুন →
                  </Link>
                </div>
              )}
            </div>

            {/* Right preview canvas */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ color: '#1f2937', marginBottom: '14px' }}>লাইভ সার্টিফিকেট প্রিভিউ</h3>

              <div
                ref={certRef}
                style={{
                  background: '#ffffff',
                  padding: '30px 24px',
                  borderRadius: '16px',
                  border: '8px double #DC2626',
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
                  <h4 style={{ color: '#DC2626', margin: 0, fontSize: '1.4rem' }}>চাঁভালি রক্ত ফাউন্ডেশন</h4>
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '4px 0 14px 0' }}>
                  রক্তের বন্ধনে, চাঁভালি সবখানে
                </p>

                <div style={{ margin: '10px auto', borderBottom: '2px solid #DC2626', width: '60px' }}></div>

                <h5 style={{ fontSize: '1.2rem', color: '#1f2937', margin: '10px 0', fontWeight: 700 }}>
                  স্বেচ্ছায় রক্তদান প্রশংসাপত্র
                </h5>

                <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.8', margin: '14px 0' }}>
                  পরম শ্রদ্ধার সাথে প্রত্যয়ন করা যাচ্ছে যে,{' '}
                  <strong style={{ color: '#DC2626', fontSize: '1.15rem' }}>
                    {certDonorName || 'রক্তদাতার নাম'}
                  </strong>{' '}
                  চাঁভালি রক্ত ফাউন্ডেশনের মাধ্যমে মানবসেবায় স্বেচ্ছায় রক্তদান করে একটি অমূল্য প্রাণ রক্ষায় অনন্য ভূমিকা
                  রেখেছেন।
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    background: '#fef2f2',
                    padding: '12px',
                    borderRadius: '10px',
                    margin: '16px 0',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>রক্তের গ্রুপ</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#DC2626' }}>
                      {certBloodGroup}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>তারিখ</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937' }}>{certDate}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>আইডি</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937' }}>
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
                    <div style={{ borderBottom: '1px solid #9ca3af', width: '100px', marginBottom: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>সাধারণ সম্পাদক</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #9ca3af', width: '100px', marginBottom: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>সভাপতি</span>
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
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ color: '#DC2626', marginBottom: '16px' }}>গ্যালারি ফটো আপলোড ও ব্যবস্থাপনা</h3>

            <form onSubmit={handleSaveGallery} style={{ maxWidth: '600px', marginBottom: '30px' }}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>ছবির শিরোনাম / ক্যাপশন</label>
                  <input
                    type="text"
                    placeholder="যেমন: ফ্রি ব্লাড গ্রুপিং ক্যাম্প ২০২৬"
                    value={galleryCaption}
                    onChange={(e) => setGalleryCaption(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>ক্যাটাগরি</label>
                  <select value={galleryCategory} onChange={(e) => setGalleryCategory(e.target.value)}>
                    <option value="general">ক্যাম্পেইন ও সমাবেশ (general)</option>
                    <option value="donation">রক্তদান কার্যক্রম (donation)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ছবি নির্বাচন করুন *</label>
                  <input type="file" accept="image/*" required onChange={handleGalleryImageUpload} />
                </div>
              </div>

              {galleryImgData && (
                <div style={{ margin: '14px 0' }}>
                  <img
                    src={galleryImgData}
                    alt="Preview"
                    style={{ maxWidth: '200px', borderRadius: '10px', border: '2px solid #DC2626' }}
                  />
                </div>
              )}

              {galleryMsg && (
                <div style={{ padding: '10px 14px', background: '#f3f4f6', borderRadius: '8px', margin: '14px 0' }}>
                  {galleryMsg}
                </div>
              )}

              <button
                type="submit"
                className="submit-btn"
                disabled={uploadingGallery}
                style={{ marginTop: '10px' }}
              >
                {uploadingGallery ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড করুন 📤'}
              </button>
            </form>

            <h4 style={{ color: '#1f2937', marginBottom: '14px' }}>
              বর্তমান ছবি তালিকা ({toBengali(gallery.length)})
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
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    position: 'relative',
                  }}
                >
                  <img
                    src={img.data || img.imageData}
                    alt={img.caption || 'Gallery'}
                    style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '10px' }}>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {img.caption || 'ক্যাপশন নেই'}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{img.category}</span>
                    <button
                      onClick={() => handleDeleteGalleryItem(img.id)}
                      type="button"
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '4px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      মুছুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CONTACT MESSAGES INBOX */}
        {/* ========================================================================= */}
        {activeTab === 'adminMessages' && (
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ color: '#1f2937', marginBottom: '16px' }}>
              যোগাযোগ বার্তা ইনবক্স ({toBengali(messages.length)})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    background: msg.isRead ? '#f9fafb' : '#fef2f2',
                    border: msg.isRead ? '1px solid #e5e7eb' : '1px solid #fecaca',
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
                      <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1f2937' }}>
                        {msg.name}{' '}
                        {!msg.isRead && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              background: '#DC2626',
                              color: '#fff',
                              borderRadius: '10px',
                            }}
                          >
                            নতুন
                          </span>
                        )}
                      </h4>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                        {msg.phone && (
                          <a href={`tel:${msg.phone}`} style={{ marginRight: '12px', color: '#2563eb' }}>
                            📞 {msg.phone}
                          </a>
                        )}
                        {msg.email && (
                          <a href={`mailto:${msg.email}`} style={{ color: '#2563eb' }}>
                            ✉️ {msg.email}
                          </a>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleToggleMessageRead(msg)}
                        type="button"
                        style={{
                          padding: '4px 10px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        {msg.isRead ? 'পড়া হিসেবে চিহ্নিত' : 'পড়া হয়েছে'}
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        type="button"
                        style={{
                          padding: '4px 10px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        মুছুন
                      </button>
                    </div>
                  </div>

                  {msg.subject && (
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151', marginTop: '10px' }}>
                      বিষয়: {msg.subject}
                    </div>
                  )}

                  <p style={{ marginTop: '8px', color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {msg.message}
                  </p>
                </div>
              ))}
              {messages.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>কোনো বার্তা নেই।</p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'adminAnalytics' && (
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ color: '#1f2937', marginBottom: '20px' }}>রক্তের গ্রুপ ও ডেটাবেস পরিসংখ্যান</h3>

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
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626' }}>{bg}</span>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{percent}%</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '8px', color: '#1f2937' }}>
                      {toBengali(count)} জন
                    </div>
                    <div
                      style={{
                        marginTop: '8px',
                        height: '6px',
                        background: '#fee2e2',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{ width: `${percent}%`, height: '100%', background: '#DC2626', borderRadius: '3px' }}
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
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ color: '#DC2626', marginBottom: '16px' }}>এডমিন পাসওয়ার্ড পরিবর্তন</h3>

            {pwdMsg && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  background: '#f3f4f6',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                {pwdMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ maxWidth: '440px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>
                  বর্তমান পাসওয়ার্ড *
                </label>
                <input
                  type="password"
                  required
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>
                  নতুন পাসওয়ার্ড *
                </label>
                <input
                  type="password"
                  required
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>
                  নতুন পাসওয়ার্ড নিশ্চিত করুন *
                </label>
                <input
                  type="password"
                  required
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                  }}
                />
              </div>

              <button type="submit" className="submit-btn" disabled={savingPwd}>
                {savingPwd ? 'সংরক্ষণ হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
