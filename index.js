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
        // ১. ইন্টারনেট চেক (গুগল ব্যবহার করে)
        await axios.get('https://google.com', { timeout: 8000 });

        // ২. ইন্টারনেট থাকলে: যদি আগে অফলাইন থাকে তবেই অনলাইন করবে
        if (lastStatus !== "Online") {
            await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
            await currentRef.set({ status: "Online", last_update: timestamp });
            lastStatus = "Online";
            console.log(`✅ [${timestamp}] বিদ্যুৎ ফিরেছে।`);
        } else {
            // হার্টবিট আপডেট (শুধু সময় পরিবর্তন)
            await currentRef.child("last_update").set(timestamp);
        }
    } catch (error) {
        // ৩. ইন্টারনেট না থাকলে: প্রথমে ফায়ারবেস থেকে বর্তমান অবস্থা চেক করবে (সবথেকে নিরাপদ উপায়)
        // এটি নিশ্চিত করবে যে আগে থেকে অফলাইন থাকলে নতুন করে আর ডাটা ঢুকবে না
        const snapshot = await currentRef.child("status").once('value');
        const dbStatus = snapshot.val();

        if (dbStatus !== "Offline") {
            await statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
            await currentRef.set({ status: "Offline", last_update: timestamp });
            lastStatus = "Offline";
            console.log(`⚠️ [${timestamp}] বিদ্যুৎ চলে গেছে। (Database Updated)`);
        } else {
            // যদি আগে থেকেই অফলাইন থাকে, তবে আর কিছুই করবে না
            lastStatus = "Offline";
            console.log(`🔴 [${timestamp}] বিদ্যুৎ এখনও আসেনি, নতুন ডাটা পাঠানো হয়নি।`);
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

