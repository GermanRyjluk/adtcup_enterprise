import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  //@ts-ignore
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Le tue credenziali Firebase, come le hai fornite.
const firebaseConfig = {
  apiKey: "AIzaSyDcPpCCojAhcWXn0TsaJFEnMK2OMCZ5ve0",
  authDomain: "adt-cup.firebaseapp.com",
  projectId: "adt-cup",
  storageBucket: "adt-cup.appspot.com",
  messagingSenderId: "432629975377",
  appId: "1:432629975377:web:0e0bc07644f8c2b63cab70",
};

// Inizializza l'applicazione Firebase
const app = initializeApp(firebaseConfig);

/**
 * Inizializza il servizio di Autenticazione con la persistenza esplicita.
 * Questo è il modo corretto e robusto per garantire che lo stato di login
 * venga salvato sul dispositivo dell'utente.
 */
initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Ora possiamo esportare le istanze dei servizi che verranno usate nel resto dell'app.
export const auth = getAuth(app);
export const db = getFirestore(app);
