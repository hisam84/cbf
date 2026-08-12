'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Search, Users, Clock, ArrowRight, Award, Droplet } from 'lucide-react';
import { Member } from '@/lib/types';

export default function AboutPage() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setMembers(data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="section" id="about" style={{ paddingTop: '40px' }}>
      <div className="container">
        <div className="section-title">
          <h2>আমাদের সম্পর্কে</h2>
          <div className="underline"></div>
          <p>চাঁভালি রক্ত ফাউন্ডেশনের ইতিহাস, লক্ষ্য ও মানবিক কার্যক্রম</p>
        </div>

        <div className="about-content">
          <div className="about-text">
            <p>
              <strong>চাঁভালি রক্ত ফাউন্ডেশন</strong> চাঁপাইনবাবগঞ্জ জেলার একটি শীর্ষস্থানীয় স্বেচ্ছাসেবী ও অরাজনৈতিক রক্তদান সংগঠন। আমাদের মূল উদ্দেশ্য রক্তের অভাবে যেন কোনো অসহায় মানুষ মৃত্যুবরণ না করে।
            </p>
            <p>
              আমরা বিশ্বাস করি, রক্তদান মানবতার শ্রেষ্ঠ সেবাকর্ম। প্রতিটি ফোঁটা রক্ত একটি জীবন বাঁচানোর ক্ষমতা রাখে। আমাদের নিবেদিতপ্রাণ স্বেচ্ছাসেবকরা দিনরাত চব্বিশ ঘণ্টা রক্তদাতা ও মুমূর্ষু রোগীর পরিবারের মধ্যে সেতুবন্ধন হিসেবে কাজ করে আসছেন।
            </p>

            <div className="about-features" style={{ marginTop: '30px' }}>
              <div className="about-feature">
                <div className="about-feature-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={28} color="#DC2626" />
                </div>
                <div className="about-feature-text">নিরাপদ রক্ত সংগ্রহ</div>
              </div>
              <div className="about-feature">
                <div className="about-feature-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={28} color="#DC2626" />
                </div>
                <div className="about-feature-text">দ্রুত রক্তদাতা খোঁজা</div>
              </div>
              <div className="about-feature">
                <div className="about-feature-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={28} color="#DC2626" />
                </div>
                <div className="about-feature-text">স্বেচ্ছাসেবী সংগঠন</div>
              </div>
              <div className="about-feature">
                <div className="about-feature-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={28} color="#DC2626" />
                </div>
                <div className="about-feature-text">২৪/৭ জরুরি সেবা</div>
              </div>
            </div>

            <div style={{ marginTop: '35px' }}>
              <Link
                href="/register"
                className="hero-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <span>রক্তদাতা হিসেবে যুক্ত হোন</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="about-image-area">
            <div className="about-visual">
              <img
                src="/uploads/logo.png"
                alt="Chavali Blood Foundation Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid var(--primary)',
                  boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3)',
                }}
              />
            </div>
          </div>
        </div>

        {/* ACTIVITIES & HIGHLIGHTS */}
        <div
          style={{
            marginTop: '60px',
            padding: '40px 30px',
            background: '#fff',
            borderRadius: '20px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <h3
            style={{
              fontSize: '1.4rem',
              color: 'var(--primary)',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            আমাদের মূল কার্যক্রমসমূহ
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginTop: '24px',
            }}
          >
            <div
              style={{
                padding: '20px',
                background: '#fef2f2',
                borderRadius: '12px',
                borderLeft: '4px solid #DC2626',
              }}
            >
              <h4 style={{ color: '#991B1B', marginBottom: '8px' }}>জরুরি রক্ত ব্যবস্থাপনা</h4>
              <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: 0 }}>
                হাসপাতালে ভর্তি রোগীর জন্য অতি দ্রুত উপযুক্ত গ্রুপের রক্তদাতা খুঁজে দেওয়া।
              </p>
            </div>
            <div
              style={{
                padding: '20px',
                background: '#fef2f2',
                borderRadius: '12px',
                borderLeft: '4px solid #DC2626',
              }}
            >
              <h4 style={{ color: '#991B1B', marginBottom: '8px' }}>রক্তদান কর্মসূচি</h4>
              <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: 0 }}>
                বিভিন্ন সামাজিক অনুষ্ঠান ও শিক্ষাপ্রতিষ্ঠানে ফ্রি রক্তের গ্রুপ নির্ণয় ও রক্তদান ক্যাম্পেইন।
              </p>
            </div>
            <div
              style={{
                padding: '20px',
                background: '#fef2f2',
                borderRadius: '12px',
                borderLeft: '4px solid #DC2626',
              }}
            >
              <h4 style={{ color: '#991B1B', marginBottom: '8px' }}>সচেতনতা সৃষ্টি</h4>
              <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: 0 }}>
                তরুণ প্রজন্মকে রক্তদানে উদ্বুদ্ধ করতে লিফলেট বিতরণ ও মোটিভেশনাল সভা পরিচালনা।
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EXECUTIVE COMMITTEE & MEMBERS SECTION */}
        {/* ========================================================================= */}
        {members.length > 0 && (
          <div style={{ marginTop: '70px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.45rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
                  আমাদের কার্যনির্বাহী পরিষদ ও সদস্যবৃন্দ
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                  চাঁভালি রক্ত ফাউন্ডেশনের পরিচালন পরিষদ ও নিবেদিতপ্রাণ সদস্য
                </p>
              </div>

              <Link
                href="/members"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#dc2626',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                <span>সকল সদস্য দেখুন ({members.length})</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '20px',
              }}
            >
              {members.slice(0, 8).map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '24px 18px',
                    textAlign: 'center',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)',
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(220, 38, 38, 0.08)';
                    e.currentTarget.style.borderColor = '#fecaca';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                  }}
                >
                  <div style={{ position: 'relative', marginBottom: '14px' }}>
                    {m.image ? (
                      <img
                        src={m.image}
                        alt={m.name}
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '3px solid #fee2e2',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#dc2626',
                          fontSize: '1.5rem',
                          fontWeight: 800,
                        }}
                      >
                        {m.name.slice(0, 2)}
                      </div>
                    )}

                    {m.bloodGroup && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          background: '#dc2626',
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '10px',
                          border: '2px solid #ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <Droplet size={9} fill="#ffffff" />
                        <span>{m.bloodGroup}</span>
                      </div>
                    )}
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                    {m.name}
                  </h4>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: '16px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    <Award size={12} />
                    <span>{m.designation}</span>
                  </span>

                  {m.bio && (
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '8px 0 0 0', fontStyle: 'italic' }}>
                      "{m.bio}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
