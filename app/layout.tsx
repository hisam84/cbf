import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';

export const metadata: Metadata = {
  title: 'চাঁভালি রক্ত ফাউন্ডেশন - রক্তের বন্ধনে, চাঁভালি সবখানে',
  description:
    'চাঁভালি রক্ত ফাউন্ডেশন একটি অরাজনৈতিক ও স্বেচ্ছাসেবী রক্তদান সংগঠন। আমাদের লক্ষ্য নিরাপদ রক্ত সংগ্রহ ও দ্রুত রক্তদাতা খুঁজে দিয়ে মানুষের জীবন বাঁচানো।',
  keywords: [
    'blood donation',
    'chavali blood foundation',
    'রক্তদান',
    'চাঁভালি',
    'chapainawabganj blood',
    'donor list',
    'voluntary blood donation',
    'চাঁপাইনবাবগঞ্জ রক্তদান',
  ],
  openGraph: {
    title: 'চাঁভালি রক্ত ফাউন্ডেশন - রক্তের বন্ধনে, চাঁভালি সবখানে',
    description: 'স্বেচ্ছায় রক্তদান করুন, জীবন বাঁচান। চাঁপাইনবাবগঞ্জ ও সারা বাংলাদেশের রক্তদাতাদের অনলাইন সেবা।',
    url: 'https://cbf-beta.vercel.app',
    siteName: 'Chavali Blood Foundation',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
