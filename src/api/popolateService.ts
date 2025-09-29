import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

// --- Dati di Esempio ---

const gioco1Points = [20, 17, 14, 11, 9, 7, 6, 5, 4, 4, 4];
const gioco2Points = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

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
  timeLimitSeconds: 480,
  nextQuizId: "PQfU1YcScYTu82RlCQE6",
  currentRiddleNumber: 4,
  totalRiddles: 11,
  points: gioco1Points,
  questions: [
    {
      id: "q1",
      questionText: "Qual è la valuta del Giappone?",
      imageUrl: null,
      options: ["Won", "Yen", "Yuan", "Ringgit"],
      correctAnswerIndex: 1,
      points: 0,
    },
    {
      id: "q2",
      questionText: "Quanti cuori ha un polpo?",
      imageUrl: null,
      options: ["1 cuore", "2 cuori", "3 cuori", "4 cuori"],
      correctAnswerIndex: 2,
      points: 0,
    },
    {
      id: "q3",
      questionText:
        "Una lumaca deve salire un pozzo di 10 metri. Di giorno sale 3 metri, di notte scivola giù di 2 metri. In quanti giorni riesce a salire?",
      imageUrl: null,
      options: ["10 giorni", "5 giorni", "7 giorni", "8 giorni"],
      correctAnswerIndex: 3,
      points: 0,
    },
    {
      id: "q4",
      questionText:
        'Chi ha dipinto "La persistenza della memoria" con gli orologi che si sciolgono?',
      imageUrl: null,
      options: [
        "Salvador Dalí",
        "Vincent van Gogh",
        "Pablo Picasso",
        "René Magritte",
      ],
      correctAnswerIndex: 0,
      points: 0,
    },
    {
      id: "q5",
      questionText: "In che anno è stato inviato il primo SMS della storia?",
      imageUrl: null,
      options: ["1988", "1990", "1992", "1995"],
      correctAnswerIndex: 2,
      points: 0,
    },
    {
      id: "q6",
      questionText: "Qual è l'elemento chimico più abbondante nell'universo?",
      imageUrl: null,
      options: ["Ossigeno", "Carbonio", "Elio", "Idrogeno"],
      correctAnswerIndex: 3,
      points: 0,
    },
    {
      id: "q7",
      questionText:
        "Hai 3 porte. Dietro una c'è un'auto, dietro le altre capre. Scegli la porta 1. Il presentatore apre la porta 3 (con una capra). Ti conviene cambiare alla porta 2?",
      imageUrl: null,
      options: [
        "No, le probabilità sono sempre 50/50",
        "Sì, la porta 2 ha 2/3 di probabilità",
        "È indifferente",
        "Dipende da cosa preferisci",
      ],
      correctAnswerIndex: 1,
      points: 0,
    },
    {
      id: "q8",
      questionText: 'Chi ha scritto "Moby Dick"?',
      imageUrl: null,
      options: [
        "Mark Twain",
        "Herman Melville",
        "F. Scott Fitzgerald",
        "Ernest Hemingway",
      ],
      correctAnswerIndex: 1,
      points: 0,
    },
    {
      id: "q9",
      questionText: "Qual è il più lungo fiume che passa per l’Europa?",
      imageUrl: null,
      options: ["Volga", "Reno", "Danubio", "Elba"],
      correctAnswerIndex: 0,
      points: 0,
    },
    {
      id: "q10",
      questionText: "Qual è l'unico mammifero capace di volo attivo?",
      imageUrl: null,
      options: [
        "Lo scoiattolo volante",
        "Il pipistrello",
        "Il petauro",
        "Nessun mammifero può volare",
      ],
      correctAnswerIndex: 1,
      points: 0,
    },
    {
      id: "q11",
      questionText:
        "Se ogni taglio richiede lo stesso tempo (5 minuti), quanti minuti servono per dividere una torta in 8 pezzi (non puoi spostare i pezzi)?",
      imageUrl: null,
      options: ["20 minuti", "25 minuti", "35 minuti", "15 minuti"],
      correctAnswerIndex: 3,
      points: 0,
    },
    {
      id: "q12",
      questionText: "Quale pianeta ha il giorno più lungo del sistema solare?",
      imageUrl: null,
      options: ["Giove", "Saturno", "Venere", "Mercurio"],
      correctAnswerIndex: 2,
      points: 0,
    },
    {
      id: "q13",
      questionText: "In che anno è stata fondata l'Unione Europea?",
      imageUrl: null,
      options: ["1945", "1957", "1968", "1993"],
      correctAnswerIndex: 3,
      points: 0,
    },
    {
      id: "q14",
      questionText:
        "Hai 12 palline identiche, ma una pesa diversamente. Con una bilancia a due piatti, quante pesate ti servono AL MINIMO per essere sicuro di trovarla?",
      imageUrl: null,
      options: ["2 pesate", "3 pesate", "4 pesate", "6 pesate"],
      correctAnswerIndex: 1,
      points: 0,
    },
    {
      id: "q15",
      questionText:
        'Quale compositore è noto per la sua opera "Il Barbiere di Siviglia"?',
      imageUrl: null,
      options: [
        "Giuseppe Verdi",
        "Wolfgang Amadeus Mozart",
        "Gioachino Rossini",
        "Richard Wagner",
      ],
      correctAnswerIndex: 2,
      points: 0,
    },
    {
      id: "q16",
      questionText:
        'In "1984" di Orwell, come si chiama la lingua artificiale creata per limitare il pensiero?',
      imageUrl: null,
      options: ["Neolingua", "Metalingua", "Doublespeak", "Thoughtspeak"],
      correctAnswerIndex: 0,
      points: 0,
    },
    {
      id: "q17",
      questionText: "Qual è l'osso più lungo del corpo umano?",
      imageUrl: null,
      options: ["Tibia", "Omero", "Radio", "Femore"],
      correctAnswerIndex: 3,
      points: 0,
    },
    {
      id: "q18",
      questionText:
        "Un cubo colorato in superficie ha ogni spigolo di 3 cm. Se lo tagli con 2 piani paralleli per ognuna delle tre direzioni, quanti cubetti hanno esattamente due facce colorata?",
      imageUrl: null,
      options: ["6", "8", "12", "0"],
      correctAnswerIndex: 2,
      points: 0,
    },
    {
      id: "q19",
      questionText:
        "Qual è l'unico cibo che non si deteriora mai se conservato correttamente?",
      imageUrl: null,
      options: ["Il sale", "Il riso", "L'olio d'oliva", "Il miele"],
      correctAnswerIndex: 3,
      points: 0,
    },
    {
      id: "q20",
      questionText: "Qual è il pianeta più vicino al Sole?",
      imageUrl: null,
      options: ["Mercurio", "Terra", "Venere", "Marte"],
      correctAnswerIndex: 0,
      points: 0,
    },
    {
      id: "q21",
      questionText:
        "Qual è il numero minimo di persone che devono essere presenti in una stanza affinché la probabilità che almeno due di esse compiano gli anni nello stesso giorno sia superiore al 50%?",
      imageUrl: null,
      options: ["15 persone", "30 persone", "23 persone", "50 persone"],
      correctAnswerIndex: 2,
      points: 0,
    },
    {
      id: "q22",
      questionText: "Quale di queste lingue NON usa l'alfabeto latino?",
      imageUrl: null,
      options: ["Vietnamita", "Turco", "Indonesiano", "Hindi"],
      correctAnswerIndex: 3,
      points: 0,
    },
    {
      id: "q23",
      questionText: "Qual è la capitale della Nuova Zelanda?",
      imageUrl: null,
      options: ["Auckland", "Wellington", "Christchurch", "Dunedin"],
      correctAnswerIndex: 1,
      points: 0,
    },
    {
      id: "q24",
      questionText:
        "Quale percentuale del consumo energetico totale del corpo umano utilizza il cervello?",
      imageUrl: null,
      options: ["5%", "10%", "20%", "35%"],
      correctAnswerIndex: 2,
      points: 0,
    },
    {
      id: "q25",
      questionText: "Qual è il numero atomico del carbonio?",
      imageUrl: null,
      options: ["6", "12", "14", "8"],
      correctAnswerIndex: 0,
      points: 0,
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
