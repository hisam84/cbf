# 🩸 চাঁভালি রক্ত ফাউন্ডেশন (Chavali Blood Foundation)

> **"রক্তের বন্ধনে, চাঁভালি সবখানে"**  
> একটি স্বেচ্ছাসেবী রক্তদান ব্যবস্থাপনা প্ল্যাটফর্ম - **Neon PostgreSQL** ক্লাউড ব্যাকএন্ড ও Vercel Serverless আর্কিটেকচার সহ।

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)
![Database: Neon PostgreSQL](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E599.svg)
![Status: Production Ready](https://img.shields.io/badge/Status-Full%20Stack%20Ready-success.svg)

---

## 📋 Features (বৈশিষ্ট্যসমূহ)

- ⚡ **Neon PostgreSQL ক্লাউড ডেটাবেজ:** ক্লাউড ডেটা স্টোরেজ, রিলেশনাল স্কিমা, ইনডেক্স ও সিকিউর কোয়েরি।
- 🩸 **রক্তদান নিবন্ধন (Donor Registration):** অনলাইন ফর্মের মাধ্যমে দ্রুত রক্তদাতা হিসেবে নিবন্ধনের সুবিধা।
- 👥 **রক্তদাতা তালিকা ও ফিল্টারিং (Donor Directory & Search):** ব্লাড গ্রুপ (A+, A-, B+, B-, AB+, AB-, O+, O-) অনুযায়ী রক্তদাতা খোঁজার সুবিধা।
- 📜 **ডিজিটাল সার্টিফিকেট জেনারেশন (Donation Certificates):** রক্তদানের স্বীকৃতিস্বরূপ প্রিভিউ, ডাউনলোড ও প্রিন্টযোগ্য অফিসিয়াল সার্টিফিকেট।
- 🖼️ **কার্যক্রম গ্যালারি ও স্লাইডার (Gallery & Recent Donations):** সাম্প্রতিক রক্তদান ও কার্যক্রমের ছবি প্রদর্শনের ডাইনামিক স্লাইডার।
- 🔒 **নিরাপদ এডমিন প্যানেল (JWT Authentication):** `bcryptjs` পাসওয়ার্ড হ্যাশিং ও JWT টোকেন সিকিউরিটি সহ সম্পূর্ণ ম্যানেজমেন্ট প্যানেল।
- 📱 **সম্পূর্ণ রেসপনসিভ (Mobile Friendly):** মোবাইল, ট্যাবলেট ও ডেস্কটপ সব ডিভাইসে সহজে ব্যবহারযোগ্য আধুনিক ডিজাইন।

---

## ⚡ Quick Start with Neon Database (সহজ ইনস্টলেশন)

### ১. ডিপেন্ডেন্সি ইনস্টল করুন
```bash
npm install
```

### ২. `.env` ফাইলে Neon কানেকশন স্ট্রিং যুক্ত করুন
[Neon Console](https://console.neon.tech)-এ একটি প্রজেক্ট তৈরি করে কানেকশন স্ট্রিংটি কপি করে `.env` ফাইলে বসান:
```env
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_secret_jwt_key_2026
ADMIN_DEFAULT_USERNAME=admin
ADMIN_DEFAULT_PASSWORD=admin123
PORT=3000
```

### ৩. ডেটাবেজ ইনিশিয়ালাইজ ও টেস্ট করুন
```bash
# ডেটাবেজ কানেকশন টেস্ট করা
npm run db:test

# সব টেবিল ও ইনডেক্স স্বয়ংক্রিয়ভাবে তৈরি করা
npm run db:init

# প্রাথমিক স্যাম্পল রক্তদাতা রেকর্ড যোগ করা
npm run db:seed
```

### ৪. লোকাল সার্ভার চালু করুন
```bash
npm start
```
ব্রাউজারে ওপেন করুন: `http://localhost:3000`  
এডমিন প্যানেল: `http://localhost:3000/admin/`

---

## 🚀 How to Deploy on Vercel (ভার্সেলে ডেপ্লয় করার নিয়ম)

1. প্রজেক্টটি GitHub-এ পুশ করুন।
2. [Vercel](https://vercel.com/)-এ গিয়ে **Import Git Repository** করুন।
3. **Settings > Environment Variables** সেকশনে যান এবং নিচের ভ্যারিয়েবল দুটি যুক্ত করুন:
   - `DATABASE_URL` = আপনার Neon PostgreSQL কানেকশন স্ট্রিং
   - `JWT_SECRET` = একটি সুরক্ষিত র‍্যান্ডম সিক্রেট কী
4. **Deploy**-এ ক্লিক করুন! আপনার ফুল-স্ট্যাক ওয়েবসাইট লাইভ হয়ে যাবে।

---

## 📁 Project Structure (ফাইল ও ফোল্ডার পরিচিতি)

```text
├── server.js               # এক্সপ্রেস অ্যাপ্লিকেশন সার্ভার (Local Dev & Production)
├── schema.sql              # সম্পূর্ণ PostgreSQL DDL স্কিমা ও ইনডেক্স
├── NEON_SETUP.md           # বিস্তারিত বাংলা ও ইংরেজি Neon সেটআপ নির্দেশিকা
├── .env.example            # এনভায়রনমেন্ট ভ্যারিয়েবল টেমপ্লেট
├── .env                    # লোকাল কনফিগারেশন ফাইল
├── lib/
│   ├── db.js               # Neon Serverless ক্লায়েন্ট ও হেলথ চেক
│   ├── auth.js             # JWT টোকেন ও bcrypt পাসওয়ার্ড হ্যাশিং
│   └── validators.js       # মোবাইল নম্বর ফরম্যাটিং ও ভ্যালিডেশন
├── api/
│   ├── index.js            # মেইন API রাউটার ও Vercel Serverless ফাংশন
│   ├── auth.js             # এডমিন লগইন ও পাসওয়ার্ড চেঞ্জ (/api/auth)
│   ├── donors.js           # রক্তদাতা CRUD এন্ডিং পয়েন্ট (/api/donors)
│   ├── donations.js        # রক্তদান কার্যক্রম এন্ডিং পয়েন্ট (/api/donations)
│   ├── gallery.js          # ফটো গ্যালারি API (/api/gallery)
│   ├── certificates.js     # সার্টিফিকেট API (/api/certificates)
│   ├── stats.js            # রিয়েলটাইম কাউন্টার API (/api/stats)
│   ├── contact.js          # যোগাযোগ বার্তা API (/api/contact)
│   └── health.js           # ডেটাবেজ স্ট্যাটাস ও ডায়াগনস্টিকস (/api/health)
├── scripts/
│   ├── init-db.js          # স্কিমা ও টেবিল তৈরি স্ক্রিপ্ট (npm run db:init)
│   ├── seed-db.js          # স্যাম্পল ডেটা সিডিং স্ক্রিপ্ট (npm run db:seed)
│   └── test-db.js          # কানেকশন টেস্ট স্ক্রিপ্ট (npm run db:test)
├── admin/
│   ├── index.html          # এডমিন ড্যাশবোর্ড ও Neon স্ট্যাটাস ইন্ডিকেটর
│   └── certificate.html    # সার্টিফিকেট প্রিন্ট ও ভিউয়ার
├── index.html              # হোম পেজ ও সাম্প্রতিক রক্তদান স্লাইডার
├── about.html              # আমাদের সম্পর্কে
├── donors.html             # রক্তদাতা তালিকা ও ফিল্টারিং
├── register.html           # রক্তদান নিবন্ধন ফর্ম
├── gallery.html            # ফটো গ্যালারি ও লাইটবক্স
├── contact.html            # যোগাযোগ ও গুগল ম্যাপ
├── style.css               # মূল রেসপনসিভ সিএসএস
├── script.js               # ফ্রন্টএন্ড API ক্লায়েন্ট ও অফলাইন ক্যাশিং
└── vercel.json             # Vercel Serverless রাউটিং কনফিগারেশন
```

---

## 🔒 Security & Admin Access

- **ডিফল্ট ইউজারনেম:** `admin`
- **ডিফল্ট পাসওয়ার্ড:** `admin123`
- এডমিন লগইন করার পর এডমিন ড্যাশবোর্ডের **"Change Password"** ট্যাব থেকে যেকোনো সময় পাসওয়ার্ড পরিবর্তন করা যাবে।
