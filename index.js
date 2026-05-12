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
const getBDTime = () => new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});// ১. সময়ের ফাংশন


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
    try {
        await axios.get('https://1.1.1', { timeout: 5000 });
        
        if (lastStatus !== "Online") {
            // বিদ্যুৎ আসলে মাত্র একবারই এন্ট্রি হবে
            await statusRef.push({ time: getBDTime(), status: "Online", location: "Kalkini" });
            await currentRef.set({ status: "Online", last_update: getBDTime() });
            lastStatus = "Online";
        }
    } catch (error) {
        // এই চেকটি নিশ্চিত করবে যে একবার অফলাইন হলে আর নতুন করে পুশ করবে না
        if (lastStatus === "Online" || lastStatus === null) {
            await statusRef.push({ time: getBDTime(), status: "Offline", location: "Kalkini" });
            await currentRef.set({ status: "Offline", last_update: getBDTime() });
            lastStatus = "Offline"; 
            console.log("⚠️ বিদ্যুৎ নেই, স্ট্যাটাস অফলাইন করা হলো।");
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

