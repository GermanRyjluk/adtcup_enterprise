import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

// --- Dati di Esempio ---

const tipsData = [
  {
    id: "1",
    icon: "grid",
    title: "Scansiona",
    description: "Trova i QR code nel mondo reale per avanzare nel gioco.",
  },
  {
    id: "2",
    icon: "help-circle",
    title: "Usa gli Indizi",
    description: "Se sei in difficoltà, puoi sbloccare un aiuto prezioso.",
  },
  {
    id: "3",
    icon: "users",
    title: "Collabora",
    description:
      "Il lavoro di squadra è la chiave per risolvere gli enigmi più difficili.",
  },
  {
    id: "4",
    icon: "battery-charging",
    title: "Resta Carico",
    description:
      "Assicurati di avere il telefono carico per tutta la durata dell'evento.",
  },
  {
    id: "5",
    icon: "map-pin",
    title: "Esplora",
    description:
      "Guarda attentamente l'ambiente che ti circonda, ogni dettaglio conta.",
  },
  {
    id: "6",
    icon: "award",
    title: "Punta al Top",
    description:
      "Completa gli indovinelli velocemente per scalare la classifica.",
  },
];

const multipleChoiceData = {
  type: "multipleChoice",
  timeLimitSeconds: 180,
  nextQuizId: "5", // Assicurati che questo ID sia corretto
  currentRiddleNumber: 4,
  totalRiddles: 10,
  questions: [
    {
      id: "q1",
      questionText: "Quale di questi monumenti non si trova a Torino?",
      imageUrl: null,
      options: [
        "La Mole Antonelliana",
        "Il Colosseo",
        "Palazzo Madama",
        "La Basilica di Superga",
      ],
      correctAnswerIndex: 1,
      points: 100,
    },
    {
      id: "q2",
      questionText:
        "Questa immagine rappresenta un famoso ponte di quale città?",
      imageUrl:
        "https://placehold.co/600x400/4f4869/eaeaea?text=Immagine+Ponte",
      options: ["Roma", "Firenze", "Venezia", "Verona"],
      correctAnswerIndex: 2,
      points: 150,
    },
  ],
};

const locationData = {
  type: "location",
  locationName: "Piazza Castello",
  description:
    "Il cuore pulsante di Torino, centro della vita storica e culturale della città. Ammirate Palazzo Madama e Palazzo Reale.",
  address: "Piazza Castello, 10122 Torino TO",
  mapsLink: "https://maps.app.goo.gl/your-link-here",
  photo:
    "https://firebasestorage.googleapis.com/v0/b/adt-cup.appspot.com/o/locations%2Fpiazza_castello.jpg?alt=media&token=your-token",
  openingHours: "Sempre accessibile",
  currentRiddleNumber: 3,
  totalRiddles: 10,
  nextQuizId: "4",
  geolocationCheck: true,
};

const riddleData = {
  type: "riddle",
  message:
    "Sono il gigante che guarda la città, con una guglia che tocca il cielo. Al mio interno non preghiere, ma pellicole e sogni si proiettano nell'eternità. Chi sono?",
  photo:
    "https://firebasestorage.googleapis.com/v0/b/adt-cup.appspot.com/o/riddles%2Fmole_antonelliana.jpg?alt=media&token=your-token",
  nextQuizId: "2",
  clueIntervalSeconds: 300,
  maxClues: 3,
  currentRiddleNumber: 1,
  totalRiddles: 10,
  hints: [
    { message: "Il mio nome è legato a un architetto visionario.", photo: "" },
    { message: "Ospito il Museo Nazionale del Cinema.", photo: "" },
    {
      message: "Sono il simbolo indiscusso di Torino.",
      photo:
        "https://firebasestorage.googleapis.com/v0/b/adt-cup.appspot.com/o/riddles%2Fmole_detail.jpg?alt=media&token=your-token",
    },
  ],
};

const gioco1Points = [20, 17, 14, 11, 9, 7, 6, 5, 4, 4, 4];
const gioco2Points = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

// --- Funzioni "Usa e Getta" ---

export const populateManualTips = async (eventId: string) => {
  if (!eventId) {
    console.error("ID evento non fornito.");
    return;
  }
  const eventDocRef = doc(db, "events", eventId);
  try {
    await updateDoc(eventDocRef, { manualTips: tipsData });
    alert(`'manualTips' aggiunto con successo a: ${eventId}`);
  } catch (error) {
    alert(`Errore aggiornamento: ${error}`);
  }
};

