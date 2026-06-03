// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyCZo5zFFr9mmg71QsLS8M-xW6gLsL7WoE",
  authDomain: "lacoopear-qbm.firebaseapp.com",
  projectId: "lacoopear-qbm",
  storageBucket: "lacoopear-qbm.firebasestorage.app",
  messagingSenderId: "293492010929",
  appId: "1:293492010929:web:52b00473e8900621025798"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase inicializado correctamente");
} else {
  console.log("Firebase ya estaba inicializado");
}

const db = firebase.firestore();
window.db = db;