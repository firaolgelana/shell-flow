// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyArwCcj3IKW9dnkZg71a3p9r-9q5BOUnXY",
    authDomain: "shellflow.firebaseapp.com",
    projectId: "shellflow",
    storageBucket: "shellflow.firebasestorage.app",
    messagingSenderId: "1076778314730",
    appId: "1:1076778314730:web:927dc627a661b66394a093",
    measurementId: "G-XQPFS8KPNX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);

export { app, analytics, auth };