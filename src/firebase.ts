import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAqwokWsxiXPy4F590HLLx9r-DtTWbuXxU",
    authDomain: "cmg-bidding-tracker.firebaseapp.com",
    projectId: "cmg-bidding-tracker",
    storageBucket: "cmg-bidding-tracker.firebasestorage.app",
    messagingSenderId: "496302719333",
    appId: "1:496302719333:web:c8702a137c8e8e4d6be18c",
    measurementId: "G-9SYDTGL5L8",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
