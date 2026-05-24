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

let lastStatus = "Online"; // শুরুতে Online ধরে নিন
let isProcessing = false; // এটি ডুপ্লিকেট চেকিং নিশ্চিত করবে

async function checkPower() {
    // যদি আগের ৩০ সেকেন্ডের রিকোয়েস্ট এখনও ঝুলে থাকে, তবে নতুন করে শুরু করবে না
    if (isProcessing) return; 
    isProcessing = true;

    const timestamp = getBDTime();
    
    try {
        // ১. ইন্টারনেট চেক
        await axios.get('https://1.1.1.1', { timeout: 8000 });

        if (lastStatus !== "Online") {
            await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            await currentRef.set({ status: "Online", last_update: timestamp });
            lastStatus = "Online";
            console.log(`✅ [${timestamp}] বিদ্যুৎ ফিরেছে।`);
        } else {
            // হার্টবিট আপডেট
            await currentRef.child("last_update").set(timestamp);
            console.log(`🟢 [${timestamp}] সিস্টেম সচল আছে।`);
        }
    } catch (error) {
        // ২. ইন্টারনেট না থাকলে: ফায়ারবেসে রিকোয়েস্ট না পাঠিয়ে মেমোরি ভ্যারিয়েবল চেক করবে
        // এটিই আপনার ডুপ্লিকেট ডাটা ঢোকা বন্ধ করবে
        if (lastStatus !== "Offline") {
            await statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
            await currentRef.set({ status: "Offline", last_update: timestamp });
            lastStatus = "Offline";
            console.log(`⚠️ [${timestamp}] বিদ্যুৎ চলে গেছে। (Offline Update Sent)`);
        } else {
            console.log(`🔴 [${timestamp}] বিদ্যুৎ এখনও আসেনি।`);
        }
    } finally {
        isProcessing = false; // প্রসেস শেষ, পরের বার চেক করার জন্য রেডি
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

