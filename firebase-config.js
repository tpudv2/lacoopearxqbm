// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyCZo5zFFr9mmg71QsLS8M-xW6gLsL7WoE",
  authDomain: "lacoopear-qbm.firebaseapp.com",
  projectId: "lacoopear-qbm",
  storageBucket: "lacoopear-qbm.firebasestorage.app",
  messagingSenderId: "293492010929",
  appId: "1:293492010929:web:52b00473e8900621025798"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

window.db = db;
window.auth = auth;

console.log("✅ Firebase conectado correctamente");