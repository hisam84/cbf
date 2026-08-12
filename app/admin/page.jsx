'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { compressImage, toBengali } from '@/lib/image-compress';

export default function AdminPage() {
    // Auth state
    const [token, setToken] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loginMessage, setLoginMessage] = useState(null);
    const [loadingLogin, setLoadingLogin] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState('adminDonors');

    // Data states
    const [stats, setStats] = useState({ totalDonors: 0, totalDonations: 0, totalCertificates: 0 });
    const [dbStatus, setDbStatus] = useState({ connected: false, latencyMs: 0 });
    const [donors, setDonors] = useState([]);
    const [donations, setDonations] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [messages, setMessages] = useState([]);

    // Donation Form state
    const [donationForm, setDonationForm] = useState({
        donorName: '',
        donorPhone: '',
        donorAddress: '',
        number: '',
        bloodGroup: '',
        date: '',
        image: null,
        notes: ''
    });
    const [editingDonationId, setEditingDonationId] = useState(null);
    const [donationFormMsg, setDonationFormMsg] = useState(null);
    const [compressingImg, setCompressingImg] = useState(false);

    // Gallery Form state
    const [galleryCaption, setGalleryCaption] = useState('');
    const [galleryImgData, setGalleryImgData] = useState(null);
    const [galleryMsg, setGalleryMsg] = useState(null);
    const [uploadingGallery, setUploadingGallery] = useState(false);

    // Certificate Generator state
    const [selectedDonationId, setSelectedDonationId] = useState('');
    const [certMessage, setCertMessage] = useState('Thank you for your generous blood donation. Your contribution helps save lives and makes our community healthier.');
    const [generatedCert, setGeneratedCert] = useState(null);
    const [certLoading, setCertLoading] = useState(false);
    const certRef = useRef(null);

    // Password change state
    const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwdMsg, setPwdMsg] = useState(null);

    // Initial session check
    useEffect(() => {
        const savedToken = localStorage.getItem('chavali_admin_token') || sessionStorage.getItem('chavali_admin_token');
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

    const getHeaders = () => {
        const headers = { 'Content-Type': 'application/json', 'x-admin-auth': 'admin' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    };

    const fetchAllData = async () => {
        // Health
        fetch('/api/health')
            .then(res => res.json())
            .then(d => {
                if (d.database) setDbStatus(d.database);
            })
            .catch(() => {});

        // Stats
        fetch('/api/stats')
            .then(res => res.json())
            .then(d => {
                if (d.stats) setStats(d.stats);
            })
            .catch(() => {});

        // Donors
        fetch('/api/donors')
            .then(res => res.json())
            .then(d => {
                if (d.data) setDonors(d.data);
            })
            .catch(() => {});

        // Donations
        fetch('/api/donations')
            .then(res => res.json())
            .then(d => {
                if (d.data) setDonations(d.data);
            })
            .catch(() => {});

        // Gallery
        fetch('/api/gallery')
            .then(res => res.json())
            .then(d => {
                if (d.data) setGallery(d.data);
            })
            .catch(() => {});

        // Certificates
        fetch('/api/certificates')
            .then(res => res.json())
            .then(d => {
                if (d.data) setCertificates(d.data);
            })
            .catch(() => {});

        // Contact Messages
        fetch('/api/contact', { headers: getHeaders() })
            .then(res => res.json())
            .then(d => {
                if (d.data) setMessages(d.data);
            })
            .catch(() => {});
    };

    // ==================== AUTH HANDLERS ====================
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoadingLogin(true);
        setLoginMessage(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                const authToken = data.token || 'admin_token';
                setToken(authToken);
                localStorage.setItem('chavali_admin_token', authToken);
                setIsLoggedIn(true);
                setLoginForm({ username: '', password: '' });
            } else {
                setLoginMessage({ type: 'error', text: data.message || 'ইউজারনেম বা পাসওয়ার্ড সঠিক নয়' });
            }
        } catch (err) {
            setLoginMessage({ type: 'error', text: 'লগইন ব্যর্থ হয়েছে। সার্ভার সংযোগ চেক করুন।' });
        } finally {
            setLoadingLogin(false);
        }
    };

    const handleLogout = () => {
        if (confirm('আপনি কি নিশ্চিত যে লগআউট করতে চান?')) {
            setToken(null);
            setIsLoggedIn(false);
            localStorage.removeItem('chavali_admin_token');
            sessionStorage.removeItem('chavali_admin_token');
        }
    };

    // ==================== DONOR HANDLERS ====================
    const handleDeleteDonor = async (id) => {
        if (!id) return;
        if (confirm('আপনি কি নিশ্চিত যে এই রক্তদাতার তথ্য মুছে ফেলতে চান?')) {
            try {
                const res = await fetch(`/api/donors/${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    setDonors(prev => prev.filter(d => String(d.id) !== String(id)));
                    fetchAllData();
                } else {
                    alert(`রক্তদাতা মোছা সম্ভব হয়নি: ${data.message || 'Error'}`);
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    // ==================== DONATION HANDLERS ====================
    const handleImageFileChange = async (file) => {
        if (!file) return;
        setCompressingImg(true);
        try {
            const compressed = await compressImage(file, 1200, 1200, 0.85);
            setDonationForm(prev => ({ ...prev, image: compressed }));
        } catch (err) {
            alert(`ছবি প্রসেস করা সম্ভব হয়নি: ${err.message}`);
        } finally {
            setCompressingImg(false);
        }
    };

    const handleSaveDonation = async (e) => {
        e.preventDefault();
        setDonationFormMsg(null);

        try {
            const url = editingDonationId 
                ? `/api/donations/${encodeURIComponent(editingDonationId)}`
                : '/api/donations';
            const method = editingDonationId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: getHeaders(),
                body: JSON.stringify(donationForm)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setDonationFormMsg({
                    type: 'success',
                    text: editingDonationId ? 'রক্তদান রেকর্ড সফলভাবে আপডেট করা হয়েছে!' : 'রক্তদান রেকর্ড ও ছবি সফলভাবে সংরক্ষিত হয়েছে!'
                });
                setDonationForm({
                    donorName: '',
                    donorPhone: '',
                    donorAddress: '',
                    number: '',
                    bloodGroup: '',
                    date: '',
                    image: null,
                    notes: ''
                });
                setEditingDonationId(null);
                fetchAllData();
            } else {
                setDonationFormMsg({ type: 'error', text: data.message || 'সংরক্ষণ ব্যর্থ হয়েছে' });
            }
        } catch (err) {
            setDonationFormMsg({ type: 'error', text: `ত্রুটি: ${err.message}` });
        }
    };

    const handleEditDonation = (d) => {
        setDonationForm({
            donorName: d.donorName || '',
            donorPhone: d.donorPhone || '',
            donorAddress: d.donorAddress || '',
            number: d.number || '',
            bloodGroup: d.bloodGroup || '',
            date: d.date || '',
            image: d.image || null,
            notes: d.notes || ''
        });
        setEditingDonationId(d.id || d.number);
        setActiveTab('adminAddDonation');
    };

    const handleDeleteDonation = async (id) => {
        if (!id) return;
        if (confirm('আপনি কি নিশ্চিত যে এই রক্তদান রেকর্ডটি মুছে ফেলতে চান?')) {
            try {
                const res = await fetch(`/api/donations/${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    setDonations(prev => prev.filter(d => String(d.id) !== String(id) && String(d.number) !== String(id)));
                    fetchAllData();
                } else {
                    alert(`রক্তদান রেকর্ড মোছা সম্ভব হয়নি: ${data.message || 'Error'}`);
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    // ==================== GALLERY HANDLERS ====================
    const handleGalleryUpload = async (e) => {
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
                    category: 'general'
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setGalleryMsg({ type: 'success', text: 'ছবি সফলভাবে গ্যালারিতে যোগ করা হয়েছে!' });
                setGalleryCaption('');
                setGalleryImgData(null);
                fetchAllData();
            } else {
                setGalleryMsg({ type: 'error', text: data.message || 'ছবি আপলোড ব্যর্থ হয়েছে' });
            }
        } catch (err) {
            setGalleryMsg({ type: 'error', text: `ত্রুটি: ${err.message}` });
        } finally {
            setUploadingGallery(false);
        }
    };

    const handleDeleteGallery = async (id) => {
        if (!id) return;
        if (confirm('আপনি কি নিশ্চিত যে এই ছবিটি গ্যালারি থেকে মুছে ফেলতে চান?')) {
            try {
                const res = await fetch(`/api/gallery/${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    setGallery(prev => prev.filter(g => String(g.id) !== String(id)));
                    fetchAllData();
                } else {
                    alert(`ছবি মোছা সম্ভব হয়নি: ${data.message || 'Error'}`);
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    // ==================== CERTIFICATE HANDLERS ====================
    const handleGenerateCert = async (e) => {
        e.preventDefault();
        if (!selectedDonationId) {
            alert('অনুগ্রহ করে একটি রক্তদান রেকর্ড নির্বাচন করুন');
            return;
        }

        const donation = donations.find(d => String(d.id) === String(selectedDonationId) || String(d.number) === String(selectedDonationId));
        if (!donation) {
            alert('নির্বাচিত রক্তদান রেকর্ড খুঁজে পাওয়া যায়নি');
            return;
        }

        setCertLoading(true);
        try {
            const payload = {
                donationId: donation.id,
                donorName: donation.donorName,
                bloodGroup: donation.bloodGroup,
                donationDate: donation.date,
                phone: donation.donorPhone,
                address: donation.donorAddress,
                donationNumber: donation.number,
                message: certMessage
            };

            const res = await fetch('/api/certificates', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setGeneratedCert(data.data);
                fetchAllData();
            } else {
                alert(data.message || 'প্রশংসাপত্র তৈরি করা সম্ভব হয়নি');
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
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
            link.download = `Certificate_${generatedCert?.donorName || 'Blood_Donor'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            alert('ডাউনলোড ত্রুটি: ' + err.message);
        }
    };

    const handlePrintCert = () => {
        window.print();
    };

    const handleDeleteCertificate = async (id) => {
        if (!id) return;
        if (confirm('আপনি কি এই প্রশংসাপত্র রেকর্ডটি মুছে ফেলতে চান?')) {
            try {
                const res = await fetch(`/api/certificates/${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    setCertificates(prev => prev.filter(c => String(c.id) !== String(id)));
                    fetchAllData();
                } else {
                    alert(`প্রশংসাপত্র মোছা সম্ভব হয়নি: ${data.message || 'Error'}`);
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    // ==================== PASSWORD CHANGE HANDLER ====================
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwdMsg(null);

        if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            setPwdMsg({ type: 'error', text: 'নতুন পাসওয়ার্ড দুটি মেলেনি!' });
            return;
        }

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    currentPassword: pwdForm.currentPassword,
                    newPassword: pwdForm.newPassword
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setPwdMsg({ type: 'success', text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' });
                setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setPwdMsg({ type: 'error', text: data.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে' });
            }
        } catch (err) {
            setPwdMsg({ type: 'error', text: `ত্রুটি: ${err.message}` });
        }
    };

    // ==================== UNLOGGED VIEW (LOGIN SCREEN) ====================
    if (!isLoggedIn) {
        return (
            <div className="admin-login" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div className="login-container" style={{ width: '100%', maxWidth: '440px' }}>
                    <div className="login-box" style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: 'var(--shadow-xl)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <img src="/uploads/logo.png" alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '50%', marginBottom: '12px' }} />
                            <h2 style={{ color: 'var(--primary)', marginBottom: '4px', fontSize: '1.6rem' }}>এডমিন লগইন</h2>
                            <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', margin: 0 }}>চাঁভালি রক্ত ফাউন্ডেশন ড্যাশবোর্ড</p>
                        </div>

                        {loginMessage && (
                            <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', background: loginMessage.type === 'error' ? '#fee2e2' : '#dcfce7', color: loginMessage.type === 'error' ? '#991b1b' : '#166534', fontSize: '0.9rem', textAlign: 'center' }}>
                                {loginMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="form-group" style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>ইউজারনেম</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter username"
                                    value={loginForm.username}
                                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>পাসওয়ার্ড</label>
                                <div className="password-field" style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="Enter password"
                                        value={loginForm.password}
                                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label="পাসওয়ার্ড দেখুন/লুকান"
                                    >
                                        <span className="eye-icon">{showPassword ? '🙈' : '👁️'}</span>
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="submit-btn" disabled={loadingLogin} style={{ width: '100%' }}>
                                {loadingLogin ? 'লগইন হচ্ছে...' : 'লগইন করুন →'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== LOGGED IN ADMIN DASHBOARD ====================
    return (
        <div className="admin-dashboard" style={{ display: 'block', minHeight: '85vh', paddingBottom: '60px' }}>
            <div className="admin-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img src="/uploads/logo.png" alt="Logo" className="logo-image" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>চাঁভালি রক্ত ফাউন্ডেশন এডমিন</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div 
                        className="db-status-pill"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            background: dbStatus.connected ? '#f0fdf4' : '#fffbeb',
                            border: `1px solid ${dbStatus.connected ? '#bbf7d0' : '#fde68a'}`,
                            color: dbStatus.connected ? '#166534' : '#92400e',
                            fontWeight: 600
                        }}
                    >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dbStatus.connected ? '#22c55e' : '#f59e0b', display: 'inline-block' }}></span>
                        <span>Neon DB: {dbStatus.connected ? `সংযুক্ত (${dbStatus.latencyMs}ms)` : 'লোকাল মোড'}</span>
                    </div>

                    <button className="admin-logout" onClick={handleLogout}>
                        লগআউট ✕
                    </button>
                </div>
            </div>

            <div className="admin-content" style={{ maxWidth: '1280px', margin: '0 auto', padding: '30px 20px' }}>
                {/* OVERVIEW STATS */}
                <div className="admin-overview-cards" style={{ marginBottom: '30px' }}>
                    <div className="admin-stat-card stat-card-donors">
                        <div className="stat-number">{stats.totalDonors}</div>
                        <div className="stat-label">মোট রক্তদাতা</div>
                    </div>
                    <div className="admin-stat-card stat-card-donations">
                        <div className="stat-number">{stats.totalDonations}</div>
                        <div className="stat-label">রক্তদান রেকর্ড</div>
                    </div>
                    <div className="admin-stat-card stat-card-blood-types">
                        <div className="stat-number">৮</div>
                        <div className="stat-label">রক্তের গ্রুপ</div>
                    </div>
                    <div className="admin-stat-card stat-card-certificates">
                        <div className="stat-number">{stats.totalCertificates}</div>
                        <div className="stat-label">প্রশংসাপত্র</div>
                    </div>
                </div>

                {/* TABS HEADER */}
                <div className="admin-tabs">
                    <button className={`admin-tab ${activeTab === 'adminDonors' ? 'active' : ''}`} onClick={() => setActiveTab('adminDonors')}>
                        রক্তদাতা তালিকা ({donors.length})
                    </button>
                    <button className={`admin-tab ${activeTab === 'adminDonationList' ? 'active' : ''}`} onClick={() => setActiveTab('adminDonationList')}>
                        রক্তদান রেকর্ড ({donations.length})
                    </button>
                    <button className={`admin-tab ${activeTab === 'adminAddDonation' ? 'active' : ''}`} onClick={() => setActiveTab('adminAddDonation')}>
                        {editingDonationId ? '✏️ রক্তদান এডিট' : '+ নতুন রক্তদান যোগ'}
                    </button>
                    <button className={`admin-tab ${activeTab === 'adminGallery' ? 'active' : ''}`} onClick={() => setActiveTab('adminGallery')}>
                        ফটো গ্যালারি ({gallery.length})
                    </button>
                    <button className={`admin-tab ${activeTab === 'adminCertificateGenerator' ? 'active' : ''}`} onClick={() => setActiveTab('adminCertificateGenerator')}>
                        প্রশংসাপত্র তৈরি
                    </button>
                    <button className={`admin-tab ${activeTab === 'adminCertificateList' ? 'active' : ''}`} onClick={() => setActiveTab('adminCertificateList')}>
                        প্রশংসাপত্র তালিকা ({certificates.length})
                    </button>
                    <button className={`admin-tab ${activeTab === 'adminMessages' ? 'active' : ''}`} onClick={() => setActiveTab('adminMessages')}>
                        বার্তা ({messages.length})
                    </button>
                    <button className={`admin-tab ${activeTab === 'adminChangePassword' ? 'active' : ''}`} onClick={() => setActiveTab('adminChangePassword')}>
                        🔐 পাসওয়ার্ড পরিবর্তন
                    </button>
                </div>

                {/* TAB 1: DONORS TABLE */}
                {activeTab === 'adminDonors' && (
                    <div className="admin-panel active">
                        <h3>নিবন্ধিত রক্তদাতাদের তালিকা</h3>
                        <div className="table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ক্রমিক</th>
                                        <th>নাম</th>
                                        <th>মোবাইল নম্বর</th>
                                        <th>রক্তের গ্রুপ</th>
                                        <th>ঠিকানা</th>
                                        <th>সর্বশেষ রক্তদান</th>
                                        <th>অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {donors.length > 0 ? (
                                        donors.map((d, idx) => (
                                            <tr key={d.id || idx}>
                                                <td>{idx + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{d.name}</td>
                                                <td><a href={`tel:${d.mobile}`} style={{ color: '#DC2626', fontWeight: 600 }}>{d.mobile}</a></td>
                                                <td><span className="donor-blood">{d.bloodGroup || d.blood_group}</span></td>
                                                <td>{d.address}</td>
                                                <td>{d.lastDonation || d.last_donation || 'তথ্য নেই'}</td>
                                                <td>
                                                    <button className="delete-btn" onClick={() => handleDeleteDonor(d.id)}>
                                                        মুছুন
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>কোনো রক্তদাতা নিবন্ধিত নেই</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 2: DONATION RECORDS */}
                {activeTab === 'adminDonationList' && (
                    <div className="admin-panel active">
                        <h3>রক্তদান কার্যক্রম রেকর্ড তালিকা</h3>
                        <div className="table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ক্রমিক</th>
                                        <th>রক্তদাতার নাম</th>
                                        <th>মোবাইল নম্বর</th>
                                        <th>ঠিকানা</th>
                                        <th>আইডি নম্বর</th>
                                        <th>রক্তের গ্রুপ</th>
                                        <th>তারিখ</th>
                                        <th>ছবি</th>
                                        <th>মুছুন</th>
                                        <th>এডিট</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {donations.length > 0 ? (
                                        donations.map((d, idx) => (
                                            <tr key={d.id || idx}>
                                                <td>{idx + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{d.donorName || 'N/A'}</td>
                                                <td>{d.donorPhone || 'N/A'}</td>
                                                <td>{d.donorAddress || 'N/A'}</td>
                                                <td><span style={{ fontSize: '0.85rem', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>{d.number}</span></td>
                                                <td><span className="donor-blood">{d.bloodGroup}</span></td>
                                                <td>{d.date}</td>
                                                <td>
                                                    {d.image ? (
                                                        <img src={d.image} alt="Donation" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                                                    ) : (
                                                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>ছবি নেই</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button className="delete-btn" onClick={() => handleDeleteDonation(d.id || d.number)}>
                                                        মুছুন
                                                    </button>
                                                </td>
                                                <td>
                                                    <button className="edit-btn" onClick={() => handleEditDonation(d)}>
                                                        এডিট
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>কোনো রক্তদান রেকর্ড নেই</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 3: ADD/EDIT DONATION FORM */}
                {activeTab === 'adminAddDonation' && (
                    <div className="admin-panel active">
                        <h3>{editingDonationId ? 'রক্তদান রেকর্ড সম্পাদনা' : 'নতুন রক্তদান রেকর্ড যুক্ত করুন'}</h3>

                        {donationFormMsg && (
                            <div style={{ maxWidth: '600px', padding: '14px', borderRadius: '8px', marginBottom: '20px', background: donationFormMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: donationFormMsg.type === 'success' ? '#166534' : '#991b1b', fontWeight: 500 }}>
                                {donationFormMsg.text}
                            </div>
                        )}

                        <form onSubmit={handleSaveDonation} style={{ maxWidth: '600px' }}>
                            <div className="form-group">
                                <label>রক্তদাতার নাম *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="রক্তদাতার নাম লিখুন"
                                    value={donationForm.donorName}
                                    onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>ফোন নম্বর *</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="০১XXXXXXXXX"
                                    value={donationForm.donorPhone}
                                    onChange={(e) => {
                                        const phone = e.target.value;
                                        setDonationForm(prev => ({ ...prev, donorPhone: phone }));
                                        // Auto-fill from donors if phone matches
                                        const match = donors.find(dn => dn.mobile && dn.mobile.replace(/\D/g, '') === phone.replace(/\D/g, ''));
                                        if (match) {
                                            setDonationForm(prev => ({
                                                ...prev,
                                                donorName: prev.donorName || match.name || '',
                                                donorAddress: prev.donorAddress || match.address || '',
                                                bloodGroup: prev.bloodGroup || match.bloodGroup || match.blood_group || ''
                                            }));
                                        }
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label>ঠিকানা *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="রক্তদাতার ঠিকানা"
                                    value={donationForm.donorAddress}
                                    onChange={(e) => setDonationForm({ ...donationForm, donorAddress: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>রক্তদান আইডি নম্বর *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., CBF-2026-001"
                                    value={donationForm.number}
                                    onChange={(e) => setDonationForm({ ...donationForm, number: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>রক্তের গ্রুপ *</label>
                                <select
                                    required
                                    value={donationForm.bloodGroup}
                                    onChange={(e) => setDonationForm({ ...donationForm, bloodGroup: e.target.value })}
                                >
                                    <option value="">রক্তের গ্রুপ নির্বাচন করুন</option>
                                    <option value="A+">A+ (এ পজিটিভ)</option>
                                    <option value="A-">A- (এ নেগেটিভ)</option>
                                    <option value="B+">B+ (বি পজিটিভ)</option>
                                    <option value="B-">B- (বি নেগেটিভ)</option>
                                    <option value="AB+">AB+ (এবি পজিটিভ)</option>
                                    <option value="AB-">AB- (এবি নেগেটিভ)</option>
                                    <option value="O+">O+ (ও পজিটিভ)</option>
                                    <option value="O-">O- (ও নেগেটিভ)</option>
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
                                <label>রক্তদানের ছবি (ঐচ্ছিক - অটো কম্প্রেস হবে)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleImageFileChange(e.target.files[0]);
                                        }
                                    }}
                                />
                                {compressingImg && <p style={{ color: '#2563eb', fontSize: '0.85rem', marginTop: '6px' }}>⏳ ছবি কম্প্রেস করা হচ্ছে...</p>}
                                {donationForm.image && (
                                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img src={donationForm.image} alt="Preview" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
                                        <button
                                            type="button"
                                            onClick={() => setDonationForm({ ...donationForm, image: null })}
                                            style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                                        >
                                            ছবি সরান
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>নোট / মন্তব্য</label>
                                <input
                                    type="text"
                                    placeholder="যেমন: সদর হাসপাতালে জরুরি রক্তদান"
                                    value={donationForm.notes}
                                    onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                                    {editingDonationId ? 'আপডেট করুন' : 'রেকর্ড সংরক্ষণ করুন 🩸'}
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
                                                bloodGroup: '',
                                                date: '',
                                                image: null,
                                                notes: ''
                                            });
                                        }}
                                        style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        বাতিল
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB 4: GALLERY MANAGEMENT */}
                {activeTab === 'adminGallery' && (
                    <div className="admin-panel active">
                        <h3>ফটো গ্যালারি ব্যবস্থাপনা</h3>
                        
                        <div style={{ maxWidth: '600px', marginBottom: '30px', background: '#f9fafb', padding: '24px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                            <h4 style={{ marginBottom: '14px', color: '#374151' }}>নতুন ছবি আপলোড করুন</h4>

                            {galleryMsg && (
                                <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', background: galleryMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: galleryMsg.type === 'success' ? '#166534' : '#991b1b', fontSize: '0.9rem' }}>
                                    {galleryMsg.text}
                                </div>
                            )}

                            <form onSubmit={handleGalleryUpload}>
                                <div className="form-group">
                                    <label>ছবির শিরোনাম / ক্যাপশন</label>
                                    <input
                                        type="text"
                                        placeholder="যেমন: রক্তদান ক্যাম্পেইন ২০২৬"
                                        value={galleryCaption}
                                        onChange={(e) => setGalleryCaption(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>ছবি নির্বাচন করুন *</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        required
                                        onChange={async (e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const compressed = await compressImage(e.target.files[0], 1200, 1200, 0.85);
                                                setGalleryImgData(compressed);
                                            }
                                        }}
                                    />
                                    {galleryImgData && (
                                        <div style={{ marginTop: '10px' }}>
                                            <img src={galleryImgData} alt="Preview" style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className="submit-btn" disabled={uploadingGallery}>
                                    {uploadingGallery ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড করুন 📷'}
                                </button>
                            </form>
                        </div>

                        <h4>বর্তমান গ্যালারি ফটোগুলো</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginTop: '16px' }}>
                            {gallery.map((img, idx) => (
                                <div key={img.id || idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff', boxShadow: 'var(--shadow)' }}>
                                    <img src={img.data || img.image_data} alt={img.caption} style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                                    <div style={{ padding: '8px 10px' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {img.caption || 'Activity'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteGallery(img.id)}
                                        style={{ position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(220,38,38,0.9)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}
                                        title="ছবি মুছুন"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 5: CERTIFICATE GENERATOR */}
                {activeTab === 'adminCertificateGenerator' && (
                    <div className="admin-panel active">
                        <h3>রক্তদান প্রশংসাপত্র তৈরি করুন</h3>

                        <form onSubmit={handleGenerateCert} style={{ maxWidth: '600px', marginBottom: '30px' }}>
                            <div className="form-group">
                                <label>রক্তদান রেকর্ড নির্বাচন করুন *</label>
                                <select
                                    required
                                    value={selectedDonationId}
                                    onChange={(e) => setSelectedDonationId(e.target.value)}
                                >
                                    <option value="">রক্তদান রেকর্ড বেছে নিন</option>
                                    {donations.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.donorName} - {d.bloodGroup} - {d.date} (ID: {d.number})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>প্রশংসাপত্র বার্তা</label>
                                <textarea
                                    rows="3"
                                    value={certMessage}
                                    onChange={(e) => setCertMessage(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                                ></textarea>
                            </div>

                            <button type="submit" className="submit-btn" disabled={certLoading}>
                                {certLoading ? 'তৈরি হচ্ছে...' : 'প্রশংসাপত্র জেনারেট করুন 📜'}
                            </button>
                        </form>

                        {/* LIVE CERTIFICATE PREVIEW */}
                        {generatedCert && (
                            <div style={{ marginTop: '30px' }}>
                                <h4 style={{ textAlign: 'center', color: '#DC2626', marginBottom: '16px' }}>প্রশংসাপত্র প্রিভিউ</h4>
                                
                                <div 
                                    ref={certRef}
                                    style={{
                                        maxWidth: '750px',
                                        margin: '0 auto',
                                        padding: '40px',
                                        background: '#fff',
                                        border: '8px double #DC2626',
                                        borderRadius: '16px',
                                        boxShadow: 'var(--shadow-xl)',
                                        textAlign: 'center',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <img src="/uploads/logo.png" alt="Logo" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                                        <h2 style={{ color: '#DC2626', margin: 0, fontSize: '1.8rem' }}>চাঁভালি রক্ত ফাউন্ডেশন</h2>
                                    </div>
                                    <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>রক্তের বন্ধনে, চাঁভালি সবখানে</p>

                                    <div style={{ margin: '24px 0', borderBottom: '2px solid #DC2626', width: '80px', display: 'inline-block' }}></div>

                                    <h3 style={{ fontSize: '1.5rem', color: '#1f2937', fontWeight: 700, margin: '10px 0' }}>
                                        স্বেচ্ছায় রক্তদান প্রশংসাপত্র
                                    </h3>

                                    <p style={{ fontSize: '1.05rem', color: '#4b5563', lineHeight: '1.8', margin: '20px auto', maxWidth: '600px' }}>
                                        এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, <strong style={{ color: '#DC2626', fontSize: '1.25rem' }}>{generatedCert.donorName}</strong> একজন মহান ও গর্বিত রক্তদাতা হিসেবে চাঁভালি রক্ত ফাউন্ডেশনের মাধ্যমে রক্তদান করে মানবসেবায় অনন্য দৃষ্টান্ত স্থাপন করেছেন।
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'space-around', margin: '30px 0', background: '#fef2f2', padding: '16px', borderRadius: '12px' }}>
                                        <div>
                                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>রক্তের গ্রুপ</span>
                                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#DC2626' }}>{generatedCert.bloodGroup}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>রক্তদানের তারিখ</span>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>{generatedCert.donationDate}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>সার্টিফিকেট আইডি</span>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>{generatedCert.donationNumber || `CBF-${generatedCert.id}`}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '50px', padding: '0 30px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ borderBottom: '1px solid #9ca3af', width: '140px', marginBottom: '6px' }}></div>
                                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>সাধারণ সম্পাদক</span>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ borderBottom: '1px solid #9ca3af', width: '140px', marginBottom: '6px' }}></div>
                                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>সভাপতি</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '14px' }}>
                                    <button onClick={handleDownloadCert} className="submit-btn" style={{ background: '#2563eb' }}>
                                        📥 ডাউনলোড করুন (PNG)
                                    </button>
                                    <button onClick={handlePrintCert} className="submit-btn" style={{ background: '#10b981' }}>
                                        🖨️ প্রিন্ট করুন
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 6: CERTIFICATE LIST */}
                {activeTab === 'adminCertificateList' && (
                    <div className="admin-panel active">
                        <h3>জেনারেটকৃত প্রশংসাপত্রের তালিকা</h3>
                        <div className="table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ক্রমিক</th>
                                        <th>রক্তদাতার নাম</th>
                                        <th>রক্তের গ্রুপ</th>
                                        <th>রক্তদানের তারিখ</th>
                                        <th>জেনারেট তারিখ</th>
                                        <th>ভিউয়ার</th>
                                        <th>মুছুন</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {certificates.length > 0 ? (
                                        certificates.map((cert, idx) => (
                                            <tr key={cert.id || idx}>
                                                <td>{idx + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{cert.donorName}</td>
                                                <td><span className="donor-blood">{cert.bloodGroup}</span></td>
                                                <td>{cert.donationDate}</td>
                                                <td>{new Date(cert.generatedAt).toLocaleDateString()}</td>
                                                <td>
                                                    <Link 
                                                        href={`/certificates/${cert.id}`} 
                                                        target="_blank"
                                                        style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
                                                    >
                                                        ভিউ ↗
                                                    </Link>
                                                </td>
                                                <td>
                                                    <button className="delete-btn" onClick={() => handleDeleteCertificate(cert.id)}>
                                                        মুছুন
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>কোনো প্রশংসাপত্র তৈরি করা হয়নি</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 7: CONTACT MESSAGES */}
                {activeTab === 'adminMessages' && (
                    <div className="admin-panel active">
                        <h3>ওয়েবসাইট থেকে পাঠানো ব্যবহারকারীদের বার্তা</h3>
                        <div className="table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ক্রমিক</th>
                                        <th>নাম</th>
                                        <th>ফোন</th>
                                        <th>ইমেইল</th>
                                        <th>বিষয়</th>
                                        <th>বার্তা</th>
                                        <th>তারিখ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {messages.length > 0 ? (
                                        messages.map((m, idx) => (
                                            <tr key={m.id || idx}>
                                                <td>{idx + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{m.name}</td>
                                                <td><a href={`tel:${m.phone}`}>{m.phone || 'N/A'}</a></td>
                                                <td>{m.email || 'N/A'}</td>
                                                <td>{m.subject || 'সাধারণ বার্তা'}</td>
                                                <td style={{ maxWidth: '280px', whiteSpace: 'normal', fontSize: '0.85rem' }}>{m.message}</td>
                                                <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>কোনো বার্তা নেই</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 8: CHANGE PASSWORD */}
                {activeTab === 'adminChangePassword' && (
                    <div className="admin-panel active">
                        <h3>🔐 এডমিন পাসওয়ার্ড পরিবর্তন</h3>

                        {pwdMsg && (
                            <div style={{ maxWidth: '500px', padding: '12px', borderRadius: '8px', marginBottom: '20px', background: pwdMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: pwdMsg.type === 'success' ? '#166534' : '#991b1b', fontWeight: 500 }}>
                                {pwdMsg.text}
                            </div>
                        )}

                        <form onSubmit={handleChangePassword} style={{ maxWidth: '500px' }}>
                            <div className="form-group">
                                <label>বর্তমান পাসওয়ার্ড *</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                                    value={pwdForm.currentPassword}
                                    onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>নতুন পাসওয়ার্ড *</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
                                    value={pwdForm.newPassword}
                                    onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>নতুন পাসওয়ার্ড নিশ্চিত করুন *</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="নতুন পাসওয়ার্ডটি আবার লিখুন"
                                    value={pwdForm.confirmPassword}
                                    onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="submit-btn" style={{ marginTop: '10px' }}>
                                পাসওয়ার্ড পরিবর্তন করুন
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
