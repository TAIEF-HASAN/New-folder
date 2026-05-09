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
let errorCount = 0; // পরপর কতবার এরর হলো তা গুনবে
const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});

async function checkPower() {
    const timestamp = getBDTime();
    try {
        // পরপর দুইবার সফল হলে তবেই অনলাইন নিশ্চিত করবে
        await axios.get('https://google.com', { timeout: 8000 });
        
        errorCount = 0; // সফল হলে এরর কাউন্ট শূন্য হবে

        if (lastStatus !== "Online") {
            if (lastStatus === "Offline") {
                await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            }
            await currentRef.set({ status: "Online", time: timestamp });
            console.log(`[${timestamp}] বিদ্যুৎ এসেছে।`);
            lastStatus = "Online";
        } else {
            await currentRef.child("time").set(timestamp);
        }
    } catch (error) {
        errorCount++;
        console.log(`[${timestamp}] এরর হয়েছে (${errorCount}/৩)`);

        // যদি টানা ৩ বার (অর্থাৎ প্রায় ৯০ সেকেন্ড) কানেকশন না পায়, তবেই অফলাইন দেখাবে
        if (errorCount >= 3 && lastStatus !== "Offline") {
            await statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
            await currentRef.set({ status: "Offline", time: timestamp });
            console.log(`[${timestamp}] নিশ্চিত: বিদ্যুৎ নেই।`);
            lastStatus = "Offline";
        }
    }
}

// প্রতি ৩০ সেকেন্ড পর পর চেক করবে
setInterval(checkPower, 30000);
checkPower();
