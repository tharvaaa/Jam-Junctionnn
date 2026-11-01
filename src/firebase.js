// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDG6UNnnw-FS_nawQznI68ZvoBUV-HJD-g",
  authDomain: "jam-junction-a1a99.firebaseapp.com",
  projectId: "jam-junction-a1a99",
  storageBucket: "jam-junction-a1a99.firebasestorage.app",
  messagingSenderId: "966039032678",
  appId: "1:966039032678:web:31828c379b7d072a5c2ea7",
  measurementId: "G-2QHE8XVPL8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);