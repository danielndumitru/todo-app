// Global variables
const CACHE_NAME_PREFIX = "todo-app-cache-";
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 60 * 60 * 1000 = Check every hour (you can adjust this)

// Files to cache
const urlsToCache = [
  "/todo-app/",
  "/todo-app/index.html",
  "/todo-app/style.css",
  "/todo-app/app.js",
  "/todo-app/manifest.json",
  "/todo-app/icons/icon-192x192.webp",
  "/todo-app/icons/icon-512x512.webp",
  "/todo-app/icons",
  // Add other assets that need caching
];

// Install event
// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     fetch("./version.json")
//       .then((response) => response.json())
//       .then((data) => {
//         const newVersion = data.cacheVersion;
// self.version = newVersion; // Store the new version
// const cacheName = `${CACHE_NAME_PREFIX}${self.version}`;

// Cache assets during the install event
//         caches.open(cacheName).then((cache) => {
//           console.log("Caching assets for version:", self.version);
//           return cache.addAll(urlsToCache).catch((error) => {
//             console.error("Failed to cache:", error);
//           });
//         });
//       })
//   );
// });

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch("./version.json")
      .then((response) => response.json())
      .then((data) => {
        const newVersion = data.cacheVersion;
        self.version = newVersion;
        const cacheName = `${CACHE_NAME_PREFIX}${self.version}`;

        caches.open(cacheName).then((cache) => {
          console.log("Caching assets for version:", self.version);
          return cache.addAll(urlsToCache).catch((error) => {
            console.error("Failed to cache:", error);
          });
        });
      })
      .catch((error) => {
        console.error(
          "Failed to fetch version.json, using fallback version:",
          error
        );
        // Fallback logic: Use the previously cached version
      })
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  const currentCacheName = `${CACHE_NAME_PREFIX}${self.version}`;

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // Delete caches that don't match the current version
        const cachesToDelete = cacheNames.filter((cacheName) => {
          return (
            cacheName.startsWith(CACHE_NAME_PREFIX) &&
            cacheName !== currentCacheName
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
        // Ensure clients are notified about the new version
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
// self.addEventListener("fetch", (event) => {
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       return response || fetch(event.request);
//     })
//   );
// });

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("api")) {
    // Handle API requests differently, e.g., cache only the response with a max-age strategy
    event.respondWith(
      fetch(event.request).then((response) => {
        // Cache the response if it's valid
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
          });
        }
        return response;
      })
    );
  } else {
    // Standard cache-first logic for static assets
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Check for updates
function checkForUpdates() {
  fetch("./version.json", { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      if (self.version && self.version !== data.cacheVersion) {
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
      self.version = data.cacheVersion; // Update the current version variable
    })
    .catch((error) => console.error("Version check failed:", error));
}

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data === "CHECK_VERSION") {
    checkForUpdates();
  }
});

// Periodic version check
setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);
