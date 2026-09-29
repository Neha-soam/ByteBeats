/* Minimal service worker: only exists so Chrome/Edge will treat this page as installable. */
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => self.clients.claim());
self.addEventListener("fetch", () => {}); // no caching; required by some browsers for the install prompt