# 🔌 Kalkini Power Monitor (v2.6)
> **An IoT-Based Real-Time Remote Monitoring System** for tracking electrical grid stability, uptime, and load-shedding frequencies in Kalkini, Bangladesh.

---

## 📌 1. Project Overview (প্রজেক্ট পরিচিতি)
কালকিনি পাওয়ার মনিটর হলো একটি সম্পূর্ণ স্বয়ংক্রিয় এবং ক্লাউড-ইন্টিগ্রেটেড বিদ্যুৎ পর্যবেক্ষণ ব্যবস্থা। এটি স্থানীয় বিদ্যুৎ গ্রিডের রিয়েল-টাইম অবস্থা ট্র্যাক করে এবং সাধারণ মানুষের ব্যবহারের জন্য একটি রেসপনসিভ ড্যাশবোর্ডে ডেটা অ্যানালিটিক্স প্রদর্শন করে। ৩৩তম দিনে এসে প্রজেক্টটিকে মোবাইল ও টারমাক্সের বাধ্যবাধকতা থেকে মুক্ত করে সম্পূর্ণ "Production-Grade" উইন্ডোজ ব্যাকগ্রাউন্ড সার্ভিসের আওতায় নিয়ে আসা হয়েছে।

---

## 🏛️ 2. Enterprise Architecture & Tech Stack (প্রযুক্তিগত কাঠামো)
সিস্টেমটির নির্ভরযোগ্যতা এবং দ্রুত রেসপন্স নিশ্চিত করতে এটিকে ৪টি স্তরে (Layers) ডিজাইন করা হয়েছে:

*   **The Edge Tracker Node (ব্যাকএন্ড):** Node.js, Axios (লোকাল ব্রডব্যান্ড গেটওয়ে ট্র্যাকিং এবং হার্টবিট মনিটরিং)।
*   **Cloud Database & State Manager (ডেটাবেজ):** Firebase Realtime Database (NoSQL - WebSockets Enabled)।
*   **The Analytics Dashboard (ফ্রন্টএন্ড):** HTML5, Tailwind CSS, Chart.js (ক্লায়েন্ট-সাইড রিয়েল-টাইม ডেটা ভিজ্যুয়ালাইজেশন)।
*   **Process Infrastructure (প্রসেস ম্যানেজার):** PM2 (Windows Service Mode - 24/7 Uptime)।
*   **Project Management Tool:** JIRA Kanban (Agile Framework for Task & Bug Tracking).

---

## ⚙️ 3. System Architecture & Data Flow (ডেটা ফ্লো ডায়াগ্রাম)

```text
[Local Broadband Internet Connection]
                 │ (Power Cuts = Router Off)
                 ▼
[Windows OS / Node.js Engine (PM2 Core Tracker)]
                 │
                 ▼ (Secured Admin JSON Auth Push)
    [Firebase Realtime Database]
                 │
                 ▼ (Real-time WebSockets Live Fetch)
[Client Web Dashboard (Tailwind + Chart.js)] ───► (Displays Last 7 Days Analytics to Public)
```

---

## ⏳ 4. Development Timeline & Milestones (৩৩ দিনের ইতিহাস)

### 🔹 Phase 1: Core Automation (১ম - ১০ম দিন)
*   **পরিবেশ কনফিগারেশন:** অ্যান্ড্রয়েড টারমাক্স (Termux) এবং পিসিতে সফলভাবে Node.js রানটাইম সেটআপ।
*   **পিং মেকানিজম:** `axios.get('https://1.1.1')` ব্যবহার করে প্রতি ৩০ সেকেন্ডে লোকাল গেটওয়ের সংযোগ পরীক্ষা।
*   **ক্লাউড সিঙ্ক্রোনাইজেশন:** `firebase-admin` SDK-এর মাধ্যমে সুরক্ষিতভাবে রিয়েল-টাইম ক্লাউড ডেটাবেজ কানেক্ট করা।

### 🔹 Phase 2: Idempotency & Analytics UI (১১তম - ২০তম দিন)
*   **ডুপ্লিকেট ডেটা প্রতিরোধ (Idempotency লজিক):** নেটওয়ার্ক ড্রপের সময় ডেটাবেজে যেন একই অফলাইন/অনলাইন ডেটা বারবার না ঢোকে, সেজন্য ব্যাকএন্ডে মেমোরি স্ট্যাটাস ট্র্যাকিং (`isProcessing`, `lastStatus`) মডিউল তৈরি।
*   **রিয়েল-টাইম ড্যাশবোর্ড:** ৪টি ডাইনামিক স্ট্যাটাস কার্ড ডিজাইন (আজকের লোডশেডিং সংখ্যা, মোট অফলাইন সময়, গড় সময় এবং বিদ্যুতের স্থায়িত্ব বা Reliability Score)।
*   **গ্রাফিক্যাল রিপ্রেজেন্টেশন:** Chart.js ব্যবহার করে বিদ্যুৎ প্রবাহের ট্রেন্ড বোঝাতে `stepped: true` লাইন চার্ট যুক্ত করা।

