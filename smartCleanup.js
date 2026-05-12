const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kalkinipowermonitor-default-rtdb.asia-southeast1.firebasedatabase.app" 
});

const db = admin.database();
const statusRef = db.ref("power_status");

console.log("⏳ ডুপ্লিকেট এন্ট্রি শনাক্ত করা হচ্ছে...");

statusRef.once('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
        console.log("ডেটাবেজ খালি!");
        process.exit();
    }

    const keys = Object.keys(data);
    const updates = {};
    let lastStatus = null;
    let deletedCount = 0;

    keys.forEach((key) => {
        const currentStatus = data[key].status;

        // যদি আগের স্ট্যাটাস আর বর্তমান স্ট্যাটাস একই হয় (ডুপ্লিকেট)
        if (currentStatus === lastStatus) {
            updates[key] = null; // ডিলিট করার জন্য মার্ক
            deletedCount++;
        } else {
            // যদি স্ট্যাটাস পরিবর্তন হয় (যেমন Online থেকে Offline) তবে সেটি রেখে দিবে
            lastStatus = currentStatus;
        }
    });

    if (deletedCount > 0) {
        statusRef.update(updates)
            .then(() => {
                console.log(`✅ সফলভাবে ${deletedCount}টি ডুপ্লিকেট এন্ট্রি পরিষ্কার করা হয়েছে!`);
                console.log("এখন আপনার লগে শুধু প্রতিটি ইভেন্টের প্রথম এন্ট্রিটি অবশিষ্ট আছে।");
                process.exit();
            })
            .catch(err => console.error("ভুল হয়েছে:", err));
    } else {
        console.log("কোনো ডুপ্লিকেট ডেটা পাওয়া যায়নি।");
        process.exit();
    }
});
