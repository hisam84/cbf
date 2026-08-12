'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';

export default function PublicCertificatePage({ params }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const certRef = useRef(null);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/certificates/${encodeURIComponent(id)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setCertificate(data.data);
                } else {
                    setError('প্রশংসাপত্রটি খুঁজে পাওয়া যায়নি');
                }
            })
            .catch(err => {
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleDownload = async () => {
        if (!certRef.current) return;
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true });
            const link = document.createElement('a');
            link.download = `Certificate_${certificate?.donorName || 'Blood_Donor'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            alert('ডাউনলোড ত্রুটি: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh' }}>
                <p style={{ fontSize: '1.3rem', color: '#DC2626' }}>⏳ প্রশংসাপত্র লোড হচ্ছে...</p>
            </div>
        );
    }

    if (error || !certificate) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
                <h2 style={{ color: '#991B1B' }}>প্রশংসাপত্র পাওয়া যায়নি</h2>
                <p style={{ color: '#6b7280', margin: '10px 0 20px 0' }}>অনুরোধকৃত প্রশংসাপত্রটি ডেটাবেসে উপস্থিত নেই।</p>
                <Link href="/" className="hero-btn" style={{ display: 'inline-block' }}>
                    হোমপেজে ফিরে যান
                </Link>
            </div>
        );
    }

    return (
        <section className="section" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ color: '#DC2626', marginBottom: '6px' }}>রক্তদান প্রশংসাপত্র</h2>
                    <p style={{ color: '#6b7280' }}>চাঁভালি রক্ত ফাউন্ডেশন কর্তৃক প্রদত্ত অফিসিয়াল প্রশংসাপত্র</p>
                </div>

                <div 
                    ref={certRef}
                    style={{
                        maxWidth: '800px',
                        margin: '0 auto',
                        padding: '50px 40px',
                        background: '#fff',
                        border: '10px double #DC2626',
                        borderRadius: '20px',
                        boxShadow: 'var(--shadow-xl)',
                        textAlign: 'center',
                        position: 'relative'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '14px' }}>
                        <img src="/uploads/logo.png" alt="Logo" style={{ width: '56px', height: '56px', borderRadius: '50%' }} />
                        <h2 style={{ color: '#DC2626', margin: 0, fontSize: '2rem' }}>চাঁভালি রক্ত ফাউন্ডেশন</h2>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>রক্তের বন্ধনে, চাঁভালি সবখানে</p>

                    <div style={{ margin: '24px auto', borderBottom: '3px solid #DC2626', width: '100px' }}></div>

                    <h3 style={{ fontSize: '1.6rem', color: '#1f2937', fontWeight: 700, margin: '14px 0' }}>
                        স্বেচ্ছায় রক্তদান প্রশংসাপত্র
                    </h3>

                    <p style={{ fontSize: '1.1rem', color: '#4b5563', lineHeight: '1.9', margin: '24px auto', maxWidth: '640px' }}>
                        এই মর্মে পরম শ্রদ্ধার সাথে প্রত্যয়ন করা যাচ্ছে যে, <strong style={{ color: '#DC2626', fontSize: '1.35rem' }}>{certificate.donorName}</strong> চাঁভালি রক্ত ফাউন্ডেশনের মাধ্যমে মানবসেবায় স্বেচ্ছায় রক্তদান করে একটি অমূল্য প্রাণ রক্ষায় অনন্য ভূমিকা রেখেছেন।
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-around', margin: '30px 0', background: '#fef2f2', padding: '18px', borderRadius: '14px' }}>
                        <div>
                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>রক্তের গ্রুপ</span>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626' }}>{certificate.bloodGroup}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>রক্তদানের তারিখ</span>
                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937' }}>{certificate.donationDate}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>সার্টিফিকেট আইডি</span>
                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937' }}>{certificate.donationNumber || `CBF-${certificate.id}`}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px', padding: '0 40px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ borderBottom: '1px solid #9ca3af', width: '150px', marginBottom: '8px' }}></div>
                            <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>সাধারণ সম্পাদক</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ borderBottom: '1px solid #9ca3af', width: '150px', marginBottom: '8px' }}></div>
                            <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>সভাপতি</span>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <button onClick={handleDownload} className="submit-btn" style={{ background: '#2563eb' }}>
                        📥 প্রশংসাপত্র ডাউনলোড (PNG)
                    </button>
                    <button onClick={() => window.print()} className="submit-btn" style={{ background: '#10b981' }}>
                        🖨️ প্রিন্ট করুন
                    </button>
                </div>
            </div>
        </section>
    );
}
