# 🩸 Neon PostgreSQL Database Setup Guide (চাঁভালি রক্ত ফাউন্ডেশন)

[English Guide](#english-setup-guide) | [বাংলা নির্দেশিকা](#bangla-setup-guide)

---

<a name="bangla-setup-guide"></a>
## 🇧🇩 বাংলা নির্দেশিকা (Neon ডেটাবেজ সেটআপ)

চাঁভালি রক্ত ফাউন্ডেশনের জন্য ক্লাউড **Neon PostgreSQL** ডেটাবেজ সংযুক্ত করার সহজ ধাপগুলো নিচে দেওয়া হলো:

### ধাপ ১: Neon অ্যাকাউন্টে প্রজেক্ট তৈরি
1. ব্রাউজারে [https://console.neon.tech](https://console.neon.tech) ওপেন করুন এবং সাইন ইন / সাইন আপ করুন।
2. **"New Project"** বাটনে ক্লিক করুন।
3. প্রজেক্টের নাম দিন (যেমন: `chavali-blood-foundation`), PostgreSQL ভার্সন নির্বাচন করে **"Create Project"**-এ ক্লিক করুন।

### ধাপ ২: Connection String কপি করা
1. Neon ড্যাশবোর্ড থেকে **Connection Details** বা **Connection String** অপশন দেখতে পাবেন।
2. সেখানে **Node.js** বা **Postgres** সিলেক্ট করে কানেকশন স্ট্রিংটি কপি করুন।
   - স্ট্রিংটির ফরম্যাট হবে এমন:
     ```text
     postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

### ধাপ ৩: `.env` ফাইলে ডেটাবেজ ইউআরএল যোগ করা
আপনার প্রজেক্টের `.env` ফাইলটি ওপেন করুন এবং কপি করা কানেকশন স্ট্রিংটি বসান:
```env
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=chavali_cbf_jwt_secret_key_2026_secure
ADMIN_DEFAULT_USERNAME=admin
ADMIN_DEFAULT_PASSWORD=admin123
PORT=3000
```

### ধাপ ৪: ডেটাবেজ টেবিল তৈরি ও টেস্ট করা
টার্মিনালে নিচের কমান্ডগুলো চালান:

```bash
# ১. ডেটাবেজ কানেকশন টেস্ট করা
npm run db:test

# ২. সকল টেবিল, ইনডেক্স ও অ্যাডমিন ইউজার তৈরি করা
npm run db:init

# ৩. (ঐচ্ছিক) প্রাথমিক স্যাম্পল ডেটা যোগ করা
npm run db:seed

# ৪. লোকাল সার্ভার চালু করা
npm start
```

### ধাপ ৫: Vercel-এ ডেপ্লয় করা
1. প্রজেক্টটি Vercel-এ ইমপোর্ট করুন।
2. Vercel ড্যাশবোর্ডের **Settings > Environment Variables**-এ যান।
3. `DATABASE_URL` এবং `JWT_SECRET` ভ্যারিয়েবল দুটি যুক্ত করুন।
4. **Deploy** বাটনে ক্লিক করলেই আপনার Neon ব্যাকএন্ড লাইভ হয়ে যাবে!

---

<a name="english-setup-guide"></a>
## 🇬🇧 English Setup Guide (Neon PostgreSQL)

### Step 1: Create a Project in Neon
1. Go to [https://console.neon.tech](https://console.neon.tech) and log in.
2. Click **"New Project"**, name it `chavali-blood-foundation`, and click **Create**.

### Step 2: Copy your Connection String
1. In the Neon dashboard, locate the **Connection Details** box.
2. Copy the PostgreSQL connection URI. It looks like:
   ```text
   postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Configure `.env`
Open `.env` in your project root and paste your connection string:
```env
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_secret_jwt_key
PORT=3000
```

### Step 4: Run Initial Migrations
```bash
# Test connection
npm run db:test

# Create tables & initial admin
npm run db:init

# Seed initial donor samples
npm run db:seed

# Start the full-stack server
npm start
```

### Step 5: Vercel Deployment
Add `DATABASE_URL` and `JWT_SECRET` in your **Vercel Project Settings > Environment Variables**, then deploy.
