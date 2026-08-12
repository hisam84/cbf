'use client';

import { useState } from 'react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState({ loading: false, success: null, message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, success: null, message: '' });

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setStatus({
                    loading: false,
                    success: true,
                    message: 'ধন্যবাদ! আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।'
                });
                setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
            } else {
                setStatus({
                    loading: false,
                    success: false,
                    message: data.message || 'বার্তা পাঠানো সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
                });
            }
        } catch (err) {
            setStatus({
                loading: false,
                success: false,
                message: 'নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
            });
        }
    };

    return (
        <section className="section section-alt" id="contact" style={{ paddingTop: '40px' }}>
            <div className="container">
                <div className="section-title">
                    <h2>যোগাযোগ</h2>
                    <div className="underline"></div>
                    <p>যে কোনো জরুরি রক্তের প্রয়োজনে বা তথ্যের জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন</p>
                </div>

                <div className="contact-grid">
                    <div className="contact-info">
                        <div className="contact-item">
                            <div className="contact-icon">📞</div>
                            <div className="contact-detail">
                                <h4>জরুরি হটলাইন নম্বর</h4>
                                <p><a href="tel:+8801757831838">+880 1757-831838</a></p>
                                <p><a href="tel:+8801785466153">+880 1785-466153</a></p>
                            </div>
                        </div>

                        <div className="contact-item">
                            <div className="contact-icon">📘</div>
                            <div className="contact-detail">
                                <h4>অফিসিয়াল ফেসবুক পেজ</h4>
                                <a href="https://www.facebook.com/cambhali.rakta.pha.undesana" target="_blank" rel="noopener noreferrer">
                                    চাঁভালি রক্ত ফাউন্ডেশন
                                </a>
                            </div>
                        </div>

                        <div className="contact-item">
                            <div className="contact-icon">📍</div>
                            <div className="contact-detail">
                                <h4>প্রধান কার্যালয়</h4>
                                <p>চাঁভালি, চাঁপাইনবাবগঞ্জ সদর, চাঁপাইনবাবগঞ্জ।</p>
                            </div>
                        </div>

                        <div className="contact-item">
                            <div className="contact-icon">✉️</div>
                            <div className="contact-detail">
                                <h4>অফিসিয়াল ইমেইল</h4>
                                <a href="mailto:chavalibloodfoundation@gmail.com">chavalibloodfoundation@gmail.com</a>
                            </div>
                        </div>
                    </div>

                    <div className="contact-map">
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d453.4926003518461!2d88.28206914654922!3d24.591239111191044!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fbb7007396781f%3A0xb5c809fbc09f3aa9!2z4Kas4Ka_4Ka24KeN4Kas4Kaw4KeL4KahIOCmruCni-CnnA!5e0!3m2!1sen!2sbd!4v1771268044906!5m2!1sen!2sbd" 
                            width="100%" 
                            height="380" 
                            style={{ border: '3px solid #DC2626', borderRadius: '16px' }} 
                            allowFullScreen="" 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Chavali Blood Foundation Location Map"
                        ></iframe>
                    </div>
                </div>

                {/* CONTACT FORM */}
                <div style={{ maxWidth: '800px', margin: '40px auto 0 auto', background: '#fff', padding: '36px', borderRadius: '20px', boxShadow: 'var(--shadow)' }}>
                    <h3 style={{ fontSize: '1.3rem', color: '#DC2626', marginBottom: '20px', textAlign: 'center' }}>
                        আমাদের বার্তা পাঠান
                    </h3>

                    {status.message && (
                        <div 
                            style={{
                                padding: '14px 18px',
                                borderRadius: '10px',
                                marginBottom: '20px',
                                background: status.success ? '#dcfce7' : '#fee2e2',
                                color: status.success ? '#166534' : '#991b1b',
                                border: `1px solid ${status.success ? '#bbf7d0' : '#fecaca'}`,
                                fontWeight: 500
                            }}
                        >
                            {status.success ? '✓ ' : '⚠️ '} {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>আপনার নাম *</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="আপনার নাম লিখুন"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>ফোন নম্বর</label>
                                <input 
                                    type="tel" 
                                    placeholder="০১XXXXXXXXX"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>ইমেইল ঠিকানা</label>
                                <input 
                                    type="email" 
                                    placeholder="yourname@gmail.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>বিষয়</label>
                                <input 
                                    type="text" 
                                    placeholder="বার্তার বিষয়"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>
                            <div className="form-group full">
                                <label>আপনার বার্তা বা জিজ্ঞাসা *</label>
                                <textarea 
                                    required 
                                    rows="4" 
                                    placeholder="আপনার বার্তা বিস্তারিত লিখুন..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '2px solid #e5e7eb',
                                        fontSize: '0.95rem'
                                    }}
                                ></textarea>
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            className="submit-btn" 
                            disabled={status.loading}
                            style={{ marginTop: '16px' }}
                        >
                            {status.loading ? 'বার্তা পাঠানো হচ্ছে...' : 'বার্তা পাঠান ✉️'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
