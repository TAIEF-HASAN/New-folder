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
        // টানা ৩ বার (৯০ সেকেন্ড) নেট না পেলে অফলাইন সিদ্ধান্ত
        if (errorCount >= 3 && lastStatus === "Online") {
            lastStatus = "Offline";
            console.log(`[${timestamp}] সংযোগ বিচ্ছিন্ন বা বিদ্যুৎ নেই।`);
        }
    }
}

setInterval(checkPower, 30000);
checkPower();
