import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  documentId,
  GeoPoint,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

/**
 * @file adminService.ts
 * Centralizza le interazioni con Firestore per le funzionalità del pannello admin.
 */

/**
 * Ascolta i progressi di tutti i team in un evento.
 */
export const listenToAllTeamsProgress = (
  eventId: string,
  callback: (teams: DocumentData[]) => void
): Unsubscribe => {
  const teamsRef = collection(db, "events", eventId, "teams");
  const q = query(teamsRef, orderBy("score", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(teamsData);
    },
    (error) => {
      console.error("Errore nell'ascolto dei team:", error);
      callback([]);
    }
  );
};

/**
 * Ascolta tutti gli indovinelli (quiz) di un evento.
 * @param eventId L'ID dell'evento.
 * @param callback La funzione da eseguire con la lista degli indovinelli.
 */
export const listenToRiddles = (
  eventId: string,
  callback: (riddles: DocumentData[]) => void
): Unsubscribe => {
  const riddlesRef = collection(db, "events", eventId, "quiz");
  const q = query(riddlesRef); // Potremmo voler ordinare per ID numerico se possibile

  return onSnapshot(
    q,
    (snapshot) => {
      const riddlesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Ordiniamo numericamente basandoci sull'ID del documento che è una stringa
      riddlesData.sort(
        (a, b) =>
          parseInt((a as any).currentRiddleNumber, 10) -
          parseInt((b as any).currentRiddleNumber, 10)
      );
      callback(riddlesData);
    },
    (error) => {
      console.error("Errore nell'ascolto degli indovinelli:", error);
      callback([]);
    }
  );
};

/**
 * Crea un nuovo team in un evento con un ID documento personalizzato.
 * @param eventId L'ID dell'evento.
 * @param teamData L'oggetto contenente i dati del nuovo team.
 */
export const adminCreateTeam = async (
  eventId: string,
  teamData: DocumentData
): Promise<void> => {
  if (!teamData.name || isNaN(teamData.numericId)) {
    throw new Error("Nome del team e ID Numerico sono obbligatori.");
  }

  const teamIdAsString = teamData.numericId.toString();
  const teamDocRef = doc(db, "events", eventId, "teams", teamIdAsString);

  // Controlliamo se un documento con questo ID esiste già.
  const docSnap = await getDoc(teamDocRef);
  if (docSnap.exists()) {
    throw new Error(
      `Un team con ID numerico "${teamData.numericId}" esiste già.`
    );
  }

  // Imposta valori di default se non forniti
  const newTeam = {
    name: teamData.name,
    numericId: teamData.numericId,
    score: teamData.score || 0,
    currentRiddleIndex: teamData.currentRiddleIndex || "1",
    currentRiddleNumber: teamData.currentRiddleNumber || 1,
    photoUrl: teamData.photoUrl || "",
    startLocation: teamData.startLocation || new GeoPoint(45.046808, 7.682705),
    isGameFinished: false,
    createdAt: serverTimestamp(),
    lastScanTime: serverTimestamp(),
  };

  await setDoc(teamDocRef, newTeam);
};

/**
 * Aggiorna i dati di un team specifico.
 * @param eventId L'ID dell'evento.
 * @param teamId L'ID del team da aggiornare.
 * @param data I dati da modificare (es. { name: "Nuovo Nome" }).
 */
export const adminUpdateTeam = async (
  eventId: string,
  teamId: string,
  data: Partial<DocumentData>
): Promise<void> => {
  const teamDocRef = doc(db, "events", eventId, "teams", teamId);
  await updateDoc(teamDocRef, data);
};

/**
 * Cancella un team.
 * @param eventId L'ID dell'evento.
 * @param teamId L'ID del team da cancellare.
 */
export const adminDeleteTeam = async (
  eventId: string,
  teamId: string
): Promise<void> => {
  const teamDocRef = doc(db, "events", eventId, "teams", teamId);
  await deleteDoc(teamDocRef);
  // Nota: questo non rimuove i giocatori dal team. Potrebbe essere necessario un passaggio aggiuntivo
  // per aggiornare i profili utente se necessario.
};

/**
 * Recupera tutti gli utenti o solo quelli senza un team.
 * @param assignedOnly Se true, restituisce solo gli utenti che hanno già un teamId.
 */
