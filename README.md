# 🔌 Kalkini Power Monitor (v2.7)
> **An IoT-Based Real-Time Remote Monitoring System** with integrated Secure Admin Control Panel for tracking electrical grid stability in Kalkini, Bangladesh.

---

## 📌 1. Project Overview (প্রজেক্ট পরিচিতি)
কালকিনি পাওয়ার মনিটর হলো একটি সম্পূর্ণ স্বয়ংক্রিয়, আইওটি এবং ক্লাউড-ইন্টিগ্রেটেড বিদ্যুৎ পর্যবেক্ষণ ব্যবস্থা। ৩৫তম দিনে এসে প্রজেক্টটিতে উইন্ডোজ ব্যাকগ্রাউন্ড সার্ভিসের পাশাপাশি একটি **পাসওয়ার্ড-প্রটেক্টেড কাস্টম অ্যাডমিন প্যানেল** এবং একটি ডাইনামিক **CSS-অ্যানিমেটেড জরুরি নোটিশ বোর্ড** সফলভাবে যুক্ত করা হয়েছে, যা বিদ্যুৎ অফিসের কর্মকর্তাদের সরাসরি ড্যাশবোর্ড নিয়ন্ত্রণের সুবিধা দেয়।

---

## 🏛️ 2. Comprehensive Technical Stack (প্রুক্তিগত কাঠামো)
সিস্টেমটির ডাটা ফ্লো এবং ব্যাকগ্রাউন্ড স্থায়িত্ব নিশ্চিত করতে ৫টি স্তরে আর্কিটেকচার ডিজাইন করা হয়েছে:

*   **The Edge Tracker Node (ব্যাকএন্ড):** Node.js, Axios (লোকাল গেটওয়ে ট্র্যাকিং এবং হার্টবিট মনিটরিং)।
*   **Cloud Database & State Manager (ডেটাবেজ):** Firebase Realtime Database (NoSQL - Secured Rules)।
*   **The Client Dashboard (ফ্রন্টএন্ড):** HTML5, Tailwind CSS, Chart.js (রিয়েল-টাইম অ্যানালিটিক্স ক্লায়েন্ট)।
*   **Notice Control Core (অ্যাডমিন প্যানেল):** HTML5, Firebase JavaScript SDK (Password-Protected Gate)।
*   **Process Infrastructure (প্রসেস ম্যানেজার):** PM2 (Windows Service Mode - 24/7 Uptime)।
*   **Project Management Tool:** JIRA Kanban & Timeline Roadmap (Agile Methodology) [২].
*   **Legal & Copyright Protection:** MIT Open-Source License.

---

## ⚙️ 3. System Architecture & Data Flow (ডেটা ফ্লো ডায়াগ্রাম)

```text
[Local Broadband Internet Connection]
                 │ (Power Cuts = Router Off)
                 ▼
[Windows OS / Node.js Engine (PM2 Core Tracker)]
                 │
                 ▼ (Secured Admin JSON Auth Push)
    [Firebase Realtime Database] <─── [Secure Admin Control Panel (admin.html)]
                 │
                 ▼ (Real-time WebSockets Live Fetch)
[Client Web Dashboard (Tailwind + Chart.js)] ───► (Displays Last 7 Days Analytics + Live Notices)
```

---

## ⏳ 4. Development Timeline & Milestones (৩৫ দিনের ইতিহাস)

### 🔹 Phase 1: Core Automation (১ম - ১০ম দিন)
*   **পরিবেশ কনফিগারেশন:** অ্যান্ড্রয়েড টারমাক্স (Termux) এবং পিসিতে সফলভাবে Node.js রানটাইম সেটআপ [১]।
*   **পিং মেকানিজম:** `axios.get('https://1.1.1')` ব্যবহার করে প্রতি ৩০ সেকেন্ডে লোকাল গেটওয়ের সংযোগ পরীক্ষা।

### 🔹 Phase 2: Idempotency & UI Dashboard (১১তম - ২০তম দিন)
*   **ডুপ্লিকেট ডেটা প্রতিরোধ (Idempotency লজিক):** নেটওয়ার্ক ড্রপের সময় ডেটাবেজে যেন একই অফলাইন/অনলাইন ডেটা বারবার না ঢোকে, সেজন্য ব্যাকএন্ডে মেমোরি স্ট্যাটাস ট্র্যাকিং লজিক তৈরি।
*   **রিয়েল-টাইম ড্যাশবোর্ড:** ৪টি ডাইনামিক স্ট্যাটাস কার্ড ডিজাইন (আজকের লোডশেডিং সংখ্যা, মোট অফলাইন সময়, গড় সময় এবং বিদ্যুতের স্থায়িত্ব বা Reliability Score)।

