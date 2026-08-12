'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Member, ValidBloodGroup } from '@/lib/types';
import { Users, Droplet, Award, ShieldCheck, Heart, Search } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setMembers(data.data);
        }
      })
      .catch((err) => console.error('Error fetching members:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredMembers = members.filter((m) => {
    const matchCategory =
      activeFilter === 'all' ||
      (activeFilter === 'executive' && (m.roleType === 'executive' || !m.roleType)) ||
      (activeFilter === 'adviser' && m.roleType === 'adviser') ||
      (activeFilter === 'member' && m.roleType === 'member');

    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.designation.toLowerCase().includes(q) ||
      (m.bio && m.bio.toLowerCase().includes(q));

    return matchCategory && matchQuery;
  });

  return (
    <section className="section" style={{ paddingTop: '40px', minHeight: '80vh' }}>
      <div className="container">
        {/* Section Title */}
        <div className="section-title">
          <h2>সংগঠনের সদস্যবৃন্দ</h2>
          <div className="underline"></div>
          <p>চাঁভালি রক্ত ফাউন্ডেশনের সম্মানিত উপদেষ্টা, কার্যনির্বাহী পরিষদ ও স্বেচ্ছাসেবী সদস্যবৃন্দ</p>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px',
            background: '#ffffff',
            padding: '16px 20px',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
            border: '1px solid #f1f5f9',
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`admin-filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
            >
              সকল সদস্য ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('executive')}
              className={`admin-filter-chip ${activeFilter === 'executive' ? 'active' : ''}`}
            >
              কার্যনির্বাহী পরিষদ
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('adviser')}
              className={`admin-filter-chip ${activeFilter === 'adviser' ? 'active' : ''}`}
            >
              উপদেষ্টা পরিষদ
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('member')}
              className={`admin-filter-chip ${activeFilter === 'member' ? 'active' : ''}`}
            >
              সাধারণ সদস্য
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px', flex: '1', maxWidth: '360px' }}>
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="নাম বা পদবী দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
              style={{ background: '#f8fafc' }}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #fee2e2',
                borderTopColor: '#dc2626',
                borderRadius: '50%',
                margin: '0 auto 16px auto',
                animation: 'spin 0.8s linear infinite',
              }}
            ></div>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>সদস্যদের তথ্য লোড হচ্ছে...</p>
          </div>
        )}

        {/* Members Grid */}
        {!loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '24px',
            }}
          >
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '28px 20px 24px 20px',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 25px rgba(220, 38, 38, 0.08)';
                  e.currentTarget.style.borderColor = '#fecaca';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = '#f1f5f9';
                }}
              >
                {/* Photo Avatar */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #fee2e2',
                        boxShadow: '0 6px 14px rgba(220, 38, 38, 0.15)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#dc2626',
                        fontSize: '1.8rem',
                        fontWeight: 800,
                        border: '3px solid #ffffff',
                        boxShadow: '0 6px 14px rgba(220, 38, 38, 0.15)',
                      }}
                    >
                      {member.name.slice(0, 2)}
                    </div>
                  )}

                  {/* Blood Group Mini Badge */}
                  {member.bloodGroup && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        background: '#dc2626',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <Droplet size={10} fill="#ffffff" />
                      <span>{member.bloodGroup}</span>
                    </div>
                  )}
                </div>

                {/* Member Name */}
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: '0 0 6px 0',
                    lineHeight: 1.3,
                  }}
                >
                  {member.name}
                </h3>

                {/* Designation Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background:
                      member.roleType === 'adviser'
                        ? '#fef3c7'
                        : member.roleType === 'executive'
                        ? '#fee2e2'
                        : '#f1f5f9',
                    color:
                      member.roleType === 'adviser'
                        ? '#92400e'
                        : member.roleType === 'executive'
                        ? '#991b1b'
                        : '#334155',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    marginBottom: '10px',
                  }}
                >
                  <Award size={13} />
                  <span>{member.designation}</span>
                </div>

                {/* Bio or Note */}
                {member.bio && (
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: '#64748b',
                      margin: '6px 0 0 0',
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                    }}
                  >
                    "{member.bio}"
                  </p>
                )}

                {/* Committee Category Tag */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '12px',
                    width: '100%',
                    borderTop: '1px solid #f8fafc',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    fontWeight: 600,
                  }}
                >
                  {member.roleType === 'adviser'
                    ? 'উপদেষ্টা পরিষদ'
                    : member.roleType === 'executive'
                    ? 'কার্যনির্বাহী পরিষদ'
                    : 'সাধারণ পরিষদ সদস্য'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMembers.length === 0 && (
          <div
            style={{
              background: '#ffffff',
              padding: '50px 20px',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            }}
          >
            <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ color: '#0f172a', fontSize: '1.1rem', margin: '0 0 6px 0' }}>কোনো সদস্যের তথ্য পাওয়া যায়নি</h4>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
              সংগঠনের কার্যনির্বাহী ও সাধারণ সদস্যদের তালিকা শীঘ্রই হালনাগাদ করা হবে।
            </p>
          </div>
        )}

        {/* Join Foundation Banner */}
        <div
          style={{
            marginTop: '50px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            padding: '36px 30px',
            borderRadius: '20px',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 8px 0' }}>
            আপনিও কি চাঁভালি রক্ত ফাউন্ডেশনের সাথে যুক্ত হতে চান?
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', maxWidth: '600px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
            স্বেচ্ছাসেবী রক্তদাতা হিসেবে যুক্ত হয়ে মুমূর্ষু রোগীর পাশে দাঁড়ান এবং একটি মূল্যবান জীবন রক্ষা করতে অংশ নিন।
          </p>
          <Link
            href="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#dc2626',
              color: '#ffffff',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)',
            }}
          >
            <Heart size={16} fill="#ffffff" />
            <span>স্বেচ্ছাসেবী রক্তদাতা হিসেবে নিবন্ধন করুন</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
