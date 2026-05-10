const admin = require('firebase-admin');
const axios = require('axios');
const https = require('https');

// আপনার সার্ভিস অ্যাকাউন্ট কী (JSON) ফাইলের সঠিক পাথ নিশ্চিত করুন
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://firebasedatabase.app"
});

const db = admin.database();
const statusRef = db.ref("power_status"); 
const currentRef = db.ref("current_status"); 

let lastStatus = null; 
let errorCount = 0; 

const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});

// --- ১. অফলাইন ডিটেকশন লজিক (অনলাইন/অফলাইন রিয়েল-টাইম সুইচ) ---
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log("Firebase Connected...");
    
    // কানেক্ট হওয়া মাত্রই লাইভ স্ট্যাটাস অনলাইন
    currentRef.update({ status: "Online", time: getBDTime() });

    // বিদ্যুৎ চলে গেলে ডাটাবেজ যেন অটোমেটিক অফলাইন করে দেয় (অগ্রিম চুক্তি)
    const disconnectTime = getBDTime();
    
    // লাইভ স্ট্যাটাস অফলাইন আপডেট
    currentRef.onDisconnect().update({ 
        status: "Offline", 
        time: disconnectTime
    }).catch(err => console.error("onDisconnect currentRef failed:", err));

    // লগে অফলাইন এন্ট্রি পুশ করার সঠিক পদ্ধতি
    try {
        const offlineLogRef = statusRef.push();
        offlineLogRef.onDisconnect().set({ 
            time: disconnectTime, 
            status: "Offline", 
            location: "Kalkini"
        }).catch(err => console.error("onDisconnect log failed:", err));
    } catch (e) {
        console.error("Error setting onDisconnect log:", e);
    }
  }
});

// --- ২. পাওয়ার চেক করার শক্তিশালী লজিক ---
async function checkPower() {
    const timestamp = getBDTime();
    
    try {
        // গুগলের সবথেকে হালকা সার্ভিস দিয়ে ইন্টারনেট চেক (অধিক নির্ভুল)
        await axios.get('https://google.com', { timeout: 15000 });
        
        errorCount = 0; // সফল হলে এরর কাউন্ট রিসেট

        // যদি আগে অফলাইন থাকে অথবা প্রথমবারের রান হয়, তবেই লগ পুশ করবে
        if (lastStatus !== "Online") {
            await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            await currentRef.update({ status: "Online", time: timestamp });
            console.log(`[${timestamp}] নিশ্চিত: বিদ্যুৎ ফিরেছে (Online Log Sent)`);
            lastStatus = "Online";
        } else {
            // শুধুমাত্র লাইভ আপডেট যাতে ড্যাশবোর্ড সচল থাকে
            await currentRef.child("time").set(timestamp);
        }
    } catch (error) {
        errorCount++;
        console.log(`[${timestamp}] ইন্টারনেট বা বিদ্যুৎ নেই (চেক: ${errorCount}/৩)`);

        // টানা ৩ বার (অর্থাৎ ৯০ সেকেন্ড) চেক ব্যর্থ হলে অফলাইন লগ হবে
        if (errorCount >= 3 && lastStatus !== "Offline") {
            await statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
            await currentRef.update({ status: "Offline", time: timestamp });
            console.log(`[${timestamp}] নিশ্চিত: বিদ্যুৎ চলে গেছে।`);
            lastStatus = "Offline";
        }
    }
}

// প্রতি ৩০ সেকেন্ড পরপর চেক করবে
setInterval(checkPower, 30000);
checkPower();