export const adminGetUsers = async (
  unassignedOnly = false
): Promise<DocumentData[]> => {
  const usersRef = collection(db, "users");
  let q = query(usersRef, orderBy("username", "asc"));

  if (unassignedOnly) {
    q = query(
      usersRef,
      where("teamId", "==", null),
      orderBy("username", "asc")
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Assegna un utente a un team usando l'ID numerico del team.
 * @param eventId L'ID dell'evento.
 * @param teamNumericId L'ID numerico del team.
 * @param userId L'ID dell'utente da assegnare.
 */
export const adminAssignUserToTeam = async (
  eventId: string,
  teamNumericId: number,
  userId: string
): Promise<void> => {
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, {
    teamId: teamNumericId,
    currentEventId: eventId,
  });
};

/**
 * Rimuove un utente da un team.
 * @param userId L'ID dell'utente da rimuovere dal team.
 */
export const adminRemoveUserFromTeam = async (
  userId: string
): Promise<void> => {
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, {
    teamId: null,
    currentEventId: null,
  });
};

/**
 * Ascolta tutti gli utenti.
 * @param callback La funzione da eseguire con la lista degli utenti.
 */
export const listenToUsers = (
  callback: (users: DocumentData[]) => void
): Unsubscribe => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("username", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(usersData);
    },
    (error) => {
      console.error("Errore nell'ascolto degli utenti:", error);
      callback([]);
    }
  );
};

export interface QuizData extends DocumentData {
  id: string;
  type: "riddle" | "location" | "multipleChoice" | "multipleChoiceLeaderboard";
  nextQuizId: string;
  currentRiddleNumber: number;
  totalRiddles: number;
  // Campi specifici per tipo
  clueIntervalSeconds?: number;
  maxClues?: number;
  message?: string;
  photo?: string;
  hints?: { id: string; message?: string; photo?: string }[];
  address?: string;
  description?: string;
  locationName?: string;
  mapsLink?: string;
  openingHours?: string;
  timeLimitSeconds?: number;
  questions?: any[]; // Array di oggetti domanda
  sourceQuizId?: string;
  title?: string;
  totalQuestions?: number;
  geolocationCheck?: boolean;
  location?: GeoPoint;
}

/**
 * Crea o aggiorna un documento quiz in Firestore, gestendo anche la
 * creazione della sottocollezione 'hints' se il tipo è 'riddle'.
 * @param eventId L'ID dell'evento a cui aggiungere il quiz.
 * @param quizData L'oggetto contenente tutti i dati del quiz da salvare.
 */
export const createOrUpdateQuiz = async (
  eventId: string,
  quizData: QuizData
): Promise<void> => {
  if (!eventId || !quizData.id) {
    throw new Error("Event ID e Quiz ID sono obbligatori.");
  }

  // Riferimento al documento del quiz
  const quizDocRef = doc(db, "events", eventId, "quiz", quizData.id);
  const batch = writeBatch(db);

  // Prepara i dati da salvare, escludendo 'hints' dal documento principale
  const { hints, ...mainQuizData } = quizData;
  batch.set(quizDocRef, mainQuizData);

  // Se il tipo è 'riddle' e ci sono hints, li aggiunge alla sottocollezione
  if (quizData.type === "riddle" && hints && hints.length > 0) {
    const hintsCollectionRef = collection(quizDocRef, "hints");
    hints.forEach((hint, index) => {
      // Usiamo l'indice + 1 come ID del documento hint per l'ordine
      const hintDocRef = doc(hintsCollectionRef, (index + 1).toString());
      batch.set(hintDocRef, {
        message: hint.message || "",
        photo: hint.photo || "",
      });
    });
  }

  // Esegui tutte le operazioni di scrittura in modo atomico
  await batch.commit();
};

/**
 * Cancella un quiz e la sua sottocollezione di indizi (hints).
 */
export const adminDeleteQuiz = async (
  eventId: string,
  quizId: string
): Promise<void> => {
  if (!eventId || !quizId) {
    throw new Error("ID dell'evento o del quiz non fornito.");
  }

  const batch = writeBatch(db);

  // 1. Riferimento al documento del quiz da eliminare
  const quizDocRef = doc(db, "events", eventId, "quiz", quizId);

  // 2. Elimina la sottocollezione "hints" (se esiste)
  const hintsRef = collection(quizDocRef, "hints");
  const hintsSnapshot = await getDocs(hintsRef);
  hintsSnapshot.forEach((hintDoc) => {
    batch.delete(hintDoc.ref);
  });

  // 3. Elimina il documento del quiz
  batch.delete(quizDocRef);

  // 4. Esegui tutte le operazioni in un unico batch
  await batch.commit();
};

/**
 * Cancella un singolo indizio (hint) da un quiz.
 */
export const adminDeleteHint = async (
  eventId: string,
  quizId: string,
  hintId: string
): Promise<void> => {
  if (!eventId || !quizId || !hintId) {
    throw new Error("ID dell'evento, del quiz o dell'indizio non fornito.");
  }
  const hintDocRef = doc(
    db,
    "events",
    eventId,
    "quiz",
    quizId,
    "hints",
    hintId
  );
  await deleteDoc(hintDocRef);
};

