// KPM RUNTIME DATA INJECTOR (Ensuring 100% Dashboard Coverage)
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

const databaseURL = "https://kalkinipowermonitor-default-rtdb.asia-southeast1.firebasedatabase.app";
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
});

const db = admin.database();
const NODE_PATH = 'kalkini_power_monitor/areas/area_1877/nodes/node_2_460';
const LOGS_PATH = 'kalkini_power_monitor/logs'; // আপনার চার্ট এবং কার্ডের ওরিজিনাল ডাটা সোর্স পাথ

async function injectHistoricalData() {
    console.log("⏳ Injecting historical telemetry logs to populate charts...");
    const todayStr = "2026-10-21";
    const yesterdayStr = "2026-10-20";
    
    const mockLogs = {};
    // গত ৭ দিনের বার চার্ট এবং কার্ডের ক্যালকুলেশন ডেটা সচল করার জন্য মক ডাটা স্ট্রাকচার
    mockLogs[`${LOGS_PATH}/${todayStr}/total_offline_minutes`] = 45;
    mockLogs[`${LOGS_PATH}/${todayStr}/total_count`] = 3;
    mockLogs[`${LOGS_PATH}/${yesterdayStr}/total_offline_minutes`] = 60;
    mockLogs[`${LOGS_PATH}/${yesterdayStr}/total_count`] = 4;
    
    await db.ref().update(mockLogs);
    console.log("🎯 Charts and Top Cards database layers populated successfully!");
}

// সার্ভার চালু হওয়ার সাথে সাথে একবার ব্যাকগ্রাউন্ড লগ ইনজেক্ট করবে
injectHistoricalData();

// আপনার আগের সেই প্রতি ৩০ সেকেন্ডের লাইভ হার্টবিট লুপ
setInterval(async () => {
    const now = Date.now();
    try {
        await db.ref(NODE_PATH).update({
            heartbeat: now,
            status: "Online"
        });
        console.log(`🟢 Live Ping -> Time: ${now} | Dashboard Status: Online`);
    } catch (error) {
        console.error("❌ Sync Error:", error.message);
    }
}, 30000);
