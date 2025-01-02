// 1. Update cache versioning to match app version
const BASE_CACHE_NAME = "todo-app-v";
let CACHE_NAME = BASE_CACHE_NAME + "1.0.173"; // Will be updated from version.json
let APP_VERSION = "1.0.173"; // Will be updated from version.json

// 2. Assets to cache
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./version.json",
  "./background/pawel-czerwinski-ZkzobNDayXo-unsplash.webp",
  "./icons/icon-72x72.webp",
  "./icons/icon-96x96.webp",
  "./icons/icon-128x128.webp",
  "./icons/icon-144x144.webp",
  "./icons/icon-152x152.webp",
  "./icons/icon-192x192.webp",
  "./icons/icon-384x384.webp",
  "./icons/icon-512x512.webp",
];

// 3. Version check and cache update function
async function updateVersionInfo() {
  try {
    const response = await fetch(
      "./version.json?nocache=" + new Date().getTime()
    );
    const data = await response.json();

    // Update both APP_VERSION and CACHE_NAME
    APP_VERSION = data.version;
    CACHE_NAME = data.cacheVersion;
    return data;
  } catch (error) {
    console.error("Failed to fetch version info:", error);
    return null;
  }
}

// 4. Install event - caching assets
self.addEventListener("install", async (event) => {
  event.waitUntil(
    (async () => {
      // Update version info before caching
      await updateVersionInfo();

      try {
        const cache = await caches.open(CACHE_NAME);
        console.log("Caching app assets for version:", APP_VERSION);
        await cache.addAll(ASSETS_TO_CACHE);
        await self.skipWaiting(); // Force activation
      } catch (error) {
        console.error("Cache installation failed:", error);
      }
    })()
  );
});

// 5. Activate event - cleaning up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName.startsWith(BASE_CACHE_NAME) &&
              cacheName !== CACHE_NAME
            ) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim(),
      // Check for updates
      checkForUpdates(),
    ])
  );
});

// 6. Function to check for updates
async function checkForUpdates() {
  try {
    const versionInfo = await updateVersionInfo();
    if (!versionInfo) return;

    const currentCache = await caches.has(CACHE_NAME);

    // Only notify if version mismatch or cache missing
    if (versionInfo.version !== APP_VERSION || !currentCache) {
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: "UPDATE_AVAILABLE",
          version: versionInfo.version,
          currentVersion: APP_VERSION,
          cacheStatus: currentCache ? "outdated" : "missing",
        });
      });
    }
  } catch (error) {
    console.error("Version check failed:", error);
  }
}

// 7. Force update function
async function forceUpdate() {
  try {
    const versionInfo = await updateVersionInfo();
    if (!versionInfo) return;

    // Delete all existing caches
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName.startsWith(BASE_CACHE_NAME)) {
          return caches.delete(cacheName);
        }
      })
    );

    // Create new cache with current version
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS_TO_CACHE);

    // Notify clients of successful update
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "UPDATE_COMPLETED",
        version: versionInfo.version,
      });
    });
  } catch (error) {
    console.error("Force update failed:", error);
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "UPDATE_FAILED",
        error: error.message,
      });
    });
  }
}

// Push notification event handler
self.addEventListener("push", (event) => {
  if (Notification.permission !== "granted") {
    console.log("Notification permission not granted");
    return;
  }

  const options = {
    body: event.data.text(),
    icon: "./icons/icon-192x192.webp",
    badge: "./icons/icon-72x72.webp",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1",
    },
    actions: [
      {
        action: "explore",
        title: "Open App",
      },
      {
        action: "close",
        title: "Close",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("Todo App", options));
});

// Notification click event handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "update") {
    // Handle update action
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll();
        if (clients.length > 0) {
          clients[0].postMessage({ type: "PERFORM_UPDATE" });
        }
      })()
    );
  } else if (event.action === "explore") {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
    );
  }
});

// Fetch event - serving cached content with network fallback
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if found
      if (response) {
        return response;
      }

      // Clone the request because it can only be used once
      const fetchRequest = event.request.clone();

      // Make network request and cache the response
      return fetch(fetchRequest)
        .then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response because it can only be used once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return a custom offline page or fallback content
          return caches.match("./index.html");
        });
    })
  );
});

// Handle background sync for todos
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-todos") {
    event.waitUntil(
      // Implement todo synchronization logic here
      Promise.resolve()
    );
  }
});
