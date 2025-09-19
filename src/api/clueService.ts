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
  // Il percorso alla collezione "hints" è corretto come indicato da te.
  const cluesRef = collection(db, "events", eventId, "quiz", riddleId, "hints");

  const q = query(cluesRef);

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const cluesData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        cluesData.push({ id: doc.id, ...doc.data() });
      });

      // ORDINIAMO I DATI QUI, nell'app, dopo averli ricevuti.
      // Convertiamo gli ID in numeri per un ordinamento corretto.
      cluesData.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));

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
