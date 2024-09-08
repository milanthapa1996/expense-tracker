import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDCK_NbBmsMWmicFGW4hG90PqMDk5SgVdI",
  authDomain: "khatapana-12afa.firebaseapp.com",
  projectId: "khatapana-12afa",
  storageBucket: "khatapana-12afa.appspot.com",
  messagingSenderId: "1085103697514",
  appId: "1:1085103697514:web:ced6056aded05935b62413",
  measurementId: "G-XMWQWT07X4",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
