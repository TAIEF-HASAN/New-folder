const admin = require('firebase-admin');
const axios = require('axios');

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://firebasedatabase.app"  
});

const db = admin.database();
const statusRef = db.ref("power_status"); 
const currentRef = db.ref("current_status"); 
const summaryRef = db.ref("daily_summary"); // নতুন নোড

let lastStatus = null; 
let powerCutStartTime = null; 
let totalOffCount = 0; // সারাদিনে কতবার বিদ্যুৎ গেল
let totalOffDurationMs = 0; // মোট কতক্ষণ ছিল না (মিলি-সেকেন্ডে)

const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});

// --- রিয়েল-টাইম অফলাইন ডিটেকশন ---
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    currentRef.set({ status: "Online", time: getBDTime() });
    currentRef.onDisconnect().set({ status: "Offline", time: getBDTime() });
  }
});

async function checkAndUpload() {
    const now = new Date();
    const timestamp = getBDTime();
    let currentStatus = "";

    try {
        await axios.get('https://google.com', { timeout: 5000 });
        currentStatus = "Online";
        
        if (currentStatus !== lastStatus) {
            let durationText = "N/A";

            if (powerCutStartTime) {
                const durationMs = now - powerCutStartTime;
                totalOffDurationMs += durationMs; // মোট সময়ে যোগ হলো
                
                const totalMinutes = Math.floor(durationMs / (1000 * 60));
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                durationText = hours > 0 ? `${hours} ঘণ্টা ${mins} মিনিট` : `${mins} মিনিট`;
                powerCutStartTime = null; 
            }

            statusRef.push({ time: timestamp, status: "Online", duration: durationText, location: "Kalkini" });
            console.log(`[${timestamp}] বিদ্যুৎ এসেছে!`);
            lastStatus = currentStatus;
        }

    } catch (error) {
        currentStatus = "Offline";
        if (currentStatus !== lastStatus) {
            powerCutStartTime = now; 
            totalOffCount++; // কতবার গেল তা গুনছি

            statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
            console.log(`[${timestamp}] বিদ্যুৎ নেই!`);
            lastStatus = currentStatus;
        }
    }
}

// --- প্রতিদিন রাত ১১:৫৯ মিনিটে সামারি সেভ করার লজিক ---
setInterval(() => {
    const now = new Date();
    // রাত ১১:৫৯ মিনিটে এটি রান হবে
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

        // নতুন দিনের জন্য রিসেট
        totalOffCount = 0;
        totalOffDurationMs = 0;
        console.log("Daily Summary Sent to Firebase!");
    }
}, 60000); // প্রতি মিনিটে চেক করবে সময় হয়েছে কি না

setInterval(checkAndUpload, 5 * 60 * 1000);
checkAndUpload();
