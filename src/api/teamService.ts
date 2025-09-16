import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  Unsubscribe,
  DocumentData,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

/**
 * @file teamService.ts
 * Centralizza tutte le interazioni con Firestore per la collezione 'teams' e i membri.
 */

/**
 * Imposta un listener in tempo reale su un documento specifico del team.
 *
 * @param teamId L'ID del team da ascoltare.
 * @param callback La funzione da eseguire ogni volta che i dati del team cambiano.
 * @returns Una funzione `unsubscribe` per interrompere l'ascolto.
 */
export const listenToTeamData = (
  eventId: string,
  teamId: string,
  callback: (data: DocumentData | null) => void
): Unsubscribe => {
  const teamDocRef = doc(db, "events", eventId, "teams", teamId);
  return onSnapshot(
    teamDocRef,
    (docSnap) => {
      callback(docSnap.exists() ? docSnap.data() : null);
    },
    (error) => {
      console.error("Errore nell'ascolto dei dati del team:", error);
      callback(null);
    }
  );
};

/**
 * Imposta un listener in tempo reale per recuperare tutti i membri di un team.
 *
 * @param teamId L'ID del team di cui recuperare i membri.
 * @param callback La funzione da eseguire ogni volta che la lista dei membri cambia.
 * @returns Una funzione `unsubscribe` per interrompere l'ascolto.
 */
export const listenToTeamMembers = (
  eventId: string,
  teamId: number,
  callback: (members: DocumentData[]) => void
): Unsubscribe => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("teamId", "==", teamId));

  return onSnapshot(
    q,
    (querySnapshot) => {
      const members: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() });
      });
      callback(members);
    },
    (error) => {
      console.error("Errore nell'ascolto dei membri del team:", error);
      callback([]);
    }
  );
};

/**
 * Aggiorna il nome di un team su Firestore.
 *
 * @param teamId L'ID del team da aggiornare.
 * @param newName Il nuovo nome del team.
 * @returns Una Promise che si risolve al completamento dell'operazione.
 */
export const updateTeamName = async (
  eventId: string,
  teamId: string,
  newName: string
): Promise<void> => {
  if (!newName.trim()) {
    throw new Error("Il nome del team non può essere vuoto.");
  }
  const teamDocRef = doc(db, "events", eventId, "teams", teamId);
  await updateDoc(teamDocRef, {
    name: newName.trim(),
  });
};
