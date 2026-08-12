'use client';

import Link from 'next/link';

export default function AboutPage() {
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
                <div className="about-feature-icon">🛡️</div>
                <div className="about-feature-text">নিরাপদ রক্ত সংগ্রহ</div>
              </div>
              <div className="about-feature">
                <div className="about-feature-icon">🔍</div>
                <div className="about-feature-text">দ্রুত রক্তদাতা খোঁজা</div>
              </div>
              <div className="about-feature">
                <div className="about-feature-icon">🤝</div>
                <div className="about-feature-text">স্বেচ্ছাসেবী সংগঠন</div>
              </div>
              <div className="about-feature">
                <div className="about-feature-icon">⏰</div>
                <div className="about-feature-text">২৪/৭ জরুরি সেবা</div>
              </div>
            </div>

            <div style={{ marginTop: '35px' }}>
              <Link href="/register" className="hero-btn" style={{ display: 'inline-block' }}>
                রক্তদাতা হিসেবে যুক্ত হোন →
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
      </div>
    </section>
  );
}