/**
 * Aggiorna il punteggio di una squadra aggiungendo o sottraendo un valore.
 */
export const adminUpdateTeamScore = async (
  eventId: string,
  teamId: string,
  points: number
): Promise<void> => {
  if (!eventId || !teamId) {
    throw new Error("ID dell'evento o del team non fornito.");
  }
  const teamDocRef = doc(db, "events", eventId, "teams", teamId);
  await updateDoc(teamDocRef, {
    score: increment(points), // Usa 'increment' per un aggiornamento atomico
  });
};

/**
 * Recupera i dettagli di un singolo quiz da un evento.
 */
export const getQuizDetails = async (
  eventId: string,
  quizId: string
): Promise<DocumentData | null> => {
  if (!eventId || !quizId) {
    throw new Error("ID dell'evento o del quiz non fornito.");
  }
  const quizDocRef = doc(db, "events", eventId, "quiz", quizId);
  const quizSnap = await getDoc(quizDocRef);
  return quizSnap.exists() ? quizSnap.data() : null;
};

/**
 * Fa avanzare o retrocedere una squadra a un quiz specifico.
 */
export const adminChangeTeamRiddle = async (
  eventId: string,
  teamId: string,
  newRiddleId: string,
  currentRiddleNumber: number
): Promise<void> => {
  if (!eventId || !teamId) {
    throw new Error("ID dell'evento o del team non fornito.");
  }
  const teamDocRef = doc(db, "events", eventId, "teams", teamId);
  await updateDoc(teamDocRef, {
    currentRiddleIndex: newRiddleId,
    // Aggiorniamo anche il contatore della tappa per coerenza
    currentRiddleNumber: isNaN(parseInt(newRiddleId))
      ? currentRiddleNumber
      : parseInt(newRiddleId),
  });
};

/**
 * Recupera la classifica per un singolo quiz, ordinata in base al tipo di quiz.
 * @param eventId L'ID dell'evento corrente.
 * @param quizId L'ID del quiz di cui recuperare la classifica.
 * @returns Una Promise che risolve in un array di documenti della classifica.
 */
export const getQuizLeaderboard = async (
  eventId: string,
  quizId: string
): Promise<DocumentData[]> => {
  try {
    const leaderboardCollectionRef = collection(
      db,
      "events",
      eventId,
      "quiz",
      quizId,
      "leaderboard"
    );

    // Recupera prima i dettagli del quiz per determinarne il tipo
    const quizDetails = await getQuizDetails(eventId, quizId);
    let leaderboardData: DocumentData[];

    // Se è un quiz a tempo, recuperiamo i dati senza ordinamento da Firestore
    // e li ordiniamo localmente per evitare di dover creare un indice composto.
    if (quizDetails?.type === "multipleChoice") {
      const querySnapshot = await getDocs(leaderboardCollectionRef);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        teamId: doc.id,
        ...doc.data(),
      }));

      // Eseguiamo l'ordinamento qui, in locale
      data.sort((a, b) => {
        const correctA = a.correctAnswers || 0;
        const correctB = b.correctAnswers || 0;
        if (correctB !== correctA) {
          return correctB - correctA; // Più risposte corrette vengono prima
        }
        const durationA = a.durationSeconds || 0;
        const durationB = b.durationSeconds || 0;
        return durationA - durationB; // Meno tempo è meglio
      });
      leaderboardData = data;
    } else {
      // Per gli altri tipi di quiz (location, riddle), l'ordinamento per 'scanTime'
      // richiede un indice semplice che di solito è automatico.
      const q = query(leaderboardCollectionRef, orderBy("scanTime", "asc"));
      const querySnapshot = await getDocs(q);
      leaderboardData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        teamId: doc.id,
        ...doc.data(),
      }));
    }

    return leaderboardData;
  } catch (error) {
    console.error("Errore nel recuperare la classifica del quiz:", error);
    throw new Error("Impossibile caricare la classifica.");
  }
};

/**
 * Recupera i dati di più team in base ai loro ID.
 * Utilizza query batch per gestire più di 10 ID.
 * @param eventId L'ID dell'evento.
 * @param teamIds Un array di ID dei team da recuperare.
 * @returns Una Promise che risolve in una Mappa [teamId -> teamData].
 */
export const getTeamsByIds = async (
  eventId: string,
  teamIds: string[]
): Promise<Map<string, DocumentData>> => {
  const teamsMap = new Map<string, DocumentData>();
  if (!teamIds || teamIds.length === 0) {
    return teamsMap;
  }

  const teamsRef = collection(db, "events", eventId, "teams");

  // Firestore limita l'operatore 'in' a 10 elementi per query.
  // Suddividiamo la richiesta in blocchi (chunks) da 10.
  const chunks: string[][] = [];
  for (let i = 0; i < teamIds.length; i += 10) {
    chunks.push(teamIds.slice(i, i + 10));
  }

  // Eseguiamo una query per ogni blocco e uniamo i risultati.
  await Promise.all(
    chunks.map(async (chunk) => {
      const q = query(teamsRef, where(documentId(), "in", chunk));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        teamsMap.set(doc.id, doc.data());
      });
    })
  );

  return teamsMap;
};

