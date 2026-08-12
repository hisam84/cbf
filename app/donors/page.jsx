'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const BLOOD_GROUPS = ['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function DonorsPage() {
    const [donors, setDonors] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDonors(selectedGroup, searchQuery);
    }, [selectedGroup, searchQuery]);

    const fetchDonors = async (group, query) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (group && group !== 'all') params.append('bloodGroup', group);
            if (query) params.append('q', query);

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
                            placeholder="🔍 নাম, এলাকা বা ফোন নম্বর দিয়ে খুঁজুন..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 20px',
                                fontSize: '1rem',
                                borderRadius: '30px',
                                border: '2px solid #e5e7eb',
                                outline: 'none',
                                background: '#fff',
                                boxShadow: 'var(--shadow)',
                                transition: 'var(--transition)'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    color: '#9ca3af'
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* BLOOD GROUP FILTER BUTTONS */}
                    <div className="donor-filters" id="donorFilters">
                        {BLOOD_GROUPS.map(bg => (
                            <button
                                key={bg}
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
                        <p style={{ fontSize: '1.2rem', color: '#DC2626' }}>⏳ রক্তদাতা তালিকা লোড হচ্ছে...</p>
                    </div>
                ) : donors.length > 0 ? (
                    <div className="donor-grid" id="donorGrid">
                        {donors.map(donor => (
                            <div className="donor-card" key={donor.id}>
                                <div className="donor-card-header">
                                    <div>
                                        <div className="donor-name">{donor.name}</div>
                                        <div className="donor-phone">
                                            📞 <a href={`tel:${donor.mobile}`}>{donor.mobile}</a>
                                        </div>
                                    </div>
                                    <span className="donor-blood">{donor.bloodGroup || donor.blood_group}</span>
                                </div>
                                <div className="donor-details">
                                    <p>📍 <strong>ঠিকানা:</strong> {donor.address}</p>
                                    <p>📅 <strong>সর্বশেষ রক্তদান:</strong> {donor.lastDonation || donor.last_donation || 'তথ্য নেই'}</p>
                                </div>
                                <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                                    <a 
                                        href={`tel:${donor.mobile}`}
                                        style={{
                                            flex: 1,
                                            textAlign: 'center',
                                            padding: '8px 12px',
                                            background: '#DC2626',
                                            color: '#fff',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        📞 সরাসরি কল করুন
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', boxShadow: 'var(--shadow)', maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🩸</div>
                        <h3 style={{ color: '#374151', marginBottom: '8px' }}>কোনো রক্তদাতা পাওয়া যায়নি</h3>
                        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                            {selectedGroup !== 'all' ? `"${selectedGroup}" গ্রুপের রক্তদাতা পাওয়া যায়নি।` : 'আপনার অনুসন্ধানের সাথে কোনো রক্তদাতার তথ্য মেলেনি।'}
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
