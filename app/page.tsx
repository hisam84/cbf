'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toBengali } from '@/lib/image-compress';
import { Donation, StatsData, VALID_BLOOD_GROUPS } from '@/lib/types';
import BloodCompatibilityMatrix from '@/components/BloodCompatibilityMatrix';
import { Heart, Activity, Users, Phone, MapPin, Calendar, Search, X, Droplet, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [stats, setStats] = useState<StatsData>({
    totalDonors: 0,
    totalDonations: 0,
    totalCertificates: 0,
    bloodGroupBreakdown: {},
  });
  const [donations, setDonations] = useState<Donation[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch stats
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {});

    // Fetch donations for slider
    fetch('/api/donations')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setDonations(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto rotate slider
  useEffect(() => {
    if (donations.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % donations.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [donations.length]);

  const prevSlide = () => {
    if (donations.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + donations.length) % donations.length);
  };

  const nextSlide = () => {
    if (donations.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % donations.length);
  };

  return (
    <>
      {/* HERO SECTION */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="hero-badge">স্বেচ্ছায় রক্তদান, বাঁচাও প্রাণ</div>
          <h1>চাঁভালি রক্ত ফাউন্ডেশন</h1>
          <p className="hero-tagline">রক্তের বন্ধনে, চাঁভালি সবখানে</p>

          <div
            style={{
              display: 'flex',
              gap: '14px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '20px',
            }}
          >
            <Link
              href="/register"
              className="hero-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Droplet size={18} fill="currentColor" />
              রক্তদান করতে চাই
            </Link>
            <Link
              href="/donors"
              className="hero-btn"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Search size={18} />
              রক্তদাতা খুঁজুন
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">{toBengali(stats.totalDonors || 0)}</span>
              <span className="stat-label">রক্তদাতা</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{toBengali(stats.totalDonations || 0)}</span>
              <span className="stat-label">রক্তদান কার্যক্রম</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{toBengali(stats.totalCertificates || 0)}</span>
              <span className="stat-label">প্রশংসাপত্র</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">২৪/৭</span>
              <span className="stat-label">জরুরি সেবা</span>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK BLOOD SEARCH CTA */}
      <section style={{ padding: '30px 20px', background: '#DC2626', color: '#fff' }}>
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>জরুরি রক্তের প্রয়োজন?</h3>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>
              আমাদের ডেটাবেসে সকল রক্তের গ্রুপের নিবন্ধিত রক্তদাতা রয়েছে।
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href="tel:+8801757831838"
              style={{
                background: '#fff',
                color: '#DC2626',
                padding: '10px 20px',
                borderRadius: '30px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              }}
            >
              <Phone size={18} />
              ০১৭৫৭-৮৩১৮৩৮
            </a>
            <Link
              href="/donors"
              style={{
                background: 'rgba(0,0,0,0.25)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '30px',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              তালিকা দেখুন <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* QUICK BLOOD GROUP DIRECTORY */}
      <section style={{ padding: '40px 20px', background: '#ffffff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.35rem', color: '#1f2937', fontWeight: 800 }}>
              গ্রুপ অনুযায়ী রক্তদাতা খুঁজুন
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
              নিচের যে কোনো গ্রুপের বাটনে ক্লিক করে সরাসরি রক্তদাতাদের ফোন নম্বর ও ঠিকানা দেখুন
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '12px',
              maxWidth: '900px',
              margin: '0 auto',
            }}
          >
            {VALID_BLOOD_GROUPS.map((bg) => {
              const count = stats.bloodGroupBreakdown?.[bg] || 0;
              return (
                <Link
                  key={bg}
                  href={`/donors?bloodGroup=${encodeURIComponent(bg)}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 10px',
                    background: '#fef2f2',
                    border: '2px solid #fecaca',
                    borderRadius: '16px',
                    textDecoration: 'none',
                    transition: 'var(--transition)',
                    color: '#991B1B',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(220,38,38,0.2)';
                    e.currentTarget.style.borderColor = '#DC2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#fecaca';
                  }}
                >
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626' }}>{bg}</span>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                    {count > 0 ? `${toBengali(count)} জন দাতা` : 'দাতা খুঁজুন'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* BLOOD COMPATIBILITY MATRIX SECTION */}
      <section className="section section-alt" id="compatibility">
        <div className="container">
          <BloodCompatibilityMatrix />
        </div>
      </section>

      {/* RECENT DONATIONS SLIDER */}
      <section className="section" id="recentDonations">
        <div className="container">
          <div className="section-title">
            <h2>সাম্প্রতিক রক্তদান</h2>
            <div className="underline"></div>
            <p>আমাদের মানবিক রক্তদান কর্মসূচির চিত্র ও তথ্য</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <p style={{ color: '#DC2626', fontSize: '1.1rem' }}>রক্তদান তথ্য লোড হচ্ছে...</p>
            </div>
          ) : donations.length > 0 ? (
            <div className="donation-slider">
              <div
                className="slider-container"
                style={{ position: 'relative', overflow: 'hidden', minHeight: '380px' }}
              >
                {donations.map((d, index) => {
                  const isActive = index === currentSlide;
                  return (
                    <div
                      key={d.id || index}
                      className={`donation-slide ${isActive ? 'is-active' : ''}`}
                      style={{
                        display: isActive ? 'flex' : 'none',
                        opacity: isActive ? 1 : 0,
                        transition: 'opacity 0.5s ease-in-out',
                      }}
                    >
                      {d.image ? (
                        <img
                          src={d.image}
                          alt={d.donorName}
                          onClick={() => setLightboxImg(d.image || null)}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '240px',
                            background: '#fee2e2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#DC2626',
                          }}
                        >
                          <Droplet size={48} fill="currentColor" />
                        </div>
                      )}
                      <div className="donation-slide-content">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px',
                          }}
                        >
                          <span className="donor-blood">{d.bloodGroup}</span>
                          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>ID: {d.number}</span>
                        </div>
                        <div className="donation-slide-title">{d.donorName}</div>
                        <div
                          className="donation-slide-subtitle"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <MapPin size={16} />
                          <span>{d.donorAddress || 'চাঁপাইনবাবগঞ্জ'}</span>
                        </div>
                        <div
                          className="donation-slide-date"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Calendar size={16} />
                          <span>রক্তদানের তারিখ: {d.date}</span>
                        </div>
                        {d.notes && (
                          <p
                            style={{
                              marginTop: '8px',
                              fontSize: '0.9rem',
                              color: '#4b5563',
                              fontStyle: 'italic',
                            }}
                          >
                            "{d.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {donations.length > 1 && (
                <>
                  <div className="slider-indicators">
                    {donations.map((_, idx) => (
                      <span
                        key={idx}
                        className={`indicator ${idx === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(idx)}
                      ></span>
                    ))}
                  </div>
                  <button
                    className="slider-btn prev-btn"
                    onClick={prevSlide}
                    aria-label="আগের স্লাইড"
                    type="button"
                  >
                    ‹
                  </button>
                  <button
                    className="slider-btn next-btn"
                    onClick={nextSlide}
                    aria-label="পরের স্লাইড"
                    type="button"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '50px 20px',
                background: '#fff',
                borderRadius: '16px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: 0 }}>
                এখনও কোনো রক্তদান রেকর্ড যুক্ত করা হয়নি।
              </p>
            </div>
          )}
        </div>
      </section>

      {/* WHY DONATE SECTION */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-title">
            <h2>কেন রক্তদান করবেন?</h2>
            <div className="underline"></div>
            <p>এক ব্যাগ রক্ত বাঁচাতে পারে একটি অমূল্য মানবজীবন</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            <div
              style={{
                background: '#fff',
                padding: '30px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow)',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'inline-flex', padding: '16px', background: '#fee2e2', borderRadius: '50%', color: '#DC2626', marginBottom: '16px' }}>
                <Heart size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#DC2626' }}>
                জীবন রক্ষা
              </h3>
              <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>
                দুর্ঘটনা, প্রসূতি মা ও থ্যালাসেমিয়া রোগীদের জন্য জরুরি রক্ত বেঁচে থাকার একমাত্র ভরসা।
              </p>
            </div>

            <div
              style={{
                background: '#fff',
                padding: '30px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow)',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'inline-flex', padding: '16px', background: '#fee2e2', borderRadius: '50%', color: '#DC2626', marginBottom: '16px' }}>
                <Activity size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#DC2626' }}>
                স্বাস্থ্যের সুরক্ষা
              </h3>
              <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>
                নিয়মিত রক্তদানে হৃদরোগের ঝুঁকি কমে, রক্তচাপ নিয়ন্ত্রণে থাকে এবং শরীরে নতুন রক্তকণিকা তৈরি হয়।
              </p>
            </div>

            <div
              style={{
                background: '#fff',
                padding: '30px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow)',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'inline-flex', padding: '16px', background: '#fee2e2', borderRadius: '50%', color: '#DC2626', marginBottom: '16px' }}>
                <Users size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#DC2626' }}>
                মানবিক তৃপ্তি
              </h3>
              <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>
                একজন মুমূর্ষু রোগীকে রক্ত দিয়ে তার মুখে হাসি ফোটানোর আত্মিক আনন্দ আর কিছুতে নেই।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      {lightboxImg && (
        <div className="lightbox active" onClick={() => setLightboxImg(null)} role="dialog">
          <button
            className="lightbox-close"
            onClick={() => setLightboxImg(null)}
            type="button"
            aria-label="বন্ধ করুন"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={24} />
          </button>
          <img src={lightboxImg} alt="Enlarged preview" />
        </div>
      )}
    </>
  );
}
