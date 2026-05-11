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
    
    async function checkPower() {
    const timestamp = getBDTime();
    
        try {
            // গুগল চেক করছি (সবথেকে নির্ভরযোগ্য)
            await axios.get('https://google.com', { 
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0' } // ব্রাউজার হিসেবে পরিচয় দিবে
            });

            if (lastStatus !== "Online") {
                await statusRef.push({ time: timestamp, status: "Online", location: "Kalkini" });
                await currentRef.set({ status: "Online", time: timestamp });
                console.log(`[${timestamp}] Success: Internet/Power is ON`);
                lastStatus = "Online";
            } else {
                await currentRef.child("time").set(timestamp);
            }
        } catch (error) {
            // এরর মেসেজটি টার্মিনালে দেখাবে কেন ফেইল করছে
            console.log(`[${timestamp}] Connection Failed: ${error.message}`);
            
            if (lastStatus !== "Offline") {
                await statusRef.push({ time: timestamp, status: "Offline", location: "Kalkini" });
                await currentRef.set({ status: "Offline", time: timestamp });
                lastStatus = "Offline";
            }
        }
    }
}

// প্রতি ৩০ সেকেন্ডে নিখুঁত মনিটরিং
setInterval(checkPower, 30000);
checkPower();