export const populateGamePoints = async (eventId: string) => {
  if (!eventId) {
    console.error("ID evento non fornito.");
    return;
  }
  const eventDocRef = doc(db, "events", eventId);
  try {
    await updateDoc(eventDocRef, {
      gioco1Points: gioco1Points,
      gioco2Points: gioco1Points,
    });
    alert(`Punti gioco aggiunti a: ${eventId}`);
  } catch (error) {
    alert(`Errore aggiornamento punti: ${error}`);
  }
};

/**
 * Funzione "usa e getta" per creare o aggiornare un quiz a scelta multipla con un ID specifico.
 * @param eventId L'ID dell'evento.
 * @param quizId L'ID del documento da creare (es. "4").
 */
export const populateMultipleChoiceQuiz = async (
  eventId: string,
  quizId: string
) => {
  if (!eventId || !quizId) {
    console.error("ID evento e ID quiz sono obbligatori.");
    return;
  }
  const quizDocRef = doc(db, "events", eventId, "quiz", quizId);
  try {
    await setDoc(quizDocRef, multipleChoiceData);
    const message = `Quiz a scelta multipla con ID "${quizId}" creato/aggiornato con successo.`;
    console.log(message);
    alert(message);
  } catch (error) {
    const errorMessage = `Errore durante la creazione del quiz: ${error}`;
    console.error(errorMessage);
    alert(errorMessage);
  }
};

export const populateLocationQuiz = async (eventId: string, quizId: string) => {
  if (!eventId || !quizId) {
    console.error("ID evento e ID quiz sono obbligatori.");
    return;
  }
  const quizDocRef = doc(db, "events", eventId, "quiz", quizId);
  try {
    await setDoc(quizDocRef, locationData);
    const message = `Tappa Location con ID "${quizId}" creata/aggiornata con successo.`;
    console.log(message);
    alert(message);
  } catch (error) {
    const errorMessage = `Errore durante la creazione della tappa: ${error}`;
    console.error(errorMessage);
    alert(errorMessage);
  }
};

export const populateRiddleWithHints = async (
  eventId: string,
  quizId: string
) => {
  if (!eventId || !quizId) {
    console.error("ID evento e ID quiz sono obbligatori.");
    return;
  }
  const quizDocRef = doc(db, "events", eventId, "quiz", quizId);
  const { hints, ...mainRiddleData } = riddleData;

  try {
    await setDoc(quizDocRef, mainRiddleData);
    if (hints && hints.length > 0) {
      const hintsCollectionRef = collection(quizDocRef, "hints");
      for (let i = 0; i < hints.length; i++) {
        const hintDocRef = doc(hintsCollectionRef, (i + 1).toString());
        await setDoc(hintDocRef, hints[i]);
      }
    }
    const message = `Indovinello con ID "${quizId}" e i suoi aiuti sono stati creati/aggiornati.`;
    console.log(message);
    alert(message);
  } catch (error) {
    const errorMessage = `Errore durante la creazione dell'indovinello: ${error}`;
    console.error(errorMessage);
    alert(errorMessage);
  }
};

const riddlePoints = [20, 17, 14, 11, 9, 7, 6, 5, 4, 4, 4];
/**
 * Funzione "usa e getta" per aggiungere un array di punteggi a un quiz specifico.
 * Utile per i giochi speciali basati sulla classifica (es. Location o Riddle).
 * @param eventId L'ID dell'evento.
 * @param quizId L'ID del quiz a cui aggiungere i punteggi.
 */
export const populateQuizPoints = async (eventId: string, quizId: string) => {
  if (!eventId || !quizId) {
    console.error("ID evento e ID quiz sono obbligatori.");
    return;
  }

  const quizDocRef = doc(db, "events", eventId, "quiz", quizId);

  try {
    // Usa updateDoc per aggiungere solo il campo `points` senza sovrascrivere il resto
    await updateDoc(quizDocRef, {
      points: riddlePoints,
    });
    const message = `Array di punti aggiunto con successo al quiz con ID "${quizId}".`;
    console.log(message);
    alert(message);
  } catch (error) {
    const errorMessage = `Errore durante l'aggiornamento del quiz: ${error}`;
    console.error(errorMessage);
    alert(errorMessage);
  }
};
