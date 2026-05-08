const admin = require("firebase-admin");
const isOnline = require("is-online");

// আপনার ফায়ারবেস সার্ভিস অ্যাকাউন্ট কী (নিশ্চিত করুন path ঠিক আছে কিনা)
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kalkinipowermonitor-default-rtdb.asia-southeast1.firebasedatabase.app"// ফায়ারবেস URL 
});

const db = admin.database();
const statusRef = db.ref("power_status");
const logsRef = db.ref("power_logs"); // এখানে হিস্টোরি সেভ হবে

let lastStatus = null;
let powerCutStartTime = null; // বিদ্যুৎ যাওয়ার সময় মনে রাখার জন্য

console.log("Monitoring started... 🚀");

async function checkConnection() {
  const online = await isOnline();
  const currentStatus = online ? "Online" : "Offline";

  if (currentStatus !== lastStatus) {
    const currentTime = new Date();
    const timestamp = currentTime.toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' });

    console.log(`Status changed to: ${currentStatus} at ${timestamp}`);

    if (currentStatus === "Offline") {
      // বিদ্যুৎ চলে গেলে সময় রেকর্ড করি
      powerCutStartTime = currentTime;
      
      // ফায়ারবেসে স্ট্যাটাস আপডেট
      await statusRef.set({
        status: "Offline",
        last_updated: timestamp
      });
    } 
    else if (currentStatus === "Online") {
      let durationText = "N/A";

      // যদি আগে বিদ্যুৎ যাওয়ার সময় রেকর্ড করা থাকে, তবে ব্যবধান বের করি
      if (powerCutStartTime) {
        const durationMs = currentTime - powerCutStartTime;
        const totalMinutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        
        durationText = `${hours} ঘণ্টা ${mins} মিনিট`;
        powerCutStartTime = null; // কাজ শেষ, রিসেট করে দিলাম
      }

      // ফায়ারবেসে বর্তমান স্ট্যাটাস আপডেট
      await statusRef.set({
        status: "Online",
        last_updated: timestamp
      });

      // বিদ্যুৎ ফিরে আসার পর একটি লগ/হিস্টোরি সেভ করা
      await logsRef.push({
        status: "Power Returned",
        time: timestamp,
        duration: durationText,
        unix_timestamp: Date.now()
      });

      console.log(`Loadshedding Duration: ${durationText}`);
    }

    lastStatus = currentStatus;
  }
}

// প্রতি ৩০ সেকেন্ড পরপর চেক করবে
setInterval(checkConnection, 30000);
