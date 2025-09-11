import { doc, onSnapshot, Unsubscribe, DocumentData } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

/**
 * @file gameService.ts
 * Centralizza tutte le interazioni con Firestore relative allo stato di gioco.
 */

// Definiamo un tipo per lo stato di gioco dell'utente per maggiore chiarezza
export interface GameState {
  currentEventId: string;
  currentRiddleIndex: number;
  teamId: string;
  isGameFinished: boolean;
}

/**
 * Imposta un listener in tempo reale sullo stato di gioco di un utente.
 *
 * @param uid L'ID dell'utente.
 * @param callback La funzione da eseguire ogni volta che lo stato di gioco cambia.
 * @returns Una funzione `unsubscribe` per interrompere l'ascolto.
 */
export const listenToGameState = (
  uid: string,
  callback: (state: GameState | null) => void
): Unsubscribe => {
  const userDocRef = doc(db, "users", uid);

  const unsubscribe = onSnapshot(
    userDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const gameState: GameState = {
          currentEventId: data.currentEventId || "default-event", // ID evento di fallback
          currentRiddleIndex: data.riddleIndex || 1, // Parte dal primo indovinello
          teamId: data.teamId || null,
          isGameFinished: data.isGameFinished || false,
        };
        callback(gameState);
      } else {
        console.warn(`Documento utente non trovato per l'UID: ${uid}`);
        callback(null);
      }
    },
    (error) => {
      console.error("Errore nell'ascolto dello stato di gioco:", error);
      callback(null);
    }
  );

  return unsubscribe;
};

/**
 * Imposta un listener in tempo reale su un indovinello specifico.
 *
 * @param eventId L'ID dell'evento corrente.
 * @param riddleIndex L'indice (numero) dell'indovinello da caricare.
 * @param callback La funzione da eseguire quando i dati dell'indovinello sono disponibili.
 * @returns Una funzione `unsubscribe` per interrompere l'ascolto.
 */
export const listenToRiddle = (
  eventId: string,
  riddleIndex: number,
  callback: (riddle: DocumentData | null) => void
): Unsubscribe => {
  const riddleDocRef = doc(
    db,
    "events",
    eventId,
    "riddles",
    String(riddleIndex)
  );

  const unsubscribe = onSnapshot(
    riddleDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        console.warn(
          `Indovinello non trovato: evento ${eventId}, indice ${riddleIndex}`
        );
        callback(null);
      }
    },
    (error) => {
      console.error("Errore nell'ascolto dell'indovinello:", error);
      callback(null);
    }
  );

  return unsubscribe;
};
