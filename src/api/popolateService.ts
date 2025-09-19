import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

// L'array di dati che vuoi inserire
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

/**
 * Funzione "usa e getta" per popolare il campo 'manualTips' in un documento evento.
 * @param eventId L'ID del documento evento da aggiornare.
 */
export const populateManualTips = async (eventId: string) => {
  if (!eventId) {
    console.error("ID dell'evento non fornito.");
    return;
  }

  const eventDocRef = doc(db, "events", eventId);

  try {
    await updateDoc(eventDocRef, {
      manualTips: tipsData,
    });
    console.log(
      `Campo 'manualTips' aggiunto con successo all'evento: ${eventId}`
    );
    alert(`Campo 'manualTips' aggiunto con successo all'evento: ${eventId}`);
  } catch (error) {
    console.error("Errore durante l'aggiornamento del documento:", error);
    alert(`Errore durante l'aggiornamento del documento: ${error}`);
  }
};

const multipleChoiceData = {
  type: "multipleChoice",
  timeLimitSeconds: 180, // 3 minuti di tempo
  nextQuizId: "3", // ID del prossimo indovinello/locale
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
      points: 10,
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
    {
      id: "q3",
      questionText:
        "Quale ingrediente è fondamentale per il 'Bicerin', tipica bevanda torinese?",
      imageUrl: null,
      options: ["Caffè", "Vino", "Latte di mandorla", "Tè verde"],
      correctAnswerIndex: 0,
      points: 150,
    },
  ],
};

/**
 * Funzione "usa e getta" per creare un quiz a scelta multipla.
 * @param eventId L'ID dell'evento.
 * @param quizId L'ID (numerico o stringa) che avrà questo quiz.
 */
export const populateMultipleChoiceQuiz = async (eventId: string) => {
  const quizDocRef = collection(db, "events", eventId, "quiz");

  try {
    await addDoc(quizDocRef, multipleChoiceData);
    const message = `Quiz a scelta multipla creato con successo in events/${eventId}/quiz`;
    console.log(message);
    alert(message);
  } catch (error) {
    const errorMessage = `Errore durante la creazione del quiz: ${error}`;
    console.error(errorMessage);
    alert(errorMessage);
  }
};
