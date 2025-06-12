importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyDi2g2jOi9coqrHgjF8Ojg_5mPKC1FNs1k",
  authDomain: "inimbleapp.firebaseapp.com",
  projectId: "inimbleapp",
  storageBucket: "inimbleapp.firebasestorage.app",
  messagingSenderId: "562152489018",
  appId: "1:562152489018:web:10df1fd86381626629f503",
};
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.clients
    .matchAll({ includeUncontrolled: true, type: "window" })
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ message: payload.data });
      });
    });
});