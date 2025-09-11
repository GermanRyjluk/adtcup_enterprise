import { createContext } from "react";
import { User } from "firebase/auth";

/**
 * @interface AuthContextType
 * Definisce la "forma" dei dati che il nostro AuthContext fornirà ai componenti.
 * Questo "contratto" assicura che TypeScript sappia quali proprietà sono disponibili.
 */
export interface AuthContextType {
  /**
   * L'oggetto utente fornito da Firebase Auth.
   * È `null` se l'utente non è loggato.
   */
  user: User | null;

  /**
   * Un flag booleano che indica se l'utente ha completato il suo profilo
   * creando il documento corrispondente su Firestore.
   */
  isProfileComplete: boolean;

  /**
   * Funzione per aggiornare lo stato globale e indicare che il gioco è iniziato.
   * Verrà chiamata dalla schermata PreGame.
   */
  startGame: () => void;

  /**
   * Funzione per aggiornare lo stato globale dopo che il profilo è stato
   * salvato con successo su Firestore.
   */
  completeProfile: () => void;
}

/**
 * Creazione del Context.
 * Lo inizializziamo con `null` e forniamo il tipo definito sopra.
 * Il valore reale verrà fornito dal Provider nel file App.tsx.
 */
export const AuthContext = createContext<AuthContextType | null>(null);
