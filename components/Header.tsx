'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Droplet } from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();

  // Hide the public header bar completely when inside the Admin panel
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on page navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (isAdmin) {
    return null;
  }

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`} id="header">
        <div className="header-inner">
          <Link href="/" className="logo">
            <img
              src="/uploads/logo.png"
              alt="Chavali Blood Foundation Logo"
              className="logo-image"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const next = target.nextElementSibling as HTMLElement | null;
                if (next) next.style.display = 'flex';
              }}
            />
            <span className="logo-icon" style={{ display: 'none' }}>
              <Droplet size={20} fill="#ffffff" />
            </span>
            <span>চাঁভালি রক্ত ফাউন্ডেশন</span>
          </Link>

          <nav className={`nav ${menuOpen ? 'open' : ''}`} id="mainNav">
            <Link href="/" className={pathname === '/' ? 'active' : ''}>
              হোম
            </Link>
            <Link href="/about" className={pathname === '/about' ? 'active' : ''}>
              আমাদের সম্পর্কে
            </Link>
            <Link href="/donors" className={pathname === '/donors' ? 'active' : ''}>
              রক্তদাতা তালিকা
            </Link>
            <Link href="/register" className={pathname === '/register' ? 'active' : ''}>
              রক্তদান নিবন্ধন
            </Link>
            <Link href="/gallery" className={pathname === '/gallery' ? 'active' : ''}>
              গ্যালারি
            </Link>
            <Link href="/contact" className={pathname === '/contact' ? 'active' : ''}>
              যোগাযোগ
            </Link>
            <Link
              href="/admin"
              className={`admin-link ${pathname.startsWith('/admin') ? 'active' : ''}`}
            >
              এডমিন প্যানেল
            </Link>
          </nav>

          <button
            className={`hamburger ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="মেনু খুলুন"
            type="button"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <div
        className={`mobile-overlay ${menuOpen ? 'active' : ''}`}
        onClick={() => setMenuOpen(false)}
        role="presentation"
      ></div>
    </>
  );
}
