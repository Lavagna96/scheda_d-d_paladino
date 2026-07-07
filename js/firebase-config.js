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
window.FIREBASE_CONFIG = null;
