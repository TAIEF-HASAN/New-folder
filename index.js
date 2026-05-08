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
let powerCutStartTime = null; 

// টাইম ফরম্যাটের জন্য একটি কমন ফাংশন (যাতে সব জায়গায় একই থাকে)
const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});

// --- রিয়েল-টাইম অফলাইন ডিটেকশন ---
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log("সার্ভারের সাথে সংযুক্ত হয়েছে...");

    currentRef.set({
      status: "Online",
      time: getBDTime()
    });

    currentRef.onDisconnect().set({
      status: "Offline",
      time: getBDTime()
    });
  }
});

async function checkAndUpload() {
    const now = new Date();
    const timestamp = getBDTime();
    let currentStatus = "";

    try {
        // গুগলকে পিং করে ইন্টারনেট/বিদ্যুৎ চেক
        await axios.get('https://google.com', { timeout: 5000 });
        currentStatus = "Online";
        
        if (currentStatus !== lastStatus) {
            let durationText = "N/A";

            if (powerCutStartTime) {
                const durationMs = now - powerCutStartTime;
                const totalMinutes = Math.floor(durationMs / (1000 * 60));
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                
                durationText = hours > 0 ? `${hours} ঘণ্টা ${mins} মিনিট` : `${mins} মিনিট`;
                powerCutStartTime = null; 
            }

            // যদি প্রথমবার রান করার সময় 'Online' পায়, তবে 'N/A' দেখাবে
            await statusRef.push({
                time: timestamp,
                status: "Online",
                duration: durationText,
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
            powerCutStartTime = now; 

            await statusRef.push({
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

// প্রতি ৫ মিনিট পরপর চেক
setInterval(checkAndUpload, 5 * 60 * 1000);
checkAndUpload();
