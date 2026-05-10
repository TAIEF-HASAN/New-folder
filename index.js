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

// --- ১. অফলাইন ডিটেকশন লজিক (সংশোধিত ও নিরাপদ) ---
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log("সার্ভারের সাথে সংযুক্ত...");
    
    // কানেক্ট হওয়া মাত্রই বর্তমান স্ট্যাটাস অনলাইন নিশ্চিত করা
    currentRef.update({ status: "Online", time: getBDTime() });

    // বিদ্যুৎ চলে গেলে ডাটাবেজ স্বয়ংক্রিয়ভাবে নিচের কাজগুলো করবে
    const disconnectTime = getBDTime();
    currentRef.onDisconnect().update({ status: "Offline", time: disconnectTime });
    
    // --- গুরুত্বপূর্ণ ফিক্স (Line 30) ---
    // push() এর ওপর সরাসরি onDisconnect হয় না, তাই আলাদা রেফারেন্স নিতে হবে
    const offlineLogRef = statusRef.push(); 
    offlineLogRef.onDisconnect().set({ 
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
        await axios.get('https://1.1.1', { timeout: 8000 });
        errorCount = 0; 

        if (lastStatus === "Offline") {
            await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            await currentRef.update({ status: "Online", time: timestamp });
            console.log(`[${timestamp}] বিদ্যুৎ ফিরেছে।`);
            lastStatus = "Online";
        } else {
            await currentRef.update({ time: timestamp, status: "Online" });
        }
    } catch (error) {
        errorCount++;
        // টানা ৩ বার (৯০ সেকেন্ড) নেট না পেলে অফলাইন ঘোষণা
        if (errorCount >= 3 && lastStatus === "Online") {
            lastStatus = "Offline";
            console.log(`[${timestamp}] সংযোগ বিচ্ছিন্ন বা বিদ্যুৎ নেই।`);
        }
    }
}

setInterval(checkPower, 30000);
checkPower();
