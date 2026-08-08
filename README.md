# 🩸 চাঁভালি রক্ত ফাউন্ডেশন (Chavali Blood Foundation)

> **"রক্তের বন্ধনে, চাঁভালি সবখানে"**  
> একটি স্বেচ্ছাসেবী রক্তদান ব্যবস্থাপনা ওয়েব প্ল্যাটফর্ম। A voluntary blood donation management web platform.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)
![Status: Production Ready](https://img.shields.io/badge/Status-Ready%20for%20Vercel-success.svg)

---

## 📋 Features (বৈশিষ্ট্যসমূহ)

- 🩸 **রক্তদান নিবন্ধন (Donor Registration):** অনলাইন ফর্মের মাধ্যমে দ্রুত রক্তদাতা হিসেবে নিবন্ধনের সুবিধা।
- 👥 **রক্তদাতা তালিকা ও ফিল্টারিং (Donor Directory & Search):** ব্লাড গ্রুপ (A+, A-, B+, B-, AB+, AB-, O+, O-) অনুযায়ী রক্তদাতা খোঁজার সুবিধা।
- 📜 **ডিজিটাল সার্টিফিকেট জেনারেশন (Donation Certificates):** রক্তদানের স্বীকৃতিস্বরূপ প্রিভিউ, ডাউনলোড ও প্রিন্টযোগ্য অফিসিয়াল সার্টিফিকেট।
- 🖼️ **কার্যক্রম গ্যালারি ও স্লাইডার (Gallery & Recent Donations):** সাম্প্রতিক রক্তদান ও কার্যক্রমের ছবি প্রদর্শনের ডাইনামিক স্লাইডার।
- 🔒 **নিরাপদ এডমিন প্যানেল (Admin Panel):** রক্তদাতা ব্যবস্থাপনা, রক্তদান রেকর্ড, ফটো গ্যালারি ও পাসওয়ার্ড পরিবর্তনের সম্পূর্ণ কন্ট্রোল।
- 📱 **সম্পূর্ণ রেসপনসিভ (Mobile Friendly):** মোবাইল, ট্যাবলেট ও ডেস্কটপ সব ডিভাইসে সহজে ব্যবহারযোগ্য আধুনিক ডিজাইন।

---

## 🚀 How to Deploy on Vercel via GitHub (গিটহাবের মাধ্যমে ভার্সেলে ডেপ্লয় করার নিয়ম)

### ধাপ ১: গিট রিপোজিটরি তৈরি ও গিটহাবে পুশ (Step 1: Push to GitHub)

যদি আপনি প্রজেক্ট ফোল্ডারে টার্মিনাল বা PowerShell ওপেন করেন, নিচের কমান্ডগুলো রান করুন:

```bash
# ১. গিট ইনিশিয়ালাইজ করুন
git init

# ২. মেইন ব্রাঞ্চ সিলেক্ট করুন
git branch -M main

# ৩. সব ফাইল গিট ট্র্যাকিংয়ে যুক্ত করুন
git add .

# ৪. প্রথম কমিট তৈরি করুন
git commit -m "Initial commit - Ready for Vercel deployment"

# ৫. আপনার গিটহাব রিপোজিটরির লিঙ্ক যুক্ত করুন (YOUR_USERNAME ও REPO_NAME পরিবর্তন করুন)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# ৬. গিটহাবে পুশ করুন
git push -u origin main
```

---

### ধাপ ২: ভার্সেলে ডেপ্লয় করা (Step 2: Connect & Deploy on Vercel)

1. [Vercel](https://vercel.com/) ওয়েবসাইটে যান এবং লগইন করুন (বা Sign Up with GitHub করুন)।
2. **"Add New..."** বাটনে ক্লিক করে **"Project"** সিলেক্ট করুন।
3. আপনার গিটহাব অ্যাকাউন্ট থেকে `YOUR_REPO_NAME` রিপোজিটরিটি সিলেক্ট করে **"Import"** এ ক্লিক করুন।
4. **Project Settings:**
   - **Framework Preset:** `Other` (Static Site / Auto-detected)
   - **Root Directory:** `./`
   - **Build & Output Settings:** ডিফল্টই থাকবে (কোনো বিল্ড কমান্ডের প্রয়োজন নেই)।
5. **"Deploy"** বাটনে ক্লিক করুন! 🚀
6. কয়েক সেকেন্ডের মধ্যেই আপনার ওয়েবসাইট লাইভ হয়ে যাবে এবং আপনি একটি লাইভ URL (যেমন: `https://your-project.vercel.app`) পেয়ে যাবেন।

> 💡 **অটোমেটিক সিআই/সিডি (Continuous Deployment):** পরবর্তীতে আপনি যখনই GitHub-এ কোনো নতুন পরিবর্তন `git push` করবেন, Vercel স্বয়ংক্রিয়ভাবে আপনার লাইভ সাইট আপডেট করে দেবে!

---

## 💻 Local Development (লোকাল কম্পিউটারে চালানোর নিয়ম)

আপনি যেকোনো পদ্ধতিতে লোকাল সার্ভারে চালাতে পারেন:

### অপশন ১: VS Code Live Server
1. VS Code-এ ফোল্ডারটি ওপেন করুন।
2. `index.html` ফাইলে রাইট-ক্লিক করে **"Open with Live Server"** সিলেক্ট করুন।

### অপশন ২: Node.js / NPX
```bash
npx serve .
```
ব্রাউজারে `http://localhost:3000` ওপেন হবে।

### অপশন ৩: Python Built-in Server
```bash
# Python 3
python -m http.server 3000
```

---

## 📁 Project Structure (ফাইল ও ফোল্ডার পরিচিতি)

```text
├── index.html              # হোম পেজ (Home Page & Recent Donations)
├── about.html              # আমাদের সম্পর্কে (About Us)
├── donors.html             # রক্তদাতা তালিকা (Donor Directory with Blood Group Filter)
├── register.html           # রক্তদান নিবন্ধন ফর্ম (Donor Registration Form)
├── gallery.html            # ফটো গ্যালারি ও লাইটবক্স (Photo Gallery)
├── contact.html            # যোগাযোগ ও গুগল ম্যাপ (Contact & Map)
├── style.css               # মূল সিএসএস ডিজাইন (Responsive Stylesheet)
├── script.js               # জাভাস্ক্রিপ্ট লজিক ও ডাটা ম্যানেজমেন্ট
├── vercel.json             # ভার্সেল ডেপ্লয়মেন্ট কনফিগারেশন (Clean URLs & Headers)
├── package.json            # প্রজেক্ট মেটাডাটা ও লোকাল ডেভ স্ক্রিপ্ট
├── .gitignore              # গিটহাব ইগনোর রুলস
│
├── admin/                  # এডমিন প্যানেল ফোল্ডার
│   ├── index.html          # এডমিন ড্যাশবোর্ড ও লগইন
│   └── certificate.html    # সার্টিফিকেট ভিউ ও প্রিন্ট পেজ
│
└── uploads/                # প্রজেক্ট এসেট ও মিডিয়া
    ├── logo.png            # ফাউন্ডেশন লোগো
    ├── Certificate.svg     # সার্টিফিকেট ব্যাকগ্রাউন্ড ভেক্টর
    └── authorized signature.png # অফিসিয়াল স্বাক্ষর
```

---

## 🔐 Default Admin Credentials (ডিফল্ট এডমিন তথ্য)

- **Admin URL:** `/admin` বা `/admin/index.html`
- **Default Username:** `admin`
- **Default Password:** `admin123`

*(এডমিন প্যানেলে লগইন করার পর সেটিংস (⚙️) আইকন থেকে সহজেই পাসওয়ার্ড পরিবর্তন করা যাবে)*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
