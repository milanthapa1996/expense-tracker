import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDCK_NbBmsMWmicFGW4hG90PqMDk5SgVdI",
    authDomain: "khatapana-12afa.firebaseapp.com",
    projectId: "khatapana-12afa",
    storageBucket: "khatapana-12afa.appspot.com",
    messagingSenderId: "1085103697514",
    appId: "1:1085103697514:web:ced6056aded05935b62413",
    measurementId: "G-XMWQWT07X4",
  };

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };