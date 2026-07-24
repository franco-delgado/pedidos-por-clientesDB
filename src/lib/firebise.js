import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAHHkzTkVbi1AO9OQs7y6gYZCcSTuc768c",
  authDomain: "delgadowebs-firebase.firebaseapp.com",
  projectId: "delgadowebs-firebase",
  storageBucket: "delgadowebs-firebase.appspot.com",
  messagingSenderId: "401940367025",
  appId: "1:401940367025:web:4394d9d27dc2b070b54490"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
