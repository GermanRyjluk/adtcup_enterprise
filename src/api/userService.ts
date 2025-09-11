import { doc, getDoc, DocumentData } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

/**
 * @file userService.ts
 * Questo file centralizza tutte le interazioni con la collezione 'users' in Firestore.
 */

/**
 * Recupera il documento del profilo di un utente da Firestore.
 *
 * @param uid L'ID univoco dell'utente (proveniente da Firebase Auth).
 * @returns Una Promise che si risolve con i dati del profilo utente se trovato, altrimenti null.
 */
export const getUserProfile = async (
  uid: string
): Promise<DocumentData | null> => {
  try {
    // Crea un riferimento al documento specifico dell'utente nella collezione 'users'.
    const userDocRef = doc(db, "users", uid);

    // Esegue la chiamata per ottenere i dati del documento.
    const userDoc = await getDoc(userDocRef);

    // Controlla se il documento esiste.
    if (userDoc.exists()) {
      // Se esiste, ritorna i dati contenuti nel documento.
      return userDoc.data();
    } else {
      // Se il documento non esiste, significa che il profilo non è stato ancora creato.
      console.warn(`Nessun profilo trovato per l'utente con UID: ${uid}`);
      return null;
    }
  } catch (error) {
    // Gestisce eventuali errori durante la chiamata a Firestore.
    console.error("Errore durante il recupero del profilo utente:", error);
    // Rilancia l'errore o lo gestisce come preferisci. In questo caso, ritorniamo null.
    return null;
  }
};

// In futuro, potremmo aggiungere altre funzioni qui, come:
// export const updateUserProfile = async (uid, data) => { ... };
// export const checkUsernameExists = async (username) => { ... };
