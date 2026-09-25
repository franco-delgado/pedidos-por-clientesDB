import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAHHkzTkVbilAO9OQs7y6GYZCcSTuc768c",
  authDomain: "delgadowebs-firebase.firebaseapp.com",
  projectId: "delgadowebs-firebase",
  // Corregido: este es el bucket real que muestra la consola de Firebase
  storageBucket: "delgadowebs-firebase.firebasestorage.app",
  messagingSenderId: "401940367025",
  appId: "1:401940367025:web:4394d9d27dc2b070b54490"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Nos autenticamos de forma anónima automáticamente al cargar la app.
// Esto le da a cada visitante/admin un request.auth != null válido,
// que es lo que van a exigir las reglas de Storage y Firestore.
// No requiere login ni contraseña: es solo una identidad técnica para
// que las reglas de seguridad tengan algo contra qué validar.
let autenticacionLista = null;
export function asegurarAutenticacion() {
  if (!autenticacionLista) {
    autenticacionLista = new Promise((resolve, reject) => {
      const quitarListener = onAuthStateChanged(auth, (usuario) => {
        if (usuario) {
          quitarListener();
          resolve(usuario);
        }
      }, reject);

      signInAnonymously(auth).catch((error) => {
        console.error("Error al autenticar de forma anónima:", error);
        reject(error);
      });
    });
  }
  return autenticacionLista;
}
