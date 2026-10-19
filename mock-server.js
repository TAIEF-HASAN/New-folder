// KPM LIGHTWEIGHT LOCAL MOCK SERVER (Zero PC Load Script)
const admin = require('firebase-admin');

// ওরিজিনাল ফায়ারবেস কনফিগারেশন যা ফাইল এক্সপ্লোরার থেকে ডিটেক্ট হয়েছে
const databaseURL = "https://firebasedatabase.app";
const NODE_PATH = 'kalkini_power_monitor/areas/area_1877/nodes/node_2_460';

admin.initializeApp({
    credential: admin.credential.applicationDefault(), // serviceAccountKey.json রিড করবে
    databaseURL: databaseURL
});

const db = admin.database();

console.log("🛰️ KPM Virtual Engine: Activating Local Telemetry Simulator...");

// প্রতি ৩০ সেকেন্ড পর পর ডাটাবেজে জ্যান্ত হার্টবিট পুশ করার মেইন লুপ
setInterval(async () => {
    const now = Date.now();
    const currentHour = new Date().getHours();
    let mockStatus = "Online";

    // মক লোডশেডিং শিডিউল (দুপুর ২টা এবং রাত ৮টা)
    if (currentHour === 14 || currentHour === 20) {
        mockStatus = "Offline";
    }

    try {
        await db.ref(NODE_PATH).update({
            heartbeat: now,
            status: mockStatus
        });
        console.log(`🟢 Ping Synced -> Time: ${now} | Status: ${mockStatus}`);
    } catch (error) {
        console.error("❌ Firebase Sync Error:", error.message);
    }
}, 30000); // ৩০ সেকেন্ড ইন্টারভাল লক
  