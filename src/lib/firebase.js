import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Las claves web de Firebase no son secretas (la seguridad real la dan las Reglas de Firestore/Storage).
const firebaseConfig = {
  apiKey: "AIzaSyAHHkzTkVbilAO9OQs7y6GYZCcSTuc768c",
  authDomain: "delgadowebs-firebase.firebaseapp.com",
  projectId: "delgadowebs-firebase",
  storageBucket: "delgadowebs-firebase.firebasestorage.app",
  messagingSenderId: "401940367025",
  appId: "1:401940367025:web:4394d9d27dc2b070b54490",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Autenticación anónima: le da a cada dispositivo un request.auth != null válido
// para las reglas de seguridad, sin pedir usuario ni contraseña.
// App.jsx espera a que esto termine antes de mostrar cualquier pantalla.
let autenticacion = null;
export function asegurarAutenticacion() {
  if (!autenticacion) {
    autenticacion = (async () => {
      await auth.authStateReady();
      if (auth.currentUser) return auth.currentUser;
      const credencial = await signInAnonymously(auth);
      return credencial.user;
    })().catch((error) => {
      autenticacion = null; // permite reintentar
      throw error;
    });
  }
  return autenticacion;
}
