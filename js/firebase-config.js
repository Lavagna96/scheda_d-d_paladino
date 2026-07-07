/*
 * Configurazione Firebase.
 *
 * Finché resta `null` l'app funziona in solo-locale (localStorage),
 * identica a prima: nessuna funzione cloud viene attivata.
 *
 * Per attivare il cloud: crea un progetto su https://console.firebase.google.com,
 * aggiungi una "Web app" e incolla qui l'oggetto firebaseConfig, es.:
 *
 * window.FIREBASE_CONFIG = {
 *   apiKey: "...",
 *   authDomain: "xxx.firebaseapp.com",
 *   projectId: "xxx",
 *   storageBucket: "xxx.appspot.com",
 *   messagingSenderId: "...",
 *   appId: "..."
 * };
 */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAj4geVeoIHMzh54lGIsfVQvQ8cCU1D8v8",
  authDomain: "scheda-dnd-8d651.firebaseapp.com",
  projectId: "scheda-dnd-8d651",
  storageBucket: "scheda-dnd-8d651.firebasestorage.app",
  messagingSenderId: "646076622919",
  appId: "1:646076622919:web:4ac594f8179873e4342962"
};
