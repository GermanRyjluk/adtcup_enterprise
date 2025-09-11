import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  DocumentData,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

/**
 * @file clueService.ts
 * Centralizza le interazioni con Firestore per recuperare gli indizi degli enigmi.
 */

/**
 * Imposta un listener in tempo reale sulla sotto-collezione 'clues' di un indovinello.
 *
 * @param eventId L'ID dell'evento corrente.
 * @param riddleId L'ID (o indice) dell'indovinello di cui recuperare gli indizi.
 * @param callback La funzione da eseguire ogni volta che la lista degli indizi cambia.
 * @returns Una funzione `unsubscribe` per interrompere l'ascolto.
 */
export const listenToClues = (
  eventId: string,
  riddleId: string,
  callback: (clues: DocumentData[]) => void
): Unsubscribe => {
  // Riferimento alla sotto-collezione 'clues' dell'indovinello specifico
  const cluesRef = collection(
    db,
    "events",
    eventId,
    "riddles",
    riddleId,
    "clues"
  );

  // Ordina gli indizi per un campo 'order' o 'timestamp' per visualizzarli in sequenza
  const q = query(cluesRef, orderBy("order", "asc"));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const cluesData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        cluesData.push({ id: doc.id, ...doc.data() });
      });
      callback(cluesData);
    },
    (error) => {
      console.error(
        `Errore nell'ascolto degli indizi per l'enigma ${riddleId}:`,
        error
      );
      callback([]);
    }
  );

  return unsubscribe;
};