### 🔹 Phase 3: Optimization, Bug Fixing & JIRA Migration (২১তম - ৩৩তম দিন)
*   **টাইমজোন ট্র্যাকিং ফিক্স:** আন্তর্জাতিক ব্রাউজার সাপোর্ট নিশ্চিত করার জন্য ডেট ফরম্যাটিং লজিক `en-US` (`Asia/Dhaka`) মডিউলে রূপান্তর।
*   **সাপ্তাহিক বার চার্ট ফিল্টারিং:** বার চার্টে ১১ দিনের এলোমেলো ডেটা আসার লজিক্যাল বাগ ফিক্স করে, `Object.keys().slice(-7)` মেথডের মাধ্যমে ডাইনামিক **"ঠিক শেষ ७ দিন"** লক করা।
*   **আলফানিউমেরিক সর্টিং বাগ ফিক্স:** ফায়ারবেসে ম্যানুয়াল ডেটা পুশ করার পর নোডের নামের কারণে ব্যাক-টু-ব্যাক জোড়া ভেঙে যাওয়ার বাগটি নিখুঁতভাবে দূর করা।
*   **উইন্ডোজ পিএম২ ব্যাকগ্রাউন্ড ডেপ্লয়মেন্ট:** ব্যাকএন্ড কোডটিকে পিসির উইন্ডোজ সার্ভিসে স্থানান্তর করা হয়েছে। `pm2 start` এবং `pm2 save` কমান্ডের মাধ্যমে এটি স্ক্রিন ছাড়াই ব্যাকগ্রাউন্ডে মাত্র ১০-১৫ মেগাবাইট র‍্যাম (RAM) খরচে সচল।
*   **JIRA কানবান বোর্ড ইন্টিগ্রেশন:** প্রজেক্ট ট্র্যাকিং, প্রায়োরিটি ম্যানেজমেন্ট এবং বাগ ট্র্যাকিংয়ের জন্য অফিশিয়ালি **JIRA (Scrum/Kanban)** চালু করা হয়েছে।

---

## 🛡️ 5. Non-Functional Requirements & Security (নিরাপত্তা ও অপ্টিমাইজেশন)
*   **Resource Efficiency:** পিসিতে PM2 ব্যবহারের ফলে ব্যাকগ্রাউন্ডে কোড চলাকালীন পিসির র‍্যাম বা প্রসেসরের ওপর কোনো দৃশ্যমান চাপ পড়ে না।
*   **Data Integrity:** ডেটা স্প্লিট করার পর `.trim()` মেথড ব্যবহার করায় স্ট্রিংয়ের শেষের অদৃশ্য স্পেসের কারণে চার্ট বা টেবিল ক্র্যাশ করার ঝুঁকি শতভাগ দূর করা হয়েছে।
*   **Client Performance:** ড্যাশবোর্ডে `limitToLast(100)` মেথড ব্যবহার করায় ফায়ারবেসে লক্ষাধিক ডেটা জমলেও ইউজারের ব্রাউজার কখনো স্লো হবে না।

---

## 🚀 6. Future Roadmap (To-Do List in JIRA)
- [ ] **KPM-10 (High Priority):** ১ মিনিটের কম সময়ের ক্ষণস্থায়ী বিদ্যুৎ ড্রপের ডেটা ফিল্টার করার জন্য ব্যাকএন্ডে **Debounce Logic (Threshold)** যুক্ত করা।
- [ ] **KPM-11:** বিদ্যুৎ যাওয়া-আসার সাথে সাথে ফোনে মেসেজ অ্যালার্টের জন্য **Telegram/WhatsApp API** ইন্টিগ্রেশন।
- [ ] **KPM-12:** সারা মাসে মোট কত ঘণ্টা লোডশেডিং হলো তার একটি স্বয়ংক্রিয় **Monthly Automated Report** সিস্টেম।
- [ ] **KPM-13:** ড্যাশবোর্ডটিকে আরও আকর্ষণীয় করার জন্য স্মুথ **UI CSS Animation & Transitions** যুক্ত করা।
- [ ] **KPM-14:** ভবিষ্যতে কালকিনি থানার বিভিন্ন ফিডার এলাকা আলাদা করে দেখার জন্য ফ্রন্টএন্ডে **Multi-Zone Dropdown Selector Filter** তৈরি করা।

---
Developed with ❤️ by **Md Taief Hasan**
