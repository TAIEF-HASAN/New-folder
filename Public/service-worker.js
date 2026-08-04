const CACHE_NAME = 'kpm-app-cache-v1';
const ASSETS_TO_CACHE = [
  '/Public/',
  '/Public/index.html',
  '/Public/manifest.json',
  '/Public/admin.html', // 🎯 [CRITICAL FIX]: অ্যাডমিন প্যানেল ফাইলটি অফলাইন ক্যাশ তালিকায় যুক্ত করা হলো
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
  // শুধুমাত্র GET রিকোয়েস্ট এবং এইচটিএমএল/অ্যাসেট রিকোয়েস্ট ইন্টারসেপ্ট করা
  if (event.request.method === 'GET') {
    event.respondWith(
      // ১. সবার আগে লোকাল সার্ভিস ওয়ার্কার ক্যাশ বক্সে ফাইলটি খোঁজা
      caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
        
        // ২. ক্যাশে ফাইলটি পাওয়া গেলে সাথে সাথে ওটাই রিটার্ন করবে (জিরো নেটওয়ার্ক ল্যাগ)
        if (cachedResponse) {
          return cachedResponse;
        }

        // ৩. ক্যাশে না থাকলে ব্যাকগ্রাউন্ডে নেটওয়ার্ক থেকে টানার চেষ্টা করবে
        return fetch(event.request).then((networkResponse) => {
          // যদি ভ্যালিড রেসপন্স আসে, তবে ওটাকে ফিউচারের জন্য ক্যাশে সেভ করে রাখবে
          if (networkResponse && networkResponse.status === 200) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        }).catch(() => {
          // 🚨 [FALLBACK GUARD]: যদি ইন্টারনেট একবারে বন্ধ থাকে এবং নেটওয়ার্ক টোটাল ফেইল করে
          if (event.request.headers.get('accept').includes('text/html')) {
            // জোর করে আমাদের ক্যাশ করা মেইন ফাইলগুলো স্ক্রিনে ফিড করা
            return caches.match('index.html') || caches.match('admin.html');
          }
        });
      })
    );
  }
});

