'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Donor, BloodGroupFilter, ALL_BLOOD_GROUP_FILTERS } from '@/lib/types';
import { calculateEligibility } from '@/lib/validators';
import { toBengali } from '@/lib/image-compress';
import { MapPin, Calendar, X, Droplet } from 'lucide-react';

function DonorsContent() {
  const searchParams = useSearchParams();
  const initialBloodGroup = (searchParams.get('bloodGroup') as BloodGroupFilter) || 'all';

  const [donors, setDonors] = useState<Donor[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<BloodGroupFilter>(initialBloodGroup);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDonors(selectedGroup, searchQuery);
  }, [selectedGroup, searchQuery]);

  const fetchDonors = async (group: string, query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (group && group !== 'all') params.append('bloodGroup', group);
      if (query.trim()) params.append('q', query.trim());

      const res = await fetch(`/api/donors?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDonors(data.data);
      } else {
        setDonors([]);
      }
    } catch (err) {
      console.error('Error fetching donors:', err);
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section section-alt" id="donors" style={{ paddingTop: '40px' }}>
      <div className="container">
        <div className="section-title">
          <h2>রক্তদাতা তালিকা</h2>
          <div className="underline"></div>
          <p>চাঁভালি রক্ত ফাউন্ডেশনের নিবন্ধিত স্বেচ্ছাসেবী রক্তদাতাদের তালিকা</p>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div style={{ maxWidth: '800px', margin: '0 auto 30px auto' }}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="নাম, এলাকা বা থানা দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 44px 14px 20px',
                fontSize: '1rem',
                borderRadius: '30px',
                border: '2px solid #e5e7eb',
                outline: 'none',
                background: '#fff',
                boxShadow: 'var(--shadow)',
                transition: 'var(--transition)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                type="button"
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="মুছে ফেলুন"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* BLOOD GROUP FILTER BUTTONS */}
          <div className="donor-filters" id="donorFilters">
            {ALL_BLOOD_GROUP_FILTERS.map((bg) => (
              <button
                key={bg}
                type="button"
                className={`filter-btn ${selectedGroup === bg ? 'active' : ''}`}
                onClick={() => setSelectedGroup(bg)}
              >
                {bg === 'all' ? 'সকল গ্রুপ' : bg}
              </button>
            ))}
          </div>
        </div>

        {/* DONOR RESULTS GRID */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '1.2rem', color: '#DC2626' }}>রক্তদাতা তালিকা লোড হচ্ছে...</p>
          </div>
        ) : donors.length > 0 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px', color: '#6b7280', fontSize: '0.95rem' }}>
              মোট <strong style={{ color: '#DC2626' }}>{toBengali(donors.length)}</strong> জন রক্তদাতার তথ্য পাওয়া গেছে
            </div>

            <div className="donor-grid" id="donorGrid">
              {donors.map((donor) => {
                const eligibility = calculateEligibility(donor.lastDonation);
                const isEligible = eligibility.isEligible;

                return (
                  <div className="donor-card" key={donor.id}>
                    <div className="donor-card-header">
                      <div>
                        <div className="donor-name">{donor.name}</div>
                      </div>
                      <span className="donor-blood">{donor.bloodGroup}</span>
                    </div>

                    <div className="donor-details">
                      <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#6b7280" />
                        <span><strong>ঠিকানা:</strong> {donor.address}</span>
                      </p>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="#6b7280" />
                        <span><strong>সর্বশেষ রক্তদান:</strong> {donor.lastDonation || 'তথ্য নেই'}</span>
                      </p>

                      {/* Eligibility Status Badge */}
                      <div style={{ marginTop: '10px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: isEligible ? '#dcfce7' : '#fef3c7',
                            color: isEligible ? '#166534' : '#92400e',
                            border: `1px solid ${isEligible ? '#bbf7d0' : '#fde68a'}`,
                          }}
                        >
                          {eligibility.statusTextBengali}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: 'var(--shadow)',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            <div style={{ display: 'inline-flex', padding: '16px', background: '#fee2e2', borderRadius: '50%', color: '#DC2626', marginBottom: '12px' }}>
              <Droplet size={36} />
            </div>
            <h3 style={{ color: '#374151', marginBottom: '8px' }}>কোনো রক্তদাতা পাওয়া যায়নি</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              {selectedGroup !== 'all'
                ? `"${selectedGroup}" গ্রুপের রক্তদাতা পাওয়া যায়নি।`
                : 'আপনার অনুসন্ধানের সাথে কোনো রক্তদাতার তথ্য মেলেনি।'}
            </p>
            <Link href="/register" className="hero-btn" style={{ display: 'inline-block' }}>
              নিজে রক্তদাতা হিসেবে নিবন্ধন করুন
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default function DonorsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <p style={{ color: '#DC2626', fontSize: '1.2rem' }}>পেজ লোড হচ্ছে...</p>
        </div>
      }
    >
      <DonorsContent />
    </Suspense>
  );
}
