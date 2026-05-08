const admin = require("firebase-admin");
const isOnline = require("is-online");

// আপনার সার্ভিস অ্যাকাউন্ট কী ফাইলের পাথ
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://YOUR_PROJECT_://firebaseio.com" // আপনার ফায়ারবেস URL নিশ্চিত করুন
});

const db = admin.database();
const statusRef = db.ref("power_status");
const logsRef = db.ref("power_logs");

let lastStatus = null;
let powerCutStartTime = null;

console.log("Monitoring started... 🚀");

async function checkConnection() {
  try {
    const online = await isOnline();
    const currentStatus = online ? "Online" : "Offline";

    // স্ট্যাটাস পরিবর্তন হলেই কেবল কাজ করবে
    if (currentStatus !== lastStatus) {
      const currentTime = new Date();
      // আপনার UI-এর সাথে মিল রেখে টাইম ফরম্যাট
      const timestamp = currentTime.toLocaleString('en-US', { 
        hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true,
        month: 'numeric', day: 'numeric', year: 'numeric'
      });

      console.log(`Status changed: ${currentStatus} at ${timestamp}`);

      if (currentStatus === "Offline") {
        powerCutStartTime = currentTime; // বিদ্যুৎ যাওয়ার সময় সেভ
        
        await statusRef.set({
          status: "OFFLINE", // আপনার UI-তে বড় হাতের অক্ষরে ছিল
          last_updated: timestamp
        });
      } 
      else if (currentStatus === "Online") {
        let durationText = "0 মিনিট";

        if (powerCutStartTime) {
          const durationMs = currentTime - powerCutStartTime;
          const totalMinutes = Math.floor(durationMs / (1000 * 60));
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          
          durationText = hours > 0 ? `${hours} ঘণ্টা ${mins} মিনিট` : `${mins} মিনিট`;
          powerCutStartTime = null;
        }

        await statusRef.set({
          status: "ONLINE",
          last_updated: timestamp
        });

        // লগ সেভ করা (UI-তে লগের জন্য)
        await logsRef.push({
          time: timestamp,
          status: "Power Returned",
          duration: durationText
        });
      }

      lastStatus = currentStatus;
    }
  } catch (error) {
    console.error("Error checking connection:", error);
  }
}

// প্রতি ৩০ সেকেন্ড পরপর চেক
setInterval(checkConnection, 30000);
