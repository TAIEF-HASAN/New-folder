// KPM LIGHTWEIGHT LOCAL MOCK TELEMETRY INJECTOR (Fixed Format Gateway)
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

const databaseURL = "https://kalkinipowermonitor-default-rtdb.asia-southeast1.firebasedatabase.app";
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
});

const db = admin.database();
const LOGS_PATH = 'power_status'; // 🔗 আপনার index.html ফাইলের ওরিজিনাল নোড পাথ

// ⏱️ আপনার ফ্রন্টএন্ড কোডের en-BD ফর্ম্যাট অনুযায়ী বাংলাদেশ টাইমস্ট্যাম্প জেনারেটর
function getBDTimestampString(offsetHours = 0, offsetMinutes = 0) {
    const date = new Date();
    // সময়ের ব্যবধান বা মক লোডশেডিং জেনারেট করার জন্য অফসেট অ্যাড করলাম
    date.setHours(date.getHours() + offsetHours);
    date.setMinutes(date.getMinutes() + offsetMinutes);
    
    return date.toLocaleString("en-BD", { timeZone: "Asia/Dhaka" });
}

async function injectMockLoadsheddingData() {
    console.log("⏳ Injecting sequence logs to populate cards and bar charts...");
    
    const ref = db.ref(LOGS_PATH);
    
    // পূর্ববর্তী আবজাব ডেটা থাকলে তা ক্লিয়ার করে ফ্রেশ স্টেট তৈরি করবে
    await ref.remove();

    // 🎯 সিকুয়েন্সিয়াল ইভেন্ট লুপ: আপনার কোডের জন্য ৩ বার মক লোডশেডিংয়ের ঘটনা পুশ করলাম
    // কাট ১: দুপুর ১২:০০ থেকে ১২:৩০ (৩০ মিনিট)
    await ref.push({ time: getBDTimestampString(-2, 0), status: "Offline" });
    await ref.push({ time: getBDTimestampString(-2, 30), status: "Online" });

    // কাট ২: দুপুর ২:০০ থেকে ২:৪৫ (৪৫ মিনিট)
    await ref.push({ time: getBDTimestampString(-1, 0), status: "Offline" });
    await ref.push({ time: getBDTimestampString(-1, 45), status: "Online" });

    // কাট ৩: বিকেল ৪:০০ থেকে ৪:১৫ (১৫ মিনিট)
    await ref.push({ time: getBDTimestampString(0, -30), status: "Offline" });
    await ref.push({ time: getBDTimestampString(0, -15), status: "Online" });

    // বর্তমান লাইভ অবস্থা অনলাইন সেট করে দিলাম
    await ref.push({ time: getBDTimestampString(0, 0), status: "Online" });

    console.log("🎯 All Dashboard slots, Graphs, and Top Cards populated with 90 Minutes data!");
}

// স্ক্রিপ্ট চালু হওয়া মাত্রই পুরো হিস্ট্রি ডেটা ইনজেক্ট করবে
injectMockLoadsheddingData();
