// Import the functions you need from the SDKs you need
import { getAuth } from "@firebase/auth";
import { initializeApp } from "@firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDV3f9T58CfM-bnyTG1rs2napGxKp3Z1lY",
  authDomain: "anugerahdecal-7e2db.firebaseapp.com",
  projectId: "anugerahdecal-7e2db",
  storageBucket: "anugerahdecal-7e2db.firebasestorage.app",
  messagingSenderId: "14604092088",
  appId: "1:14604092088:web:f8b106635d5d48f985ea4d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };