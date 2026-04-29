const axios = require('axios');
const fs = require('fs');

async function checkElectricity() {
    const timestamp = new Date().toLocaleString("en-BD", {timeZone: "Asia/Dhaka"});
    try {
        // গুগলকে পিং করে চেক করবে ইন্টারনেট আছে কি না
        await axios.get('https://google.com', { timeout: 5000 });
        console.log(`[${timestamp}] বিদ্যুৎ আছে।`);
    } catch (error) {
        // যদি কানেক্ট করতে না পারে, তবে ফাইলে লিখে রাখবে
        const message = `[${timestamp}] বিদ্যুৎ নেই অথবা ইন্টারনেট সংযোগ বিচ্ছিন্ন।\n`;
        fs.appendFileSync('power_log.txt', message);
        console.log(message);
    }
}

// প্রতি ৫ মিনিট পরপর চেক করবে
setInterval(checkElectricity, 5 * 60 * 1000);
checkElectricity();
