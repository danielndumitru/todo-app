const CACHE_NAME = "todo-app-cache-v1";
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
let currentVersion = null; // Store the current version

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

// Install event (caching assets and handling version)
self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch("./version.json")
      .then((response) => response.json())
      .then((data) => {
        const newVersion = data.cacheVersion; // Update to use cacheVersion
        self.version = newVersion; // Store the new version
        return caches.open(CACHE_NAME).then((cache) => {
          console.log("Opened cache");
          return cache.addAll(urlsToCache).catch((error) => {
            console.error("Failed to cache:", error);
          });
        });
      })
      .catch((error) => {
        console.error("Failed to fetch version.json:", error);
      })
  );
});

// Activate event (clear old caches and notify clients)
self.addEventListener("activate", (event) => {
  const currentCacheName = `${CACHE_NAME}-${self.version}`;

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // Find and delete old caches that don't match the current version
        const cachesToDelete = cacheNames.filter((cacheName) => {
          return (
            cacheName.startsWith(CACHE_NAME) && cacheName !== currentCacheName
          );
        });
        return Promise.all(
          cachesToDelete.map((cacheName) => {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        // After clearing old caches, notify clients about the new version
        self.clients.claim().then(() => {
          self.clients
            .matchAll({ includeUncontrolled: true })
            .then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: "NEW_VERSION",
                  version: self.version,
                });
              });
            });
        });
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

function checkForUpdates() {
  fetch("./version.json", { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      if (currentVersion && currentVersion !== data.cacheVersion) {
        // Notify all clients about the update
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "UPDATE_AVAILABLE",
              version: data.cacheVersion,
            });
          });
        });
      }
      currentVersion = data.cacheVersion; // Update the current version variable
    })
    .catch((error) => console.error("Version check failed:", error));
}
