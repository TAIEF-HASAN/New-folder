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

// --- ১. অফলাইন ডিটেকশন লজিক (সংশোধিত) ---
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log("সার্ভারের সাথে সংযুক্ত...");
    
    // কানেক্ট হওয়া মাত্রই বর্তমান স্ট্যাটাস অনলাইন নিশ্চিত করা
    currentRef.update({ status: "Online", time: getBDTime() });

    // বিদ্যুৎ চলে গেলে Firebase স্বয়ংক্রিয়ভাবে নিচের কাজগুলো করবে
    const disconnectTime = getBDTime();
    
    // লাইভ স্ট্যাটাস অফলাইন করা
    currentRef.onDisconnect().update({ status: "Offline", time: disconnectTime });
    
    // লগে অফলাইন এন্ট্রি সেভ করার সঠিক পদ্ধতি
    const offlinePushRef = statusRef.push(); // আগে একটি আইডি জেনারেট করে নিতে হবে
    offlinePushRef.onDisconnect().set({ 
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
        // স্ট্যাবল চেকিংয়ের জন্য Cloudflare DNS ব্যবহার
        await axios.get('https://1.1.1', { timeout: 8000 });
        
        errorCount = 0; 

        if (lastStatus === "Offline") {
            await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            await currentRef.update({ status: "Online", time: timestamp });
            console.log(`[${timestamp}] বিদ্যুৎ ফিরেছে।`);
            lastStatus = "Online";
        } else {
            // শুধুমাত্র লাইভ সময় আপডেট (লগ জ্যাম হবে না)
            await currentRef.update({ time: timestamp, status: "Online" });
        }
    } catch (error) {
        errorCount++;
        // যদি টানা ৩ বার (৯০ সেকেন্ড) নেট না পায়, তবে অফলাইন ধরে নিবে
        if (errorCount >= 3 && lastStatus === "Online") {
            lastStatus = "Offline";
            console.log(`[${timestamp}] সংযোগ বিচ্ছিন্ন বা বিদ্যুৎ নেই।`);
        }
    }
}

// প্রতি ৩০ সেকেন্ড পরপর চেক করবে
setInterval(checkPower, 30000);
checkPower();
