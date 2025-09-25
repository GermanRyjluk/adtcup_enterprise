// src/api/scannerService.ts
import * as Location from "expo-location";
import {
  doc,
  GeoPoint,
  getDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { getHaversineDistance } from "../utils/locationHelper";

const LOCATION_THRESHOLD_METERS = 50; // 50 metri di tolleranza

export const verifyQRCode = async (
  teamId: string,
  eventId: string,
  scannedQuizId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // --- 1. Recupera i dati del team e del quiz ATTUALE ---
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

    // --- 2. Verifica se il QR code scansionato è quello corretto ---
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

    // --- 3. Carica i dati del quiz DI DESTINAZIONE per il controllo della posizione ---
    const nextQuizDocRef = doc(db, "events", eventId, "quiz", scannedQuizId);
    const nextQuizDocSnap = await getDoc(nextQuizDocRef);
    if (!nextQuizDocSnap.exists()) {
      return {
        success: false,
        message: "La tappa successiva non è stata trovata.",
      };
    }
    const { geolocationCheck, location: targetLocation } =
      nextQuizDocSnap.data();

    // --- 4. Esegui il controllo della posizione solo se richiesto dalla tappa di destinazione ---
    if (geolocationCheck === true && targetLocation instanceof GeoPoint) {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        return {
          success: false,
          message:
            "Permesso di localizzazione non concesso. Abilitalo per continuare.",
        };
      }

      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const distance = getHaversineDistance(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        },
        {
          latitude: targetLocation.latitude,
          longitude: targetLocation.longitude,
        }
      );

      if (distance > LOCATION_THRESHOLD_METERS) {
        return {
          success: false,
          message: `Sei a ${Math.round(
            distance
          )} metri dal punto corretto. Avvicinati di più!`,
        };
      }
    }

    // --- 5. Se tutti i controlli passano, aggiorna lo stato del team ---
    const completionTimestamp = Timestamp.now();
    let durationSeconds = 0;
    if (lastScanTime instanceof Timestamp) {
      durationSeconds = completionTimestamp.seconds - lastScanTime.seconds;
    }

    const batch = writeBatch(db);
    const newScanTime = serverTimestamp();

    batch.update(teamDocRef, {
      currentRiddleIndex: scannedQuizId,
      lastScanTime: newScanTime,
    });

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
      scanTime: newScanTime,
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