### 🔹 Phase 3: Analytics Optimization & PC-PM2 Migration (২১তম - ৩৩তম দিন)
*   **সাপ্তাহিক বার চার্ট ফিল্টারিং:** বার চার্টে ১১ দিনের এলোমেলো ডেটা আসার লজিক্যাল বাগ ফিক্স করে, `Object.keys().slice(-7)` মেথডের মাধ্যমে ডাইনামিক **"ঠিক শেষ ७ দিন"** লক করা।
*   **উইন্ডোজ পিএম২ ব্যাকগ্রাউন্ড ডেপ্লয়মেন্ট:** ব্যাকএন্ড কোডটিকে পিসির উইন্ডোজ সার্ভিসে স্থানান্তর করে স্ক্রিন ছাড়াই ব্যাকগ্রাউন্ডে মাত্র ১০-১৫ মেগাবাইট র‍্যাম (RAM) খরচে সচল করার ব্যবস্থা সম্পন্ন।
*   **JIRA কানবান বোর্ড ইন্টিগ্রেশন:** প্রজেক্ট ট্র্যাকিং, প্রায়োরিটি ম্যানেজমেন্ট এবং বাগ ট্র্যাকিংয়ের জন্য অফিশিয়ালি **JIRA (Scrum/Kanban)** চালু করা হয়েছে [২]।

### 🔹 Phase 4: Security Hardening & Admin Notice Board (৩৪তম - ৩৫তম দিন)
*   **MIT License Integration:** সোর্স কোড পাবলিক করার সাথে সাথে আন্তর্জাতিক আইনি সুরক্ষা নিশ্চিত করতে গিটহাবে অফিশিয়াল `MIT License` যুক্তকরণ।
*   **Custom Admin Panel (`admin.html`):** বিদ্যুৎ অফিসের জন্য একটি সিকিউর, পাসওয়ার্ড-প্রটেক্টেড কন্ট্রোল প্যানেল তৈরি যা সরাসরি ফায়ারবেসের `emergency_notice` নোডে ডেটা পুশ করতে পারে।
*   **Fluid CSS Animation Display:** ড্যাশবোর্ডের মাথায় `<marquee>` এর ব্রাউজার ব্লকিং এড়াতে মডার্ন `@keyframes` এবং Tailwind CSS অ্যানিমেশন ব্যবহার করে অত্যন্ত মসৃণ ও 'Hover-to-Pause' স্ক্রোলিং নোটিশ বোর্ড সফলভাবে প্রস্তুত।

---

## 🛡️ 5. Security & Resource Optimization (নিরাপত্তা ও অপ্টিমাইজেশন)
*   **Data Isolation:** সোর্স কোড গিটহাবে সম্পূর্ণ পাবলিক হলেও ডেটাবেজের প্রশাসনিক চাবি (`serviceAccountKey.json`) এবং এডমিন প্যানেলের সিক্রেট পাসওয়ার্ড পিসিতে সম্পূর্ণ লোকালি সুরক্ষিত রাখা হয়েছে।
*   **Zero Backend Overhead:** কাস্টম এডমিন প্যানেলটি সরাসরি ক্লায়েন্ট-সাইড থেকে ফায়ারবেস ডেটাবেজ আপডেট করার কারণে মূল পিসির নোড ব্যাকএন্ড বা র‍্যামের ওপর ০.০% অতিরিক্ত চাপও পড়ে না।

---

## 🚀 6. Future Roadmap (Current Backlog in JIRA)
- [ ] **KPM-09 (Next Sprint):** নির্দিষ্ট দিনের ইতিহাস ফিল্টার করলে উপরের ৪টি প্রধান অ্যানালিটিক্স কার্ডও যেন ডাইনামিকালি সিঙ্ক হয়ে ওই দিনের সামারি দেখায়।
- [ ] **KPM-10:** ১ মিনিটের কম সময়ের ক্ষণস্থায়ী বিদ্যুৎ ড্রপের ডেটা ফিল্টার করার জন্য ব্যাকএন্ডে **Debounce Logic (Threshold)** যুক্ত করা।
- [ ] **KPM-11:** বিদ্যুৎ যাওয়া-আসার সাথে সাথে ফোনে মেসেজ অ্যালার্টের জন্য **Telegram/WhatsApp API** ইন্টিগ্রেশন।

---
Developed with ❤️ by **Md Taief Hasan**
