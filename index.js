const admin = require('firebase-admin');
const axios = require('axios');

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kalkinipowermonitor-default-rtdb.asia-southeast1.firebasedatabase.app"  
});

const db = admin.database();
const statusRef = db.ref("power_status"); // হিস্ট্রি বা লগের জন্য
const currentRef = db.ref("current_status"); // বর্তমান অবস্থার জন্য

let lastStatus = null; 
let powerCutStartTime = null; // লোডশেডিং শুরুর সময় রাখার জন্য

// --- রিয়েল-টাইম অফলাইন ডিটেকশন ---
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log("সার্ভারের সাথে সংযুক্ত হয়েছে...");

    currentRef.set({
      status: "Online",
      time: new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"})
    });

    currentRef.onDisconnect().set({
      status: "Offline",
      time: new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"})
    });
  }
});

async function checkAndUpload() {
    const now = new Date();
    const timestamp = now.toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});
    let currentStatus = "";

    try {
        await axios.get('https://google.com', { timeout: 5000 });
        currentStatus = "Online";
        
        if (currentStatus !== lastStatus) {
            let durationText = "N/A";

            // যদি আগে বিদ্যুৎ যাওয়ার সময় রেকর্ড করা থাকে
            if (powerCutStartTime) {
                const durationMs = now - powerCutStartTime;
                const totalMinutes = Math.floor(durationMs / (1000 * 60));
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                
                durationText = hours > 0 ? `${hours} ঘণ্টা ${mins} মিনিট` : `${mins} মিনিট`;
                powerCutStartTime = null; // রিসেট
            }

            statusRef.push({
                time: timestamp,
                status: "Online",
                duration: durationText, // নতুন ফিল্ড: কতক্ষণ ছিল না
                location: "Kalkini"
            });

            console.log(`[${timestamp}] বিদ্যুৎ এসেছে! সময়কাল: ${durationText}`);
            lastStatus = currentStatus;
        } else {
            console.log(`[${timestamp}] বিদ্যুৎ আছে। (No duplicate log)`);
        }

    } catch (error) {
        currentStatus = "Offline";
        
        if (currentStatus !== lastStatus) {
            powerCutStartTime = now; // বিদ্যুৎ যাওয়ার সময় সেভ করলাম

            statusRef.push({
                time: timestamp,
                status: "Offline",
                location: "Kalkini"
            });
            console.log(`[${timestamp}] বিদ্যুৎ নেই!`);
            lastStatus = currentStatus;
        } else {
            console.log(`[${timestamp}] বিদ্যুৎ এখনো নেই।`);
        }
    }
}

// আপনার আগের মতো ৫ মিনিট পর পর চেক
setInterval(checkAndUpload, 5 * 60 * 1000);
checkAndUpload();
