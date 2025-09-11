import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  DocumentData,
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
  teamId: string
): Promise<DocumentData | null> => {
  const teamDocRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamDocRef);
  return teamSnap.exists() ? teamSnap.data() : null;
};

/**
 * (NUOVA FUNZIONE)
 * Recupera il prossimo evento imminente da Firestore.
 * Cerca l'evento con la data più vicina nel futuro.
 * @returns Una Promise che si risolve con i dati dell'evento e il suo ID, o null se non ci sono eventi futuri.
 */
export const getUpcomingEvent = async (): Promise<{
  id: string;
  data: DocumentData;
} | null> => {
  try {
    const eventsRef = collection(db, "events");
    const q = query(
      eventsRef,
      where("startTime", ">", new Date()), // Filtra solo eventi con data futura
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
