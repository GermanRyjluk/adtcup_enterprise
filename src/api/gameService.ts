import {
  doc,
  onSnapshot,
  Unsubscribe,
  DocumentData,
  getDoc,
  Timestamp,
} from "firebase/firestore";
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
  currentRiddleNumber: number;
  totalRiddles: number;
  lastScanTime?: Timestamp;
}

/**
 * Imposta un listener in tempo reale sullo stato di gioco di un team.
 * La funzione prima recupera l'ID del team e dell'evento dal profilo dell'utente,
 * poi si mette in ascolto sul documento del team per gli aggiornamenti di gioco.
 *
 * @param uid L'ID dell'utente.
 * @param callback La funzione da eseguire ogni volta che lo stato di gioco del team cambia.
 * @returns Una funzione `unsubscribe` per interrompere l'ascolto.
 */
export const listenToGameState = (
  uid: string,
  callback: (state: GameState | null) => void
): Unsubscribe => {
  // Funzione vuota di "unsubscribe" da ritornare in caso di errore immediato.
  let unsubscribe: Unsubscribe = () => {};

  const setupListener = async () => {
    try {
      // 1. Recupera i dati dell'utente una sola volta per ottenere teamId e currentEventId.
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        console.warn(`Documento utente non trovato per l'UID: ${uid}`);
        callback(null);
        return;
      }

      const userData = userDocSnap.data();
      const { teamId, currentEventId } = userData;

      if (!teamId || !currentEventId) {
        console.warn(`teamId o currentEventId mancanti per l'utente: ${uid}`);
        callback(null);
        return;
      }
      // 2. Ora che abbiamo gli ID, creiamo il riferimento al documento del team.
      const teamDocRef = doc(
        db,
        "events",
        currentEventId,
        "teams",
        teamId.toString()
      );

      // 3. Imposta il listener in tempo reale sul documento del team.
      unsubscribe = onSnapshot(
        teamDocRef,
        (teamDocSnap) => {
          if (teamDocSnap.exists()) {
            const teamData = teamDocSnap.data();

            // 4. Costruisci l'oggetto GameState combinando i dati.
            const gameState: GameState = {
              currentEventId: currentEventId,
              teamId: teamId,
              currentRiddleIndex: teamData.currentRiddleIndex || 1,
              isGameFinished: teamData.isGameFinished || false,
              lastScanTime: teamData.lastScanTime,
            };
            callback(gameState);
          } else {
            console.warn(
              `Documento del team non trovato: ${teamId} nell'evento ${currentEventId}`
            );
            callback(null);
          }
        },
        (error) => {
          console.error(
            "Errore nell'ascolto dello stato di gioco del team:",
            error
          );
          callback(null);
        }
      );
    } catch (error) {
      console.error(
        "Errore nel setup del listener per lo stato di gioco:",
        error
      );
      callback(null);
    }
  };

  setupListener();

  // Ritorna la funzione per annullare l'iscrizione al listener.
  return () => {
    unsubscribe();
  };
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
  const riddleDocRef = doc(db, "events", eventId, "quiz", String(riddleIndex));

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
