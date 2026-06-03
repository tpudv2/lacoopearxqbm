// firebase-config.js - Versión Compat (la que necesita tu proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyCzo5zFFr9mmg71QsSLM8-xWw6gLsL7WoE",
  authDomain: "lacoopear-qbm.firebaseapp.com",
  projectId: "lacoopear-qbm",
  storageBucket: "lacoopear-qbm.firebasestorage.app",
  messagingSenderId: "293492010929",
  appId: "1:293492010929:web:52b00473e8900621025790"
};

// Inicializar Firebase (versión compat)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase inicializado correctamente");
}

const db = firebase.firestore();
window.db = db; // Para que app.js pueda usarlo