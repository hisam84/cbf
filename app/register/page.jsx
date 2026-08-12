'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        bloodGroup: '',
        lastDonation: '',
        address: '',
        gender: '',
        dob: ''
    });
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage(null);

        try {
            const res = await fetch('/api/donors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setIsSuccess(true);
                setStatusMessage('ধন্যবাদ! আপনার রক্তদানের তথ্য সফলভাবে সংরক্ষিত হয়েছে।');
                setFormData({
                    name: '',
                    mobile: '',
                    bloodGroup: '',
                    lastDonation: '',
                    address: '',
                    gender: '',
                    dob: ''
                });
            } else {
                setIsSuccess(false);
                setStatusMessage(data.message || 'নিবন্ধন সম্পন্ন করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
            }
        } catch (err) {
            setIsSuccess(false);
            setStatusMessage('নেটওয়ার্ক বা সার্ভার সমস্যা। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="section section-alt" id="register" style={{ paddingTop: '40px' }}>
            <div className="container">
                <div className="section-title">
                    <h2>রক্তদান করতে চাই</h2>
                    <div className="underline"></div>
                    <p>নিচের তথ্যগুলো পূরণ করে চাঁভালি রক্ত ফাউন্ডেশনের সদস্য রক্তদাতা হোন</p>
                </div>

                <div className="form-wrapper">
                    {statusMessage && (
                        <div 
                            style={{
                                padding: '16px 20px',
                                borderRadius: '12px',
                                marginBottom: '24px',
                                background: isSuccess ? '#dcfce7' : '#fee2e2',
                                color: isSuccess ? '#166534' : '#991b1b',
                                border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
                                fontWeight: 500,
                                textAlign: 'center'
                            }}
                        >
                            {isSuccess ? '✓ ' : '⚠️ '} {statusMessage}
                            {isSuccess && (
                                <div style={{ marginTop: '10px' }}>
                                    <Link href="/donors" style={{ color: '#166534', textDecoration: 'underline', fontWeight: 600 }}>
                                        রক্তদাতা তালিকায় আপনার নাম দেখুন →
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    <form id="donorForm" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="name">পূর্ণ নাম *</label>
                                <input 
                                    type="text" 
                                    id="name" 
                                    placeholder="আপনার পূর্ণ নাম" 
                                    required 
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="mobile">মোবাইল নম্বর *</label>
                                <input 
                                    type="tel" 
                                    id="mobile" 
                                    placeholder="০১XXXXXXXXX" 
                                    required 
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="bloodGroup">রক্তের গ্রুপ *</label>
                                <select 
                                    id="bloodGroup" 
                                    required
                                    value={formData.bloodGroup}
                                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
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
                                <label htmlFor="lastDonation">শেষ রক্তদানের তারিখ (যদি থাকে)</label>
                                <input 
                                    type="date" 
                                    id="lastDonation"
                                    value={formData.lastDonation}
                                    onChange={(e) => setFormData({ ...formData, lastDonation: e.target.value })}
                                />
                            </div>

                            <div className="form-group full">
                                <label htmlFor="address">বর্তমান ঠিকানা (গ্রাম/এলাকা, থানা, জেলা) *</label>
                                <input 
                                    type="text" 
                                    id="address" 
                                    placeholder="যেমন: চাঁভালি, শিবগঞ্জ, চাঁপাইনবাবগঞ্জ" 
                                    required 
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: '10px' }}>
                            {loading ? 'তথ্য সংরক্ষণ করা হচ্ছে...' : 'রক্তদান নিবন্ধন সম্পূর্ণ করুন 🩸'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
