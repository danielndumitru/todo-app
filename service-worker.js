const CACHE_NAME = "todo-app-cache-v1";
const VERSION_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

// Files to cache
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icons/icon-192x192.webp",
  "/icons/icon-512x512.webp",
  // Add other assets that need caching
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Ensure new service worker activates immediately
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );
});

// Fetch event
self.addEventListener("fetch", (event) => {
  // Special handling for version.json
  if (event.request.url.includes("version.json")) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => response.clone())
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Handle version checks
let currentVersion = null;

function checkForUpdates() {
  fetch("./version.json", { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      if (currentVersion && currentVersion !== data.version) {
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
      currentVersion = data.version;
    })
    .catch((error) => console.error("Version check failed:", error));
}

// Check version when service worker activates
self.addEventListener("activate", (event) => {
  event.waitUntil(checkForUpdates());
});

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data === "CHECK_VERSION") {
    checkForUpdates();
  } else if (event.data === "FORCE_UPDATE") {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
        .then(() => {
          // Notify clients that update is complete
          return self.clients.matchAll();
        })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: "UPDATE_COMPLETED" });
          });
        })
        .catch((error) => {
          console.error("Update failed:", error);
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "UPDATE_FAILED",
                error: error.message,
              });
            });
          });
        })
    );
  }
});

// Periodic version check
setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);
