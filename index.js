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

let lastStatus = "Online"; // শুরুতে অনলাইন ধরে নেওয়া হলো
let powerCutStartTime = null; 
let totalOffCount = 0; 
let totalOffDurationMs = 0; 

const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});

// --- ১. বিদ্যুৎ যাওয়া মাত্রই সাথে সাথে লগ করার লজিক (onDisconnect) ---
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log("সার্ভারের সাথে সংযুক্ত...");
    
    // কানেক্ট হওয়া মাত্রই বর্তমান স্ট্যাটাস অনলাইন
    currentRef.set({ status: "Online", time: getBDTime() });

    // বিদ্যুৎ চলে গেলে বা নেট ডিসকানেক্ট হলে যা হবে
    const disconnectTime = getBDTime();
    
    // লাইভ স্ট্যাটাস অফলাইন করা
    currentRef.onDisconnect().set({ status: "Offline", time: disconnectTime });
    
    // লগ (History) টেবিলে অফলাইন ডাটা পুশ করার অগ্রিম চুক্তি
    statusRef.onDisconnect().push({ 
        time: disconnectTime, 
        status: "Offline", 
        location: "Kalkini" 
    });
  }
});

// --- ২. বিদ্যুৎ আসা চেক করার লজিক ---
async function checkPower() {
    const now = new Date();
    const timestamp = getBDTime();

    try {
        await axios.get('https://google.com', { timeout: 5000 });
        
        // যদি আগে অফলাইন ছিল (অর্থাৎ এখন কারেন্ট আসলো)
        if (lastStatus === "Offline") {
            statusRef.push({ 
                time: timestamp, 
                status: "Online", 
                location: "Kalkini" 
            });
            console.log(`[${timestamp}] বিদ্যুৎ এসেছে!`);
            lastStatus = "Online";
        }
    } catch (error) {
        // বিদ্যুৎ না থাকলে lastStatus অফলাইন করে রাখা
        lastStatus = "Offline";
    }
}

// প্রতিদিন রাত ১১:৫৯ মিনিটে সামারি সেভ করার লজিক (অপরিবর্তিত)
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 23 && now.getMinutes() === 59) {
        const totalMinutes = Math.floor(totalOffDurationMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        summaryRef.child(now.toLocaleDateString("en-BD")).set({
            date: now.toLocaleDateString("en-BD"),
            off_count: totalOffCount,
            total_duration: `${hours} ঘণ্টা ${mins} মিনিট`,
            timestamp: Date.now()
        });

        totalOffCount = 0;
        totalOffDurationMs = 0;
    }
}, 60000);

// এখন আমরা ৩০ সেকেন্ড পর পর চেক করব, কিন্তু ডাটা পাঠাব শুধু পরিবর্তন হলে
setInterval(checkPower, 30 * 1000);
checkPower();
