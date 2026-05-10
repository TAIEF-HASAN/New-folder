const admin = require('firebase-admin');
const axios = require('axios');

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kalkinipowermonitor-default-rtdb.asia-southeast1.firebasedatabase.app"   
});

const db = admin.database();
const statusRef = db.ref("power_status"); 
const currentRef = db.ref("current_status"); 

let lastStatus = null;; 
let errorCount = 0; 
const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});

// --- ১. অফলাইন ডিটেকশন লজিক (সংশোধিত) ---
db.ref(".info/connected").on("value", (snap) => {
    if (snap.val() === true) {
        console.log("Firebase Connected...");
        
        // লাইভ স্ট্যাটাস সাথে সাথে অনলাইন করে দিবে
        currentRef.update({ status: "Online", time: getBDTime() });

        // বিদ্যুৎ চলে যাওয়ার জন্য অগ্রিম চুক্তি (অধিক নিরাপদ পদ্ধতি)
        const disconnectTime = getBDTime();
        
        // ১. লাইভ স্ট্যাটাস অফলাইন
        currentRef.onDisconnect().update({ 
            status: "Offline", 
            time: disconnectTime 
        }).catch(err => console.error("onDisconnect currentRef failed:", err));

        // ২. লগ টেবিলে অফলাইন এন্ট্রি (Fix: Separate Reference)
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

// --- ২. পাওয়ার চেক লজিক ---
async function checkPower() {
    const timestamp = getBDTime();
    try {
        // গুগলের বদলে সরাসরি একটি স্ট্যাবল IP চেক করা ভালো
        await axios.get('https://google.com', { timeout: 15000 });

        
        // সফল হলে এরর কাউন্ট ০ হবে
        errorCount = 0; 

        // যদি আগে অফলাইন থাকে অথবা প্রথমবার রান হয় (null), তবেই অনলাইন লগ পাঠাবে
        if (lastStatus !== "Online") {
            await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            await currentRef.update({ status: "Online", time: timestamp });
            console.log(`[${timestamp}] নিশ্চিত: বিদ্যুৎ ফিরেছে (Online Log Sent)`);
            lastStatus = "Online";
        } else {
            // শুধুমাত্র লাইভ টাইম আপডেট (যাতে স্ট্যাটাস স্থির থাকে)
            await currentRef.child("time").set(timestamp);
        }
    } catch (error) {
        errorCount++;
        console.log(`[${timestamp}] ইন্টারনেট বা বিদ্যুৎ নেই (চেক: ${errorCount}/৩)`);

        // যদি টানা ৩ বার ফেইল করে এবং আগে অনলাইন থাকে
        if (errorCount >= 3 && lastStatus !== "Offline") {
            await statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
            await currentRef.update({ status: "Offline", time: timestamp });
            console.log(`[${timestamp}] নিশ্চিত: বিদ্যুৎ চলে গেছে।`);
            lastStatus = "Offline";
        }
    }
}


setInterval(checkPower, 30000);
checkPower();
