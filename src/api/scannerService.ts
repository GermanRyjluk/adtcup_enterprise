import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

/**
 * @file scannerService.ts
 * Contiene la logica per la verifica dei QR code e l'aggiornamento dello stato di gioco.
 */

/**
 * Verifica se il QR code scansionato è la risposta corretta per l'indovinello attuale
 * e, in caso affermativo, fa avanzare il giocatore al prossimo indovinello.
 *
 * @param uid L'ID dell'utente che ha scansionato il codice.
 * @param eventId L'ID dell'evento corrente.
 * @param riddleIndex L'indice dell'indovinello a cui l'utente sta rispondendo.
 * @param scannedData Il contenuto del QR code scansionato.
 * @returns Una Promise che si risolve con un oggetto { success: boolean, message: string }.
 */
export const verifyQRCode = async (
  uid: string,
  eventId: string,
  riddleIndex: number,
  scannedData: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Recupera la risposta corretta per l'indovinello attuale dal database.
    const riddleRef = doc(
      db,
      "events",
      eventId,
      "riddles",
      String(riddleIndex)
    );
    const riddleSnap = await getDoc(riddleRef);

    if (!riddleSnap.exists()) {
      return {
        success: false,
        message: "Indovinello non trovato. Contatta l'assistenza.",
      };
    }

    const correctAnswer = riddleSnap.data().solution; // Assumiamo che la risposta sia nel campo 'solution'

    // 2. Confronta la risposta scansionata con quella corretta.
    if (scannedData.trim() === correctAnswer) {
      // 3. Se la risposta è corretta, aggiorna lo stato del giocatore (incrementa l'indice).
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        riddleIndex: increment(1),
      });

      // Qui si potrebbe anche aggiungere la logica per incrementare il punteggio del team.

      return {
        success: true,
        message: "Risposta corretta! Preparati per il prossimo indovinello.",
      };
    } else {
      // 4. Se la risposta è sbagliata.
      return {
        success: false,
        message:
          "QR Code non valido per questo indovinello. Continua a cercare!",
      };
    }
  } catch (error) {
    console.error("Errore durante la verifica del QR Code:", error);
    return {
      success: false,
      message: "Si è verificato un errore di rete. Riprova.",
    };
  }
};
