// Firebase Cloud Messaging Service Worker for IPAM Alumni Platform
// Project: auratrade-p93c
/* eslint-disable no-undef */

importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyBiLw4ytLwtNmhjhDixxd2yGq8qo5UAf0I",
  authDomain: "auratrade-p93c.firebaseapp.com",
  projectId: "auratrade-p93c",
  storageBucket: "auratrade-p93c.firebasestorage.app",
  messagingSenderId: "570831339769",
  appId: "1:570831339769:web:594df89ce062124522e228",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw] Received background message:", payload);

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    "IPAM Alumni Association";

  const body =
    payload.notification?.body ||
    payload.data?.message ||
    "You have a new announcement from IPAM Alumni.";

  const options = {
    body,
    icon: payload.notification?.icon || "/images/ipam-logo.png",
    badge: "/images/ipam-logo.png",
    data: {
      actionUrl: payload.data?.actionUrl || payload.fcmOptions?.link || "/alumni/notifications",
      ...payload.data,
    },
    tag: payload.data?.type || "ipam-notification",
    renotify: true,
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const actionUrl = event.notification.data?.actionUrl || "/alumni/notifications";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If a window is already open at this site, focus it and navigate
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(actionUrl);
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(actionUrl);
        }
      })
  );
});

