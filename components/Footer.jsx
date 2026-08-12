'use client';

import Link from 'next/link';


export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <Link href="/" className="logo">
                        <img 
                            src="/uploads/logo.png" 
                            alt="Chavali Blood Foundation Logo" 
                            className="logo-image"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <span>চাঁভালি রক্ত ফাউন্ডেশন</span>
                    </Link>
                    <p style={{ marginTop: '14px', lineHeight: '1.8' }}>
                        রক্তের বন্ধনে, চাঁভালি সবখানে। আমরা একটি অরাজনৈতিক ও স্বেচ্ছাসেবী রক্তদান সংগঠন, যেটি মানুষের জীবন বাঁচাতে ২৪/৭ কাজ করে যাচ্ছে।
                    </p>
                </div>

                <div className="footer-links">
                    <h4>দ্রুত লিংক</h4>
                    <Link href="/">হোম</Link>
                    <Link href="/about">আমাদের সম্পর্কে</Link>
                    <Link href="/register">রক্তদান নিবন্ধন</Link>
                    <Link href="/donors">রক্তদাতা তালিকা</Link>
                    <Link href="/gallery">গ্যালারি</Link>
                    <Link href="/contact">যোগাযোগ</Link>
                    <Link href="/admin">এডমিন লগইন</Link>
                </div>

                <div className="footer-contact">
                    <h4>যোগাযোগ ও হটলাইন</h4>
                    <p>📞 +880 1757-831838</p>
                    <p>📞 +880 1785-466153</p>
                    <p>✉️ chavalibloodfoundation@gmail.com</p>
                    <p>📍 চাঁপাইনবাবগঞ্জ সদর, চাঁপাইনবাবগঞ্জ</p>
                </div>
            </div>

            <div className="footer-bottom">
                <p style={{ fontWeight: 600 }}>রক্তের বন্ধনে, চাঁভালি সবখানে</p>
                <p style={{ marginTop: '6px', fontSize: '0.85rem' }}>
                    © {new Date().getFullYear()} Chavali Blood Foundation | সর্বস্বত্ব সংরক্ষিত
                </p>
            </div>
        </footer>
    );
}
