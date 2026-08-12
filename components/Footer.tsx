'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide the public footer completely on Admin panel
  if (pathname?.startsWith('/admin')) {
    return null;
  }

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
                const target = e.currentTarget;
                target.style.display = 'none';
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
          <Link href="/members">সংগঠনের সদস্যবৃন্দ</Link>
          <Link href="/register">রক্তদান নিবন্ধন</Link>
          <Link href="/donors">রক্তদাতা তালিকা</Link>
          <Link href="/gallery">গ্যালারি</Link>
          <Link href="/contact">যোগাযোগ</Link>
          <Link href="/admin">এডমিন লগইন</Link>
        </div>

        <div className="footer-contact">
          <h4>যোগাযোগ ও হটলাইন</h4>
          <p>
            <Phone size={16} />
            <a href="tel:+8801757831838">+880 1757-831838</a>
          </p>
          <p>
            <Phone size={16} />
            <a href="tel:+8801785466153">+880 1785-466153</a>
          </p>
          <p>
            <Mail size={16} />
            <a href="mailto:chavalibloodfoundation@gmail.com">chavalibloodfoundation@gmail.com</a>
          </p>
          <p>
            <MapPin size={16} />
            <span>চাঁপাইনবাবগঞ্জ সদর, চাঁপাইনবাবগঞ্জ</span>
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p style={{ fontWeight: 600 }}>রক্তের বন্ধনে, চাঁভালি সবখানে</p>
        <p style={{ marginTop: '6px', fontSize: '0.85rem' }}>
          © {currentYear} Chavali Blood Foundation | সর্বস্বত্ব সংরক্ষিত
        </p>
        <p style={{ marginTop: '6px', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
          Developed by:{' '}
          <a
            href="https://hisam-omega.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#ffffff',
              fontWeight: 700,
              textDecoration: 'underline',
            }}
          >
            Hisam Uddin
          </a>
        </p>
      </div>
    </footer>
  );
}
