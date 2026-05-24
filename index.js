const admin = require('firebase-admin');
const axios = require('axios');
const express = require('express'); // Render-এর জন্য এক্সপ্রেস যুক্ত হলো
const app = express();
const PORT = process.env.PORT || 3000;

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kalkinipowermonitor-default-rtdb.asia-southeast1.firebasedatabase.app" 
});

const db = admin.database();
const statusRef = db.ref("power_status"); 
const currentRef = db.ref("current_status"); 

const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});

let lastStatus = "Online"; 
let isProcessing = false; 
let lastHeartbeatTime = Date.now(); // রাউটার থেকে শেষ সিগন্যাল আসার সময় ট্র্যাক করবে

// --- ১. রাউটার থেকে সিগন্যাল রিসিভ করার গেটওয়ে (Express API) ---
app.get('/heartbeat', (req, res) => {
    lastHeartbeatTime = Date.now(); // রাউটার নক করলেই সময় আপডেট হবে
    res.status(200).send("⚡ Kalkini Power Router Connected.");
});

// Render সার্ভার চালু রাখার জন্য পোর্ট লিসেন
app.listen(PORT, () => {
    console.log(`📡 Cloud Server Running on Port ${PORT}`);
});

// --- ২. শুরুতেই ডাটাবেজ থেকে স্ট্যাটাস পড়ার গ্যারান্টি ---
console.log("🚀 Power Monitor Starting on Cloud...");

currentRef.once('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        lastStatus = data.status;
        console.log(`[SYSTEM] ডাটাবেজ অনুযায়ী বর্তমান অবস্থা: ${lastStatus}`);
    }

    checkPower(); 
    setInterval(checkPower, 30000); 
});

async function checkPower() {
    if (isProcessing) return; 
    isProcessing = true;

    const timestamp = getBDTime();
    
    // শেষ ৯০ সেকেন্ডের মধ্যে রাউটার সিগন্যাল পাঠিয়েছে কিনা তা চেক করা
    const timeSinceLastHeartbeat = Date.now() - lastHeartbeatTime;
    const isRouterAlive = timeSinceLastHeartbeat <= 90000; 

    try {
        if (isRouterAlive) {
            // ১. রাউটার সিগন্যাল সচল থাকলে (বিদ্যুৎ আছে)
            if (lastStatus !== "Online") {
                await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
                await currentRef.set({ status: "Online", last_update: timestamp });
                lastStatus = "Online";
                console.log(`✅ [${timestamp}] বিদ্যুৎ ফিরেছে।`);
            } else {
                // হার্টবিট আপডেট
                await currentRef.child("last_update").set(timestamp);
                console.log(`🟢 [${timestamp}] সিস্টেম সচল আছে।`);
            }
        } else {
            // ২. রাউটার সিগন্যাল বন্ধ থাকলে (বিদ্যুৎ চলে গেছে)
            if (lastStatus !== "Offline") {
                await statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
                await currentRef.set({ status: "Offline", last_update: timestamp });
                lastStatus = "Offline";
                console.log(`⚠️ [${timestamp}] বিদ্যুৎ চলে গেছে। (Offline Update Sent)`);
            } else {
                console.log(`🔴 [${timestamp}] বিদ্যুৎ এখনও আসেনি।`);
            }
        }
    } catch (error) {
        console.error("❌ [ERROR] ডাটাবেজ আপডেট এরর:", error.message);
    } finally {
        isProcessing = false; 
    }
}
