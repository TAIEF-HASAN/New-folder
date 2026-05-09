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
const summaryRef = db.ref("daily_summary");

let lastLoggedStatus = "Online"; // বর্তমানে ডাটাবেজে কী আছে তা মনে রাখবে

const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});

// ১. Firebase কানেকশন হ্যান্ডলিং (শুধুমাত্র লাইভ স্ট্যাটাসের জন্য)
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log("Firebase Connected...");
    // কানেক্ট হলে শুধু লাইভ স্ট্যাটাস অনলাইন দেখাবে
    currentRef.update({ status: "Online", time: getBDTime() });

    // হুট করে ডিসকানেক্ট হলে লাইভ স্ট্যাটাস অফলাইন দেখাবে (কিন্তু লগে কিছু লিখবে না)
    currentRef.onDisconnect().update({ 
        status: "Offline", 
        time: getBDTime() 
    });
  }
});

// ২. পাওয়ার চেক করার মূল ফাংশন (Smart Monitoring)
async function checkPower() {
    const timestamp = getBDTime();
    try {
        // গুগলের বদলে এই ফাস্ট DNS চেক করা বেশি নিরাপদ
        await axios.get('https://1.1.1', { timeout: 8000 });
        
        // যদি ডাটাবেজে আগে 'Offline' থাকে এবং এখন কানেকশন পাওয়া যায়
        if (lastLoggedStatus === "Offline") {
            await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            await currentRef.update({ status: "Online", time: timestamp });
            console.log(`[${timestamp}] নিশ্চিত: বিদ্যুৎ এসেছে।`);
            lastLoggedStatus = "Online";
        }
    } catch (error) {
        // যদি ডাটাবেজে আগে 'Online' থাকে এবং এখন কানেকশন ফেইল করে
        if (lastLoggedStatus === "Online") {
            // বিদ্যুৎ চলে যাওয়ার লগ
            await statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
            await currentRef.update({ status: "Offline", time: timestamp });
            console.log(`[${timestamp}] নিশ্চিত: বিদ্যুৎ চলে গেছে।`);
            lastLoggedStatus = "Offline";
        }
    }
}

// প্রতি ৪৫ সেকেন্ডে একবার চেক করবে (বেশি ঘন ঘন চেক করলে ফ্ল্যাপিং বাড়ে)
setInterval(checkPower, 45000);
checkPower();
