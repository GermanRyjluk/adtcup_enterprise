import {
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

/**
 * Verifica un QR code, fa avanzare il team e registra il tempo in classifica.
 *
 * @param teamId L'ID del team che ha scansionato (dal AuthContext).
 * @param eventId L'ID dell'evento corrente.
 * @param scannedQuizId L'ID del quiz letto dal QR code.
 * @returns Una Promise che si risolve con un oggetto { success: boolean, message: string }.
 */
export const verifyQRCode = async (
  teamId: string,
  eventId: string,
  scannedQuizId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // --- 1. Recupera lo stato attuale e il nome del team ---
    const teamDocRef = doc(db, "events", eventId, "teams", teamId);
    const teamDocSnap = await getDoc(teamDocRef);
    if (!teamDocSnap.exists()) {
      return { success: false, message: "Dati del team non trovati." };
    }
    const {
      currentRiddleIndex,
      name: teamName,
      lastScanTime,
    } = teamDocSnap.data();

    // --- 2. Verifica se il QR code è quello corretto ---
    const currentQuizDocRef = doc(
      db,
      "events",
      eventId,
      "quiz",
      currentRiddleIndex
    );
    const currentQuizDocSnap = await getDoc(currentQuizDocRef);
    if (!currentQuizDocSnap.exists()) {
      return {
        success: false,
        message: "Errore interno: quiz attuale non trovato.",
      };
    }
    const { nextQuizId } = currentQuizDocSnap.data();

    if (scannedQuizId !== nextQuizId) {
      return {
        success: false,
        message: "QR Code non corretto. Continua a cercare!",
      };
    }

    // --- 3. Prepara e esegui il batch di scrittura ---
    const batch = writeBatch(db);
    const scanTime = serverTimestamp();

    // --- Calcola il tempo impiegato in secondi ---
    const completionTimestamp = Timestamp.now();
    let durationSeconds = 0;
    if (lastScanTime instanceof Timestamp) {
      durationSeconds = completionTimestamp.seconds - lastScanTime.seconds;
    }

    // Aggiorna il team
    batch.update(teamDocRef, {
      currentRiddleIndex: scannedQuizId,
      lastScanTime: scanTime,
    });

    // Registra in classifica
    const leaderboardDocRef = doc(
      db,
      "events",
      eventId,
      "quiz",
      currentRiddleIndex,
      "leaderboard",
      teamId
    );
    batch.set(leaderboardDocRef, {
      teamId,
      teamName,
      scanTime: completionTimestamp,
      durationSeconds,
    });

    await batch.commit();

    return {
      success: true,
      message: "Risposta corretta! Preparati per il prossimo indovinello.",
    };
  } catch (error) {
    console.error("Errore durante la verifica del QR Code:", error);
    return {
      success: false,
      message: "Si è verificato un errore di rete. Riprova.",
    };
  }
};
