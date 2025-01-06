const CACHE_NAME = "todo-app-cache-v1";
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 1 hour

// Files to cache
const urlsToCache = [
  "/todo-app/",
  "/todo-app/index.html",
  "/todo-app/style.css",
  "/todo-app/app.js",
  "/todo-app/manifest.json",
  "/todo-app/icons/icon-192x192.webp",
  "/todo-app/icons/icon-512x512.webp",
  // Add other assets that need caching
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Check for updates
function checkForUpdates() {
  fetch("./version.json", { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      if (self.currentVersion && self.currentVersion !== data.version) {
        // Notify all clients about the update
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "UPDATE_AVAILABLE",
              version: data.version,
            });
          });
        });
      }
      // Do not update the version here; wait for user confirmation
      // self.currentVersion = data.version; // Remove this line
    })
    .catch((error) => console.error("Version check failed:", error));
}

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data === "CHECK_VERSION") {
    checkForUpdates();
  }
});

// If you continue to experience issues, consider adding some logging to your service worker to help debug:
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache).catch((error) => {
        console.error("Failed to cache:", error);
      });
    })
  );
});

// Periodic version check
setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);
