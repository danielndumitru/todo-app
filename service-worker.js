const CACHE_NAME = "todo-app-v1";
const APP_VERSION = "1.0.14";
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

// Install event - caching assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching app assets");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error("Cache installation failed:", error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - cleaning up old caches and checking for updates
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Check for app updates
      checkForUpdates(),
    ])
  );
  // Tell the active service worker to take immediate control of all open clients
  self.clients.claim();
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

// Version check and update function
self.addEventListener("message", (event) => {
  if (event.data === "CHECK_VERSION") {
    checkForUpdates();
  }
});

// Function to check for updates
async function checkForUpdates() {
  try {
    const response = await fetch(
      "./version.json?nocache=" + new Date().getTime()
    );
    const data = await response.json();

    if (data.version !== APP_VERSION) {
      // Notify all clients about the update
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: "UPDATE_AVAILABLE",
          version: data.version,
          currentVersion: APP_VERSION,
        });
      });
    }
  } catch (error) {
    console.error("Version check failed:", error);
  }
}

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
