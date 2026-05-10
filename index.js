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

let lastStatus = "Online"; 
let errorCount = 0; 
const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});

// --- ১. অফলাইন ডিটেকশন (বিদ্যুৎ যাওয়া মাত্রই কাজ করবে) ---
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log("সার্ভারের সাথে সংযুক্ত...");
    
    // কানেক্ট হওয়া মাত্রই স্ট্যাটাস অনলাইন নিশ্চিত করা
    currentRef.update({ status: "Online", time: getBDTime() });

    // বিদ্যুৎ চলে গেলে বা নেট ডিসকানেক্ট হলে Firebase নিজে থেকেই এই ডাটা পাঠিয়ে দিবে
    const disconnectTime = getBDTime();
    currentRef.onDisconnect().update({ status: "Offline", time: disconnectTime });
    statusRef.onDisconnect().push({ 
        time: disconnectTime, 
        status: "Offline", 
        location: "Kalkini" 
    });
  }
});

// --- ২. পাওয়ার চেক লজিক ---
async function checkPower() {
    const timestamp = getBDTime();
    try {
        // google.com-এর বদলে 1.1.1.1 (Cloudflare) চেক করা বেশি স্ট্যাবল
        await axios.get('https://1.1.1', { timeout: 8000 });
        
        errorCount = 0; 

        if (lastStatus === "Offline") {
            // যদি আগে অফলাইন থাকে এবং এখন কারেন্ট আসে তবেই লগ পুশ হবে
            await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            await currentRef.set({ status: "Online", time: timestamp });
            console.log(`[${timestamp}] বিদ্যুৎ ফিরেছে।`);
            lastStatus = "Online";
        } else {
            // শুধুমাত্র লাইভ টাইম আপডেট (লগ জ্যাম হবে না)
            await currentRef.update({ time: timestamp, status: "Online" });
        }
    } catch (error) {
        errorCount++;
        // যদি টানা ৩ বার (৯০ সেকেন্ড) নেট না পায়, তবে সেটিকে অফলাইন হিসেবে ধরে নিবে
        if (errorCount >= 3 && lastStatus === "Online") {
            lastStatus = "Offline";
            console.log(`[${timestamp}] সংযোগ বিচ্ছিন্ন।`);
        }
    }
}

// প্রতি ৩০ সেকেন্ড পরপর চেক করবে
setInterval(checkPower, 30000);
checkPower();
