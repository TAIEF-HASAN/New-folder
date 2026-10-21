// KPM LIGHTWEIGHT LOCAL MOCK SERVER (Fixed Parser Gateway)
const admin = require('firebase-admin');
const path = require('path');

// 🔐 আপনার ডিরেক্টরি ট্রি-তে থাকা আসল serviceAccountKey.json ফাইলের পাথ লক করলাম
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

// 🔗 ওরিজিংয়াল ফায়ারবেস ক্লিন বেস ইউআরএল (কোনো এন্ডপয়েন্ট বা এক্সট্রা স্ল্যাশ ছাড়া)
const databaseURL = "https://kalkinipowermonitor-default-rtdb.asia-southeast1.firebasedatabase.app";
const NODE_PATH = 'kalkini_power_monitor/areas/area_1877/nodes/node_2_460';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount), // ওরিজিনাল চাবি দিয়ে সাইন-ইন লক হলো
    databaseURL: databaseURL
});

const db = admin.database();

console.log("🛰️ KPM Virtual Engine: Activating Local Telemetry Simulator...");

// প্রতি ৩০ সেকেন্ড পর পর ডাটাবেজে জ্যান্ত হার্টবিট পুশ করার মেইন লুপ
setInterval(async () => {
    const now = Date.now();
    // বাংলাদেশ সময় GMT+6 সিঙ্ক করার জন্য কারেন্ট আওয়ার গেট করলাম
    const currentHour = new Date(new Date().getTime() + 6 * 3600 * 1000).getUTCHours();
    let mockStatus = "Online";

    // মক লোডশেডিং শিডিউল (দুপুর ২টা [১৪] এবং রাত ৮টা [২০])
    if (currentHour === 14 || currentHour === 20) {
        mockStatus = "Offline";
    }

    try {
        await db.ref(NODE_PATH).update({
            heartbeat: now,
            status: mockStatus
        });
        console.log(`🟢 Ping Synced Successfully -> Time: ${now} | Status: ${mockStatus}`);
    } catch (error) {
        console.error("❌ Firebase Sync Error:", error.message);
    }
}, 30000); // ৩০ সেকেন্ড ইন্টারভাল লক
