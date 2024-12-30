const CACHE_NAME = "todo-app-v2";
let APP_VERSION = "1.0.0"; // Default version, will be updated

// Function to fetch current version
async function updateAppVersion() {
  try {
    const response = await fetch(
      "./version.json?nocache=" + new Date().getTime()
    );
    const data = await response.json();
    APP_VERSION = data.version;
    console.log("App version updated to:", APP_VERSION);
  } catch (error) {
    console.error("Failed to fetch version:", error);
  }
}

// Update version when service worker starts
updateAppVersion();

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

// Install event - cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Activate new service worker immediately
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Push notification event handler
self.addEventListener("push", (event) => {
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

  if (event.action === "explore") {
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

// Fetch event - serve from cache, then network
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("version.json")) {
    // Always fetch version.json from network
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        // Check for updates in background
        fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse);
          });
        });
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Cache the network response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});

// Check for updates
self.addEventListener("message", (event) => {
  if (event.data === "CHECK_VERSION") {
    // First update our APP_VERSION
    updateAppVersion().then(() => {
      fetch("./version.json?nocache=" + new Date().getTime())
        .then((response) => response.json())
        .then((data) => {
          if (data.version !== APP_VERSION) {
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: "UPDATE_AVAILABLE",
                  version: data.version,
                  currentVersion: APP_VERSION,
                });
              });
            });
          }
        })
        .catch((error) => console.error("Version check failed:", error));
    });
  }
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
