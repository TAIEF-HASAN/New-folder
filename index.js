const admin = require('firebase-admin');
const axios = require('axios');

// ১. আপনার ডাউনলোড করা JSON ফাইলের পাথ দিন
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // ২. আপনার Firebase Database URL টি এখানে দিন
  databaseURL: "https://kalkinipowermonitor-default-rtdb.asia-southeast1.firebasedatabase.app" 
});

const db = admin.database();
const ref = db.ref("power_status");

async function checkAndUpload() {
    const timestamp = new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});
    let status = "Online";

    try {
        await axios.get('https://google.com', { timeout: 5000 });
        console.log(`[${timestamp}] বিদ্যুৎ আছে।`);
        status = "Online";
    } catch (error) {
        console.log(`[${timestamp}] বিদ্যুৎ নেই!`);
        status = "Offline";
    }

    // Firebase-এ ডেটা পাঠানো
    ref.push({
        time: timestamp,
        status: status,
        location: "Kalkini"
    });
}

// প্রতি ৫ মিনিট পরপর রান হবে
setInterval(checkAndUpload, 5 * 60 * 1000);
checkAndUpload();
