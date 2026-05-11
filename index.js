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

async function checkPower() {
    const timestamp = getBDTime();
    
    try {
        // ১.১.১.১ দ্রুত রেসপন্স দেয় এবং ব্লকিং কম হয়
        await axios.get('https://1.1.1', { timeout: 10000 });

        if (lastStatus !== "Online") {
            // যদি আগে অফলাইন থাকে তবেই নতুন এন্ট্রি করবে (No Duplicate)
            await statusRef.push({ 
                time: timestamp, 
                status: "Online", 
                location: "Kalkini" 
            });
            await currentRef.set({ status: "Online", time: timestamp });
            console.log(`[${timestamp}] Power is ON`);
            lastStatus = "Online";
        } else {
            // শুধু সময় আপডেট করবে ড্যাশবোর্ডের জন্য
            await currentRef.child("time").set(timestamp);
        }
    } catch (error) {
        if (lastStatus !== "Offline") {
            await statusRef.push({ 
                time: timestamp, 
                status: "Offline", 
                location: "Kalkini" 
            });
            await currentRef.set({ status: "Offline", time: timestamp });
            console.log(`[${timestamp}] Power is OFF`);
            lastStatus = "Offline";
        }
    }
}

// প্রতি ৩০ সেকেন্ডে নিখুঁত মনিটরিং
setInterval(checkPower, 30000);
checkPower();
