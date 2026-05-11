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

let lastStatus = null; 

const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});

// --- পাওয়ার চেক করার প্রধান ফাংশন ---
async function checkPower() {
    const timestamp = getBDTime();
    console.log(`[${timestamp}] Checking connection...`); // এই লাইনটি এখন কনসোলে দেখাবে

    try {
        // গুগলের সবথেকে ফাস্ট সার্ভিস চেক
        await axios.get('https://google.com', { 
            timeout: 8000 
        });

        if (lastStatus !== "Online") {
            await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            await currentRef.set({ status: "Online", last_update: timestamp });
            console.log("✅ STATUS: ONLINE (Database Updated)");
            lastStatus = "Online";
        } else {
            // লাইভ হার্টবিট আপডেট
            await currentRef.child("last_update").set(timestamp);
            console.log("🟢 SYSTEM: STILL ONLINE");
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        
        if (lastStatus !== "Offline") {
            await statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
            await currentRef.set({ status: "Offline", last_update: timestamp });
            console.log("⚠️ STATUS: OFFLINE (Database Updated)");
            lastStatus = "Offline";
        }
    }
}

// ফাইলটি রান হওয়ার সাথে সাথে একবার চেক করবে
console.log("🚀 Power Monitor Starting...");
checkPower();

// প্রতি ৩০ সেকেন্ড পরপর চেক করবে
setInterval(checkPower, 30000);
