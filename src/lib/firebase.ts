// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTadMjr9cGGxyK-9T6tJXR50sl4I8b2kw",
  authDomain: "zimmah-9b98f.firebaseapp.com",
  projectId: "zimmah-9b98f",
  storageBucket: "zimmah-9b98f.appspot.com",
  messagingSenderId: "749551053297",
  appId: "1:749551053297:web:34f6b6b823cd8cc369bc50",
  measurementId: "G-4D7G02SYHG"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let analytics;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}


export { app, analytics };
