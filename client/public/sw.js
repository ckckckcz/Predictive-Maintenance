self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const options = {
        body: payload.body,
        icon: '/notification.png',
        badge: '/notification.png',
        data: payload.data,
        vibrate: [100, 50, 100],
      };
      event.waitUntil(
        self.registration.showNotification(payload.title || 'Greenfields Alarm', options)
      );
    } catch (e) {
      console.error('Error parsing push payload:', e);
      // Fallback text push
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('Greenfields Alarm', {
          body: text,
          icon: '/notification.png',
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  let targetUrl = '/dashboard/audit';
  if (event.notification.data && event.notification.data.incident_id) {
    targetUrl = '/dashboard/audit';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
