import {
  doc,
  getDoc,
  DocumentData,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
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

/**
 * Aggiorna lo stato di gioco di un utente su Firestore.
 * @param uid L'ID dell'utente da aggiornare.
 * @param gameStatus L'oggetto con i campi da aggiornare (es. { isGameStarted: true }).
 */
export const updateUserBookingStatus = async (
  uid: string,
  gameStatus: { isGameStarted: boolean },
  eventID: string
): Promise<void> => {
  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, gameStatus);
};

/* @param uid L'ID dell'utente.
 * @param eventId L'ID dell'evento che sta iniziando.
 */
export const startGameForUser = async (
  uid: string,
  eventId: string
): Promise<void> => {
  // 1. Crea un'operazione batch
  const batch = writeBatch(db);

  // 2. Definisci i riferimenti ai due documenti che dobbiamo modificare
  const userDocRef = doc(db, "users", uid);
  const bookingDocRef = doc(db, "users", uid);

  // 3. Operazioni di aggiornamento al batch
  // Operazione A: Aggiorna il profilo utente principale per impostare l'evento corrente
  batch.update(userDocRef, {
    currentEventId: eventId,
  });

  // Operazione B: Aggiorna il documento di prenotazione per indicare che il gioco è iniziato
  batch.update(bookingDocRef, {
    isGameStarted: true,
  });

  // 4. Esegui il batch
  // Questa operazione è atomica: o entrambe le scritture hanno successo, o nessuna delle due viene eseguita.
  await batch.commit();
};
