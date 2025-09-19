import {
  collection,
  doc,
  DocumentData,
  getDoc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

// Punteggio di fallback se non specificato nella domanda
const DEFAULT_POINTS_PER_ANSWER = 100;

/**
 * Calcola il punteggio di un quiz, salva il risultato e fa avanzare il team.
 * @param eventId ID dell'evento.
 * @param quizId ID del quiz completato.
 * @param quizData Dati completi del quiz.
 * @param teamId ID del team.
 * @param answers Risposte dell'utente.
 * @param quizStartTime Timestamp di quando la fase è iniziata per il team.
 * @returns Promise che si risolve con il numero di risposte corrette.
 */
export const submitMultipleChoiceAnswers = async (
  eventId: string,
  quizId: string,
  quizData: DocumentData,
  teamId: string,
  answers: { [key: string]: number },
  quizStartTime: Timestamp
): Promise<number> => {
  const batch = writeBatch(db);
  const teamDocRef = doc(db, "events", eventId, "teams", teamId);
  const leaderboardDocRef = doc(
    db,
    "events",
    eventId,
    "quiz",
    quizId,
    "leaderboard",
    teamId
  );
  const completionTimestamp = Timestamp.now();

  try {
    const teamDocSnap = await getDoc(teamDocRef);
    if (!teamDocSnap.exists()) {
      throw new Error("Dati del team non trovati.");
    }
    const teamData = teamDocSnap.data();

    const questions = quizData.questions as any[];
    let correctAnswersCount = 0;
    let scoreGained = 0;

    console.log(questions);

    questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswerIndex) {
        correctAnswersCount++;
        scoreGained += parseInt(question.points) || DEFAULT_POINTS_PER_ANSWER;
      }
      console.log("TP: " + scoreGained);
    });

    // Calcola il tempo impiegato in secondi
    const durationSeconds = completionTimestamp.seconds - quizStartTime.seconds;

    // A. Scrivi il risultato nella leaderboard del quiz
    batch.set(leaderboardDocRef, {
      teamName: teamData.name,
      correctAnswers: correctAnswersCount,
      scoreGained: scoreGained,
      timestamp: completionTimestamp,
      durationSeconds: durationSeconds,
    });

    // B. Aggiorna lo stato del team per farlo avanzare alla schermata di riepilogo
    batch.update(teamDocRef, {
      currentRiddleIndex: quizData.nextQuizId, // Va alla schermata leaderboard
      score: increment(scoreGained),
      lastScanTime: serverTimestamp(), // Aggiorna il tempo dell'ultima azione
    });

    await batch.commit();
    return correctAnswersCount;
  } catch (error) {
    console.error("Errore durante l'invio delle risposte:", error);
    throw error;
  }
};

/**
 * Ascolta in tempo reale la classifica di uno specifico quiz.
 * @param eventId ID dell'evento.
 * @param quizId ID del quiz di cui recuperare la classifica.
 * @param callback Funzione da eseguire con i dati ordinati.
 * @returns Funzione per annullare l'iscrizione al listener.
 */
export const listenToQuizLeaderboard = (
  eventId: string,
  quizId: string,
  callback: (leaderboard: DocumentData[]) => void
) => {
  const leaderboardRef = collection(
    db,
    "events",
    eventId,
    "quiz",
    quizId,
    "leaderboard"
  );
  const q = query(leaderboardRef);

  return onSnapshot(q, (snapshot) => {
    const leaderboardData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Ordina i risultati: prima per risposte corrette (più è meglio),
    // poi per tempo impiegato (meno è meglio).
    leaderboardData.sort((a, b) => {
      const correctA = (a as any).correctAnswers;
      const correctB = (b as any).correctAnswers;
      if (correctB !== correctA) {
        return correctB - correctA;
      }
      const durationA = (a as any).durationSeconds;
      const durationB = (b as any).durationSeconds;
      return durationA - durationB;
    });

    callback(leaderboardData);
  });
};

/**
 * Fa avanzare manualmente un team alla tappa successiva dalla schermata di riepilogo.
 * @param eventId ID dell'evento.
 * @param teamId ID del team.
 * @param nextQuizId ID della prossima fase di gioco.
 */
export const advanceToNextStage = async (
  eventId: string,
  teamId: string,
  nextQuizId: string
): Promise<void> => {
  const teamDocRef = doc(db, "events", eventId, "teams", teamId);
  await updateDoc(teamDocRef, {
    currentRiddleIndex: nextQuizId,
    currentRiddleNumber: increment(1), // Incrementa il contatore delle fasi
    lastScanTime: serverTimestamp(),
  });
};
