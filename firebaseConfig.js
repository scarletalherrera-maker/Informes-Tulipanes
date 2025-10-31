// firebaseConfig.js
// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDjf3PjspEmgs8EgJvLgJ-fEGDfGy-t5c8",
  authDomain: "tulipanes-f1c41.firebaseapp.com",
  databaseURL: "https://tulipanes-f1c41-default-rtdb.firebaseio.com",
  projectId: "tulipanes-f1c41",
  storageBucket: "tulipanes-f1c41.firebasestorage.app",
  messagingSenderId: "162875776177",
  appId: "1:162875776177:web:f3fc57473d61871a16d690"
};

// Inicialización única de Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Exporta los servicios necesarios
export const auth = firebase.auth();
export const database = firebase.database();  // <- Esta es la exportación que necesitas
