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

let lastStatus = null; // এটি ডুপ্লিকেট রোধ করবে

// শুরুতে ডেটাবেজ থেকে শেষ স্ট্যাটাসটি জেনে নেওয়া
currentRef.once('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        lastStatus = data.status;
        console.log(`[SYSTEM] আগের স্ট্যাটাস ছিল: ${lastStatus}`);
    }
    // স্ট্যাটাস জানার পর মনিটরিং শুরু
    checkPower();
    setInterval(checkPower, 30000); 
});

async function checkPower() {
    const timestamp = getBDTime();
    try {
        await axios.get('https://google.com', { timeout: 8000 });
        
        // শুধু তখনই Online পাঠাবে যদি আগে Offline থাকতো
        if (lastStatus !== "Online") {
            await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            await currentRef.set({ status: "Online", last_update: timestamp });
            lastStatus = "Online";
            console.log(`✅ [${timestamp}] বিদ্যুৎ এসেছে।`);
        } else {
            // ডুপ্লিকেট না পাঠিয়ে শুধু হার্টবিট আপডেট করবে
            await currentRef.child("last_update").set(timestamp);
        }
    } catch (error) {
        // শুধু তখনই Offline পাঠাবে যদি আগে Online থাকতো
        if (lastStatus !== "Offline") {
            await statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
            await currentRef.set({ status: "Offline", last_update: timestamp });
            lastStatus = "Offline";
            console.log(`⚠️ [${timestamp}] বিদ্যুৎ চলে গেছে।`);
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

