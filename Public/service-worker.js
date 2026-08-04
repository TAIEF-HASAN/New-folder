const CACHE_NAME = 'kpm-app-cache-v1';
const ASSETS_TO_CACHE = [
  '/', // রুট পাথ
  '/Public/',
  '/Public/index.html',  // কাস্টমার মেইন ফাইল
  '/Public/manifest.json',
  '/Public/admin.html', // 🎯 [CRITICAL FIX]: অ্যাডমিন প্যানেল ফাইলটি অফলাইন ক্যাশ তালিকায় যুক্ত করা হলো    // অ্যাডমিন মেইন ফাইল
  'https://img.icons8.com/fluency/192/000000/electricity.png',
  'https://img.icons8.com/fluency/512/000000/electricity.png'
];


// ১. অ্যাপ ইনস্টল হওয়ার সময় প্রয়োজনীয় ফাইলগুলো ক্যাশ (Cache) করা
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('KPM App: Caching core assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ২. পুরোনো ক্যাশ ফাইল পরিষ্কার করা
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('KPM App: Clearing old cache...');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// ৩. অফলাইন মোডেও যেন অ্যাপটি ওপেন হয়, তার জন্য ক্যাশ থেকে ডেটা রিড করা
// ====== service-worker.js এর ৩ নম্বর fetch পার্টটি এভাবে আপডেট করুন ======

self.addEventListener('fetch', (event) => {
  // শুধুমাত্র GET রিকোয়েস্টগুলো ইন্টারসেপ্ট করা
  if (event.request.method === 'GET') {
    event.respondWith(
      // প্রথমে ক্যাশ মেমোরিতে নিখুঁতভাবে ফাইল খোঁজা
      caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
        // ১. ক্যাশে ফাইল পাওয়া গেলে সার্ভারের জন্য ১ মিলি-সেকেন্ডও অপেক্ষা না করে ওটাই রিটার্ন করবে
        if (cachedResponse) {
          return cachedResponse;
        }

        // ২. ক্যাশে না থাকলে ইন্টারনেট থেকে টেনে আনার চেষ্টা করবে
        return fetch(event.request).then((networkResponse) => {
          // সাকসেসফুল রেসপন্স আসলে ফিউচারের জন্য ক্যাশে ব্যাকগ্রাউন্ডে সেভ করা
          if (networkResponse && networkResponse.status === 200) {
            let responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // 🎯 [THE CRITICAL CATCH FALLBACK]: ইন্টারনেট টোটাল বন্ধ থাকলে এই ক্যাচ ব্লক প্রমিজ রিজেক্ট হতে দেবে না
          // রিকোয়েস্টের ইউআরএল চেক করে অফলাইন ডাইরেক্ট ফাইল ফিড করা
          if (event.request.url.includes('admin.html')) {
            return caches.match('admin.html');
          }
          return caches.match('index.html') || caches.match('/');
        });
      })
    );
  }
});


