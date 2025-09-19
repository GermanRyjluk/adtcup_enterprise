import {
  collection,
  DocumentData,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

/**
 * @file leaderboardService.ts
 * Centralizza le interazioni con Firestore per la classifica degli eventi.
 */

/**
 * Imposta un listener in tempo reale sulla classifica di un evento specifico.
 * La classifica è rappresentata dalla collezione 'teams' di un evento,
 * ordinata per punteggio in modo decrescente.
 *
 * @param eventId L'ID dell'evento di cui recuperare la classifica.
 * @param callback La funzione da eseguire ogni volta che la classifica cambia.
 * @returns Una funzione `unsubscribe` per interrompere l'ascolto.
 */
export const listenToLeaderboard = (
  eventId: string,
  callback: (teams: DocumentData[]) => void
): Unsubscribe => {
  // Riferimento alla sotto-collezione 'teams' dell'evento specifico
  const teamsRef = collection(db, "events", eventId, "teams");

  // Crea una query per ordinare i team per 'score' in ordine decrescente
  const q = query(teamsRef, orderBy("score", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const leaderboardData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        leaderboardData.push({ id: doc.id, ...doc.data() });
      });
      callback(leaderboardData);
    },
    (error) => {
      console.error("Errore nell'ascolto della classifica:", error);
      callback([]);
    }
  );

  return unsubscribe;
};
