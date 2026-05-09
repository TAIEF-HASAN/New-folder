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

let lastStatus = null; // শুরুতে null রাখা হয়েছে যাতে প্রথমবারই স্ট্যাটাস সেট হয়
const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});

async function checkPower() {
    const timestamp = getBDTime();
    try {
        // গুগলের খুব ছোট একটি ফাইল চেক করা যা কখনোই ব্লক হয় না
        await axios.get('https://google.com', { timeout: 10000 });
        
        console.log(`[${timestamp}] ইন্টারনেট সচল আছে।`);

        if (lastStatus !== "Online") {
            // যদি আগে অফলাইন থাকতো, এখন হিস্টোরিতে লগ করবে
            if (lastStatus === "Offline") {
                await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            }
            // লাইভ স্ট্যাটাস আপডেট
            await currentRef.set({ status: "Online", time: timestamp });
            lastStatus = "Online";
        } else {
            // শুধুমাত্র সময় আপডেট (লগ হবে না)
            await currentRef.child("time").set(timestamp);
        }
    } catch (error) {
        console.log(`[${timestamp}] কানেকশন এরর: বিদ্যুৎ বা ইন্টারনেট নেই।`);
        
        if (lastStatus !== "Offline") {
            await statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
            await currentRef.set({ status: "Offline", time: timestamp });
            lastStatus = "Offline";
        }
    }
}

// চেক করার সময় কমিয়ে ৩০ সেকেন্ড করা হলো যাতে দ্রুত অনলাইন দেখায়
setInterval(checkPower, 30000);
checkPower();
