const admin = require('firebase-admin');
const axios = require('axios');

// ১. আপনার সার্ভিস অ্যাকাউন্ট কী (JSON) ফাইলের সঠিক পাথ নিশ্চিত করুন
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // ২. আপনার ডাটাবেজ URL
  databaseURL: "https://kalkinipowermonitor-default-rtdb.asia-southeast1.firebasedatabase.app" 
});

const db = admin.database();
const statusRef = db.ref("power_status"); // লগ জমার জন্য
const currentRef = db.ref("current_status"); // লাইভ স্ট্যাটাসের জন্য

// --- লাইভ অফলাইন ডিটেকশন লজিক ---
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log("সার্ভারের সাথে সংযুক্ত হয়েছে...");

    // কানেক্ট হওয়া মাত্রই স্ট্যাটাস "Online" করে দিবে
    currentRef.set({
      status: "Online",
      time: new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"})
    });

    // পিসি বা নেট ডিসকানেক্ট হলে Firebase নিজে থেকেই এটি "Offline" করে দিবে
    currentRef.onDisconnect().set({
      status: "Offline",
      time: new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"})
    }).then(() => {
        console.log("OnDisconnect চুক্তি সক্রিয় হয়েছে।");
    });
    
    
  }
});

// ৩. নিয়মিত চেক এবং লগ পাঠানো
async function checkAndUpload() {
    const timestamp = new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});
    
    try {
        await axios.get('https://google.com', { timeout: 5000 });
        console.log(`[${timestamp}] বিদ্যুৎ আছে। (Log Sent)`);
        
        // শুধুমাত্র অনলাইন থাকলেই লগ পাঠাবে, অফলাইন হলে পাঠানোর দরকার নেই
        // কারণ অফলাইন হলে ইন্টারনেট থাকে না, তাই রিয়েল-টাইম অফলাইন লজিক (উপরে) কাজ করবে
        statusRef.push({
            time: timestamp,
            status: "Online",
            location: "Kalkini"
        });
    } catch (error) {
        console.log(`[${timestamp}] বিদ্যুৎ নেই! (পিসি অফলাইন হতে পারে)`);
    }
}

// প্রতি ৫ মিনিট পরপর রান হবে
setInterval(checkAndUpload, 5 * 60 * 1000);
checkAndUpload();
