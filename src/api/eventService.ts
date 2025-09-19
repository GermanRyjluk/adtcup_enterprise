import { Unsubscribe } from "firebase/auth";
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

/**
 * @file eventService.ts
 * Centralizza le interazioni con Firestore per eventi e team.
 */

/**
 * Recupera i dettagli di un evento specifico.
 */
export const getEventDetails = async (
  eventId: string
): Promise<DocumentData | null> => {
  const eventDocRef = doc(db, "events", eventId);
  const eventSnap = await getDoc(eventDocRef);
  return eventSnap.exists() ? eventSnap.data() : null;
};

/**
 * Recupera i dettagli di un team specifico.
 */
export const getTeamDetails = async (
  eventId: string,
  teamId: string
): Promise<DocumentData | null> => {
  try {
    const teamDocRef = doc(db, "events", eventId, "teams", teamId.toString());
    const teamSnap = await getDoc(teamDocRef);
    return teamSnap.exists() ? teamSnap.data() : null;
  } catch (error) {
    console.error("Errore nel recupero dei dettagli del team:", error);
    return null;
  }
};

/**
 * Imposta un listener in tempo reale sui dettagli di un evento.
 * @param eventId L'ID dell'evento da ascoltare.
 * @param callback La funzione da eseguire ogni volta che i dati dell'evento cambiano.
 * @returns Una funzione `unsubscribe` per interrompere l'ascolto.
 */
export const listenEventDetails = (
  eventId: string,
  callback: (data: DocumentData | null) => void
): Unsubscribe => {
  const eventDocRef = doc(db, "events", eventId);
  return onSnapshot(
    eventDocRef,
    (docSnap) => {
      callback(docSnap.exists() ? docSnap.data() : null);
    },
    (error) => {
      console.error("Errore nell'ascolto dei dati dell'evento:", error);
      callback(null);
    }
  );
};

/**
 * Recupera il prossimo evento imminente da Firestore.
 * Cerca l'evento con la data più vicina nel futuro.
 * @returns Una Promise che si risolve con i dati dell'evento e il suo ID, o null se non ci sono eventi futuri.
 */
export const getUpcomingEvent = async (): Promise<{
  id: string;
  data: DocumentData;
} | null> => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const eventsRef = collection(db, "events");
    const q = query(
      eventsRef,
      where("startTime", ">", oneWeekAgo), // Filtra solo eventi con data futura
      orderBy("startTime", "asc"), // Ordina per data crescente per trovare il più vicino
      limit(1) // Vogliamo solo il primo risultato
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const upcomingEventDoc = querySnapshot.docs[0];
      return {
        id: upcomingEventDoc.id,
        data: upcomingEventDoc.data(),
      };
    } else {
      // Non ci sono eventi futuri in programma
      return null;
    }
  } catch (error) {
    console.error("Errore nel recupero dell'evento imminente:", error);
    return null;
  }
};
