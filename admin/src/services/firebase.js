import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyDNmfIyrs7opmMLAGlBOIip9Luj4pP6I70",
  authDomain: "vscinventory-2b150.firebaseapp.com",
  projectId: "vscinventory-2b150",
  storageBucket: "vscinventory-2b150.firebasestorage.app",
  messagingSenderId: "880885461103",
  appId: "1:880885461103:web:bc220ba3d928dd98ba9d9a",
  measurementId: "G-WJVK07QKLH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check with reCAPTCHA v3
export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LcSbDgtAAAAAD3S-dG4qMTjp85YqOudm21wWJGj'),
  isTokenAutoRefreshEnabled: true
});

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
    } else if (err.code == 'unimplemented') {
      console.warn("The current browser does not support all of the features required to enable persistence.");
    }
  });

export default app;
