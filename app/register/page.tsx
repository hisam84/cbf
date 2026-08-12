'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DonorInput } from '@/lib/types';
import { calculateEligibility } from '@/lib/validators';
import { Check, AlertCircle, Info, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState<DonorInput>({
    name: '',
    mobile: '',
    bloodGroup: '',
    lastDonation: '',
    address: '',
    gender: '',
    dob: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const eligibility = formData.lastDonation
    ? calculateEligibility(formData.lastDonation)
    : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
          dob: '',
        });
      } else {
        setIsSuccess(false);
        setStatusMessage(data.message || 'নিবন্ধন সম্পন্ন করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } catch {
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
                fontWeight: 600,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSuccess ? <Check size={20} color="#166534" /> : <AlertCircle size={20} color="#991b1b" />}
                <span>{statusMessage}</span>
              </div>
              {isSuccess && (
                <div style={{ marginTop: '6px' }}>
                  <Link
                    href="/donors"
                    style={{
                      color: '#166534',
                      textDecoration: 'underline',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>রক্তদাতা তালিকায় আপনার নাম দেখুন</span>
                    <ArrowRight size={14} />
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
                  placeholder="আপনার পূর্ণ নাম লিখুন"
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
                <label htmlFor="gender">লিঙ্গ (ঐচ্ছিক)</label>
                <select
                  id="gender"
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">লিঙ্গ নির্বাচন করুন</option>
                  <option value="পুরুষ">পুরুষ</option>
                  <option value="নারী">নারী</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="lastDonation">শেষ রক্তদানের তারিখ (যদি পূর্বে দিয়ে থাকেন)</label>
                <input
                  type="date"
                  id="lastDonation"
                  value={formData.lastDonation || ''}
                  onChange={(e) => setFormData({ ...formData, lastDonation: e.target.value })}
                />
                {eligibility && (
                  <p
                    style={{
                      fontSize: '0.85rem',
                      marginTop: '6px',
                      color: eligibility.isEligible ? '#166534' : '#b45309',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {eligibility.isEligible ? (
                      <>
                        <Check size={14} />
                        <span>আপনি রক্তদানের জন্য প্রস্তুত (৯০ দিন অতিক্রান্ত হয়েছে)</span>
                      </>
                    ) : (
                      <>
                        <Info size={14} />
                        <span>
                          শেষ রক্তদান থেকে {eligibility.daysSinceLastDonation} দিন অতিবাহিত হয়েছে। পরবর্তী উপযুক্ত
                          তারিখ: {eligibility.nextEligibleDate}
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="dob">জন্ম তারিখ (ঐচ্ছিক)</label>
                <input
                  type="date"
                  id="dob"
                  value={formData.dob || ''}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>

              <div className="form-group full">
                <label htmlFor="address">বর্তমান ঠিকানা (গ্রাম/এলাকা, ইউনিয়ন/থানা, জেলা) *</label>
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

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              style={{ marginTop: '14px', width: '100%' }}
            >
              {loading ? 'তথ্য সংরক্ষণ করা হচ্ছে...' : 'রক্তদান নিবন্ধন সম্পূর্ণ করুন'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
