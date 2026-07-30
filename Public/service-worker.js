const CACHE_NAME = 'kpm-app-cache-v1';
const ASSETS_TO_CACHE = [
  '/Public/',
  '/Public/index.html',
  '/Public/manifest.json',
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
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // যদি ফাইল ক্যাশে থাকে তবে ওটাই দেখাবে, না থাকলে ইন্টারনেট থেকে নেবে
      return cachedResponse || fetch(event.request);
    })
  );
});