/**
 * Assegna i punti a più squadre in un'unica operazione batch.
 * @param eventId L'ID dell'evento.
 * @param pointAssignments Un array di oggetti { teamId: string, points: number }.
 */
export const assignPointsInBatch = async (
  eventId: string,
  pointAssignments: { teamId: string; points: number }[]
): Promise<void> => {
  if (!eventId || !pointAssignments) {
    throw new Error("ID evento o assegnazione punti non forniti.");
  }

  // 1. Crea un'operazione batch da Firestore.
  const batch = writeBatch(db);

  // 2. Itera su ogni assegnazione di punti.
  pointAssignments.forEach((assignment) => {
    // Se i punti da assegnare sono 0, salta questo team per non fare scritture inutili.
    if (assignment.points === 0) {
      return;
    }

    // Definisci il riferimento al documento del team specifico.
    const teamDocRef = doc(db, "events", eventId, "teams", assignment.teamId);

    // 3. Aggiungi un'operazione di aggiornamento al batch.
    // Usiamo 'increment' per un aggiornamento sicuro che previene race conditions.
    batch.update(teamDocRef, {
      score: increment(assignment.points),
    });
  });

  // 4. Esegui tutte le operazioni nel batch in modo atomico.
  await batch.commit();
};

/**
 * Ascolta gli utenti registrati a partire da una certa data.
 * @param date La data di inizio da cui filtrare.
 * @param callback La funzione da eseguire con la lista degli utenti.
 */
export const listenToUsersRegisteredAfter = (
  date: Date,
  callback: (users: DocumentData[]) => void
): Unsubscribe => {
  const usersRef = collection(db, "users");
  const startDate = Timestamp.fromDate(date);

  const q = query(
    usersRef,
    where("createdAt", ">=", startDate),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(usersData);
    },
    (error) => {
      console.error("Errore nell'ascolto degli utenti:", error);
      callback([]);
    }
  );
};

/**
 * Aggiorna i dati di un evento specifico.
 * @param eventId L'ID dell'evento.
 * @param data I dati da modificare.
 */
export const updateEvent = async (
  eventId: string,
  data: Partial<DocumentData>
): Promise<void> => {
  const eventDocRef = doc(db, "events", eventId);
  await updateDoc(eventDocRef, data);
};

/**
 * Aggiorna tutte le squadre di un evento a un nuovo indovinello specifico.
 * Utile per avviare una fase di gioco per tutti contemporaneamente.
 * @param eventId L'ID dell'evento.
 * @param newRiddleIndex L'ID del nuovo indovinello/quiz.
 * @param newRiddleNumber Il numero progressivo della nuova fase.
 */
export const adminStartQuizPhaseForAllTeams = async (
  eventId: string,
  newRiddleIndex: string,
  newRiddleNumber: number
): Promise<void> => {
  if (!eventId || !newRiddleIndex) {
    throw new Error("ID evento e ID indovinello sono obbligatori.");
  }

  const batch = writeBatch(db);
  const teamsRef = collection(db, "events", eventId, "teams");
  const teamsSnapshot = await getDocs(teamsRef);

  teamsSnapshot.forEach((teamDoc) => {
    batch.update(teamDoc.ref, {
      currentRiddleIndex: newRiddleIndex,
      currentRiddleNumber: newRiddleNumber,
      lastScanTime: serverTimestamp(),
    });
  });

  await batch.commit();
};

/**
 * Resetta lo stato di gioco per tutti gli utenti registrati dopo una certa data.
 * @param date La data di inizio da cui filtrare gli utenti.
 * @param isGameStarted Il nuovo valore per il campo 'isGameStarted'.
 */
export const adminResetUsersGameState = async (
  date: Date,
  isGameStarted: boolean
): Promise<void> => {
  const usersRef = collection(db, "users");
  const startDate = Timestamp.fromDate(date);

  // Query per trovare tutti gli utenti creati da 'startDate' in poi
  const q = query(usersRef, where("createdAt", ">=", startDate));

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Nessun utente trovato dopo la data specificata.");
  }

  const batch = writeBatch(db);
  querySnapshot.forEach((userDoc) => {
    // Per ogni utente trovato, aggiungi un'operazione di aggiornamento al batch
    batch.update(userDoc.ref, { isGameStarted: isGameStarted });
  });

  // Esegui tutte le modifiche in un'unica operazione atomica
  await batch.commit();
};
