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

let lastStatus = "Online"; 
const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});

// --- ১. রিয়েল-টাইম অফলাইন ডিটেকশন (সংশোধিত) ---
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log("Firebase Connected...");
    
    // কানেক্ট হলে স্ট্যাটাস অনলাইন নিশ্চিত করা
    currentRef.update({ status: "Online", time: getBDTime() });

    // বিদ্যুৎ চলে গেলে ডাটাবেজ নিজে থেকে এই কাজগুলো করবে
    const disconnectTime = getBDTime();
    currentRef.onDisconnect().update({ status: "Offline", time: disconnectTime });
    
    // লগ টেবিলে অফলাইন এন্ট্রি
    statusRef.onDisconnect().push({ 
        time: disconnectTime, 
        status: "Offline", 
        location: "Kalkini" 
    });
  }
});

// --- ২. বিদ্যুৎ আসা চেক করার লজিক (সংশোধিত) ---
async function checkPower() {
    const timestamp = getBDTime();

    try {
        // google.com এর চেয়ে 1.1.1.1 (Cloudflare) দ্রুত কাজ করে
        await axios.get('https://1.1.1', { timeout: 5000 });
        
        // যদি আগে অফলাইন থাকে এবং এখন ইন্টারনেট পায়, তবেই লগ পুশ হবে
        if (lastStatus === "Offline") {
            statusRef.push({ 
                time: timestamp, 
                status: "Online", 
                location: "Kalkini" 
            });
            currentRef.update({ status: "Online", time: timestamp });
            console.log(`[${timestamp}] বিদ্যুৎ এসেছে!`);
            lastStatus = "Online";
        }
    } catch (error) {
        // নেট না থাকলে বা কারেন্ট না থাকলে স্ট্যাটাস ইন্টারনালি অফলাইন করে রাখা
        if (lastStatus === "Online") {
            console.log("সংযোগ বিচ্ছিন্ন বা বিদ্যুৎ নেই...");
            lastStatus = "Offline";
        }
    }
}

// ৩. প্রতিদিনের সামারি (অপরিবর্তিত লজিক, শুধু টাইমার চেক)
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 23 && now.getMinutes() === 59) {
        // এখানে আপনার প্রয়োজন অনুযায়ী totalOffCount হিসাব করার কোড যোগ করতে পারেন
        console.log("Daily Summary Processed.");
    }
}, 60000);

// প্রতি ৩০ সেকেন্ডে একবার চেক করবে
setInterval(checkPower, 30000);
checkPower();
