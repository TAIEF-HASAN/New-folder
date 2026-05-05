const admin = require('firebase-admin');
const axios = require('axios');

// ১. সার্ভিস অ্যাকাউন্ট কী ফাইলের পাথ ঠিক রাখুন
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kalkinipowermonitor-default-rtdb.asia-southeast1.firebasedatabase.app"  
});

const db = admin.database();
const statusRef = db.ref("power_status"); // হিস্ট্রি বা লগের জন্য
const currentRef = db.ref("current_status"); // বর্তমান অবস্থার জন্য

let lastStatus = null; // সর্বশেষ অবস্থা মনে রাখার জন্য গ্লোবাল ভেরিয়েবল

// --- রিয়েল-টাইম অফলাইন ডিটেকশন (Firebase info/connected) ---
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log("সার্ভারের সাথে সংযুক্ত হয়েছে...");

    currentRef.set({
      status: "Online",
      time: new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"})
    });

    // পিসি/ফোন অফলাইন হলে Firebase অটোমেটিক 'Offline' করে দিবে
    currentRef.onDisconnect().set({
      status: "Offline",
      time: new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"})
    });
  }
});

// ৩. নিয়মিত চেক এবং ডুপ্লিকেট রোধ লজিক
async function checkAndUpload() {
    const timestamp = new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});
    let currentStatus = "";

    try {
        // ইন্টারনেট আছে কি না চেক করছে
        await axios.get('https://google.com', { timeout: 5000 });
        currentStatus = "Online";
        
        // যদি আগের স্ট্যাটাস আর বর্তমান স্ট্যাটাস আলাদা হয়, কেবল তখনই লগ পাঠাবে
        if (currentStatus !== lastStatus) {
            statusRef.push({
                time: timestamp,
                status: "Online",
                location: "Kalkini"
            });
            console.log(`[${timestamp}] স্ট্যাটাস পরিবর্তন: Online (Log Sent)`);
            lastStatus = currentStatus; // আপডেট করে রাখা হলো
        } else {
            // একই স্ট্যাটাস হলে লগ পাঠাবে না, শুধু কনসোলে দেখাবে
            console.log(`[${timestamp}] বিদ্যুৎ আছে। (No duplicate log)`);
        }

    } catch (error) {
        currentStatus = "Offline";
        
        // বিদ্যুৎ চলে গেলে যদি আপনার পিসি/ফোনে ইন্টারনেট থাকে (যেমন সিম কার্ড ডাটা)
        if (currentStatus !== lastStatus) {
            statusRef.push({
                time: timestamp,
                status: "Offline",
                location: "Kalkini"
            });
            console.log(`[${timestamp}] বিদ্যুৎ নেই! (Offline Log Sent)`);
            lastStatus = currentStatus;
        } else {
            console.log(`[${timestamp}] বিদ্যুৎ এখনো নেই। (Waiting for power...)`);
        }
    }
}

// প্রতি ৫ মিনিট পরপর চেক করবে
setInterval(checkAndUpload, 5 * 60 * 1000);
checkAndUpload();
