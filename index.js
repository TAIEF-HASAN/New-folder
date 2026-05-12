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

// index.js এর উপরের অংশ... (admin, axios, serviceAccount ঠিক থাকবে)
const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});
let lastStatus = null; 

// --- শুরুতেই ডাটাবেজ থেকে স্ট্যাটাস পড়ার গ্যারান্টি ---
console.log("🚀 Power Monitor Starting...");

currentRef.once('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        lastStatus = data.status;
        console.log(`[SYSTEM] ডাটাবেজ অনুযায়ী বর্তমান অবস্থা: ${lastStatus}`);
    }

    // ডাটাবেজ থেকে বর্তমান অবস্থা জানার পরেই কেবল মনিটরিং শুরু হবে
    // এতে lastStatus শুরুতে null থাকার কারণে ডুপ্লিকেট হওয়ার ভয় থাকবে না
    checkPower(); 
    setInterval(checkPower, 30000); 
});

async function checkPower() {
    const timestamp = getBDTime();
    try {
        // google.com অনেক সময় ধীরগতিতে রেসপন্স দেয়, তাই 1.1.1.1 ব্যবহার করা ভালো
        await axios.get('https://1.1.1.1', { timeout: 10000 });
        
        if (lastStatus !== "Online") {
            await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            await currentRef.set({ status: "Online", last_update: timestamp });
            lastStatus = "Online";
            console.log(`✅ [${timestamp}] বিদ্যুৎ আছে। (Online Update Sent)`);
        } else {
            // বিদ্যুৎ থাকলে শুধু সময় আপডেট করবে ড্যাশবোর্ডের জন্য
            await currentRef.child("last_update").set(timestamp);
            console.log(`🟢 [${timestamp}] সিস্টেম সচল আছে।`);
        }
    } catch (error) {
        // শুধু তখনই Offline পাঠাবে যদি আগে Online থাকতো (No Duplicate)
        if (lastStatus !== "Offline") {
            await statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
            await currentRef.set({ status: "Offline", last_update: timestamp });
            lastStatus = "Offline";
            console.log(`⚠️ [${timestamp}] বিদ্যুৎ নেই! (Offline Update Sent)`);
        } else {
            console.log(`🔴 [${timestamp}] বিদ্যুৎ এখনও আসেনি।`);
        }
    }
}




// ১. শুরুতেই ডাটাবেজ থেকে শেষ স্ট্যাটাসটি জেনে নেওয়া
console.log("🚀 Power Monitor Starting...");

currentRef.once('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        lastStatus = data.status;
        console.log(`[SYSTEM] গত স্ট্যাটাস ছিল: ${lastStatus}`);
    }

    // ডাটাবেজ থেকে স্ট্যাটাস পাওয়ার পরেই কেবল চেক করা শুরু হবে
    // এর ফলে 'null' স্ট্যাটাস নিয়ে ডুপ্লিকেট ডাটা ঢোকার সুযোগ থাকবে না
    checkPower(); // প্রথমবার রান
    setInterval(checkPower, 30000); // এরপর প্রতি ৩০ সেকেন্ডে
});

