'use strict';
self.addEventListener('push', function(event) {
    console.log(event.data.json());
    const message = event.data.json();
    const options = {
        body: message.body,
        data: message.uri,
        icon: '/assets/media/img/push/icon.png',
        badge: '/assets/media/img/push/badge.png',
        actions: [{
            action: 'Detail',
            title: 'Detalles'
        }]
    };
    event.waitUntil(self.registration.showNotification(message.title, options));
});

self.addEventListener('notificationclick', function(event) {
    console.log('Notification click Received.', event.notification.data);
    event.notification.close();
    if (event.notification.data != "") {
        event.waitUntil(clients.openWindow(event.notification.data));
    }
});
/*
//set cache
self.addEventListener("install", function(event) {
    event.waitUntil(caches.open("cachestore-v1").then(function(cache) {
        return cache.addAll([
            "/index.html",
            "/assets/bower_components/bootstrap/dist/css/bootstrap.min.css",
            "/assets/bower_components/font-awesome/css/font-awesome.min.css",
            "/app/main.css",
			"/assets/@ionic/pwa-elements/1.5.2/dist/ionicpwaelements/ionicpwaelements.esm.js",
			"/assets/@ionic/pwa-elements/1.5.2/dist/ionicpwaelements/ionicpwaelements.js",
			"/assets/bower_components/jquery/dist/jquery.min.js",
			"/assets/bower_components/bootstrap/dist/js/bootstrap.min.js",
			"/assets/bower_components/angular/angular.min.js",
			"/assets/js/qrcode.min.js",
			"/assets/js/instascan.min.js",
			"/assets/js/socket.io-2.3.0.js",
			"/assets/js/jcryption.js";
			"/assets/js/moment.js",
			"/assets/js/moment-with-locales.js",
			"/assets/js/capacitor.js",
			"/assets/js/trascender.js"
        ]);
    }));
});

//refresh cache for new version
self.addEventListener('activate', function(event) {
    event.waitUntil(caches.keys().then(cacheNames =>
        Promise.all(cacheNames
            .map(c => c.split('-'))
            .filter(c => c[0] === 'cachestore')
            .filter(c => c[1] !== 'v1')
            .map(c => caches.delete(c.join('-')))
        )
    ));
});

//cache first
self.addEventListener("fetch", function(event) {
    event.respondWith(caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
    }));
});*/