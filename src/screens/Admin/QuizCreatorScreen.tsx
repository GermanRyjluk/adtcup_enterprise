import { Feather as Icon } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as Clipboard from "expo-clipboard";
import { DocumentData, Unsubscribe } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  adminDeleteHint,
  adminDeleteQuiz,
  createOrUpdateQuiz,
  QuizData,
} from "../../api/adminService";
import { listenToClues } from "../../api/clueService";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ModalContext } from "../../contexts/ModalContext";
import { adminStyles } from "../../styles/adminStyles";
import { theme } from "../../theme/theme";

// Definiamo le props che il nostro componente riceverà
interface QuizCreatorProps {
  eventId: string | null;
  initialData: DocumentData | null;
  onClose: () => void;
}

const DEFAULT_QUIZ_DATA: QuizData = {
  id: "",
  type: "riddle",
  nextQuizId: "",
  currentRiddleNumber: 1,
  totalRiddles: 10,
  // Riddle
  clueIntervalSeconds: 300,
  maxClues: 3,
  message: "",
  photo: "",
  hints: [],
  // Location
  address: "",
  description: "",
  locationName: "",
  mapsLink: "",
  openingHours: "",
  // Multiple Choice
  timeLimitSeconds: 120,
  questions: [],
  // Leaderboard
  sourceQuizId: "",
  title: "",
  totalQuestions: 0,
};

// Esportiamo il componente con il nome "QuizCreator" invece che come default
export const QuizCreator: React.FC<QuizCreatorProps> = ({
  eventId,
  initialData,
  onClose,
}) => {
  const modal = useContext(ModalContext);
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData>(DEFAULT_QUIZ_DATA);

  // Popola il form se stiamo modificando un quiz esistente
  useEffect(() => {
    if (initialData) {
      // Uniamo i dati iniziali con quelli di default per evitare campi undefined
      setQuizData({ ...DEFAULT_QUIZ_DATA, ...initialData });
    } else {
      setQuizData(DEFAULT_QUIZ_DATA);
    }
  }, [initialData]);

  // Carica gli indizi se stiamo modificando un quiz di tipo "riddle"
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    if (
      initialData &&
      eventId &&
      initialData.id &&
      initialData.type === "riddle"
    ) {
      unsubscribe = listenToClues(eventId, initialData.id, (fetchedHints) => {
        setField("hints", fetchedHints);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initialData, eventId]);

  const setField = (field: keyof QuizData, value: any) => {
    setQuizData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!quizData.id || !eventId) {
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: "L'ID del quiz e dell'evento sono obbligatori.",
      });
      return;
    }
    setLoading(true);
    try {
      await createOrUpdateQuiz(eventId, quizData);
      modal?.showModal({
        type: "success",
        title: "Successo",
        message: "Quiz salvato correttamente!",
      });
      onClose(); // Chiude il modale dopo il salvataggio
    } catch (error: any) {
      modal?.showModal({
        type: "error",
        title: "Errore di Salvataggio",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!eventId || !initialData) return;

    Alert.alert(
      "Conferma Eliminazione",
      `Sei sicuro di voler eliminare il quiz "${initialData.id}"? Questa azione è irreversibile.`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await adminDeleteQuiz(eventId, initialData.id);
              modal?.showModal({
                type: "success",
                title: "Quiz Eliminato",
                message: "Il quiz è stato rimosso con successo.",
              });
              onClose();
            } catch (error: any) {
              modal?.showModal({
                type: "error",
                title: "Errore",
                message: `Impossibile eliminare il quiz: ${error.message}`,
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // --- Helpers per Hints ---
  const addHint = () => {
    const newHints = [...(quizData.hints || []), { message: "", photo: "" }];
    setField("hints", newHints);
  };

  const updateHint = (
    index: number,
    field: "message" | "photo",
    value: string
  ) => {
    const newHints = JSON.parse(JSON.stringify(quizData.hints || []));
    newHints[index][field] = value;
    setField("hints", newHints);
  };

  const removeHint = (index: number) => {
    const hintToRemove = quizData.hints?.[index];
    if (!hintToRemove || !hintToRemove.id) {
      // Se l'indizio non è ancora stato salvato, lo rimuove solo localmente
      const newHints = [...(quizData.hints || [])];
      newHints.splice(index, 1);
      setField("hints", newHints);
      return;
    }

    if (!eventId || !quizData.id) return;

    Alert.alert(
      "Conferma Eliminazione Indizio",
      `Sei sicuro di voler eliminare l'indizio #${index + 1}?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            try {
              // Chiama la nuova funzione per cancellare dal database
              await adminDeleteHint(eventId, quizData.id, hintToRemove.id);
              // Il listener (useEffect) aggiornerà automaticamente la UI
              modal?.showModal({
                type: "success",
                title: "Indizio Eliminato",
                message: "L'indizio è stato rimosso.",
              });
            } catch (error: any) {
              modal?.showModal({
                type: "error",
                title: "Errore",
                message: `Impossibile eliminare l'indizio: ${error.message}`,
              });
            }
          },
        },
      ]
    );
  };

  // --- Helpers per Questions ---
  const addQuestion = () => {
    const newQuestions = [
      ...(quizData.questions || []),
      {
        id: `q${(quizData.questions?.length || 0) + 1}`,
        questionText: "",
        imageUrl: "",
        options: ["", "", "", ""],
        correctAnswerIndex: 0,
        points: 100,
      },
    ];
    setField("questions", newQuestions);
  };

  const updateQuestion = (qIndex: number, field: string, value: any) => {
    const newQuestions = JSON.parse(JSON.stringify(quizData.questions || []));
    newQuestions[qIndex][field] = value;
    setField("questions", newQuestions);
  };

  const removeQuestion = (qIndex: number) => {
    const newQuestions = [...(quizData.questions || [])];
    newQuestions.splice(qIndex, 1);
    setField("questions", newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = JSON.parse(JSON.stringify(quizData.questions || []));
    newQuestions[qIndex].options[oIndex] = value;
    setField("questions", newQuestions);
  };

  // Funzione per copiare il testo e mostrare un feedback
  const copyToClipboard = async (text: string) => {
    if (!text) return; // Non fare nulla se il testo è vuoto
    await Clipboard.setStringAsync(text);
    modal?.showModal({
      type: "success",
      title: "Copiato!",
      message: `L'ID "${text}" è stato copiato negli appunti.`,
    });
  };

  return (
    <>
      <ScrollView style={adminStyles.adminContainer}>
        {/* --- Sezione Campi Comuni --- */}
        <View style={adminStyles.adminSection}>
          <Text style={adminStyles.adminSectionTitle}>
            Impostazioni Generali
          </Text>
          <View style={adminStyles.adminRow}>
            <Text style={adminStyles.adminLabel}>Quiz ID</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <TextInput
                style={[adminStyles.adminInput, { flex: 1 }]}
                value={quizData.id}
                onChangeText={(val) => setField("id", val)}
                placeholder="es. 1, 2, 3a..."
                editable={!initialData}
              />
              <TouchableOpacity
                onPress={() => copyToClipboard(quizData.id)}
                style={{ paddingLeft: theme.spacing.md }}
              >
                <Icon
                  name="copy"
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={adminStyles.adminRow}>
            <Text style={adminStyles.adminLabel}>Tipo Quiz</Text>
            <Picker
              selectedValue={quizData.type}
              onValueChange={(itemValue) => setField("type", itemValue)}
              style={adminStyles.adminInput}
              dropdownIconColor={theme.colors.textPrimary}
            >
              <Picker.Item label="Indovinello (Riddle)" value="riddle" />
              <Picker.Item label="Luogo (Location)" value="location" />
              <Picker.Item
                label="Scelta Multipla (Quiz)"
                value="multipleChoice"
              />
              <Picker.Item
                label="Classifica Quiz (Leaderboard)"
                value="multipleChoiceLeaderboard"
              />
            </Picker>
          </View>
          <View style={adminStyles.adminRow}>
            <Text style={adminStyles.adminLabel}>Prossimo Quiz ID</Text>
            <TextInput
              style={adminStyles.adminInput}
              value={quizData.nextQuizId}
              onChangeText={(val) => setField("nextQuizId", val)}
              placeholder="ID della tappa successiva"
            />
          </View>
          <View style={adminStyles.adminRow}>
            <Text style={adminStyles.adminLabel}>Numero Tappa</Text>
            <TextInput
              style={adminStyles.adminInput}
              value={String(quizData.currentRiddleNumber)}
              onChangeText={(val) =>
                setField("currentRiddleNumber", Number(val))
              }
              keyboardType="numeric"
            />
          </View>
          <View style={adminStyles.adminRow}>
            <Text style={adminStyles.adminLabel}>Tappe Totali</Text>
            <TextInput
              style={adminStyles.adminInput}
              value={String(quizData.totalRiddles)}
              onChangeText={(val) => setField("totalRiddles", Number(val))}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* --- Sezione RIDDLE --- */}
        {quizData.type === "riddle" && (
          <View style={adminStyles.adminSection}>
            <Text style={adminStyles.adminSectionTitle}>
              Dettagli Indovinello
            </Text>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Messaggio</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={quizData.message}
                onChangeText={(val) => setField("message", val)}
                multiline
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>URL Foto</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={quizData.photo}
                onChangeText={(val) => setField("photo", val)}
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Intervallo Indizi (s)</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={String(quizData.clueIntervalSeconds)}
                onChangeText={(val) =>
                  setField("clueIntervalSeconds", Number(val))
                }
                keyboardType="numeric"
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Max Indizi</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={String(quizData.maxClues)}
                onChangeText={(val) => setField("maxClues", Number(val))}
                keyboardType="numeric"
              />
            </View>

            <View style={adminStyles.adminSubSection}>
              <View style={adminStyles.adminSubHeader}>
                <Text style={adminStyles.adminSubTitle}>Indizi (Hints)</Text>
                <PrimaryButton title="Aggiungi" icon="plus" onPress={addHint} />
              </View>
              {quizData.hints?.map((hint, index) => (
                <View
                  key={index}
                  style={[
                    adminStyles.adminListItem,
                    { flexDirection: "column" },
                  ]}
                >
                  <View
                    style={{
                      ...adminStyles.adminRow,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <Text style={{ ...adminStyles.adminLabel, width: 80 }}>
                      Testo #{index + 1}
                    </Text>
                    <TextInput
                      style={adminStyles.adminSmallInput}
                      value={hint.message}
                      onChangeText={(val) => updateHint(index, "message", val)}
                      multiline
                    />
                    <TouchableOpacity
                      style={adminStyles.removeButton}
                      onPress={() => removeHint(index)}
                    >
                      <Icon
                        name="trash-2"
                        size={20}
                        color={theme.colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={{ ...adminStyles.adminRow, marginBottom: 0 }}>
                    <Text style={{ ...adminStyles.adminLabel, width: 80 }}>
                      Foto #{index + 1}
                    </Text>
                    <TextInput
                      style={adminStyles.adminSmallInput}
                      value={hint.photo}
                      onChangeText={(val) => updateHint(index, "photo", val)}
                      placeholder="URL Immagine (opzionale)"
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* --- Sezione LOCATION --- */}
        {quizData.type === "location" && (
          <View style={adminStyles.adminSection}>
            <Text style={adminStyles.adminSectionTitle}>Dettagli Luogo</Text>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Nome Luogo</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={quizData.locationName}
                onChangeText={(val) => setField("locationName", val)}
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Indirizzo</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={quizData.address}
                onChangeText={(val) => setField("address", val)}
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Descrizione</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={quizData.description}
                onChangeText={(val) => setField("description", val)}
                multiline
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Orari</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={quizData.openingHours}
                onChangeText={(val) => setField("openingHours", val)}
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Link Google Maps</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={quizData.mapsLink}
                onChangeText={(val) => setField("mapsLink", val)}
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>URL Foto</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={quizData.photo}
                onChangeText={(val) => setField("photo", val)}
              />
            </View>
          </View>
        )}

        {/* --- Sezione MULTIPLECHOICE --- */}
        {quizData.type === "multipleChoice" && (
          <View style={adminStyles.adminSection}>
            <Text style={adminStyles.adminSectionTitle}>
              Dettagli Quiz a Scelta Multipla
            </Text>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Tempo Limite (s)</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={String(quizData.timeLimitSeconds)}
                onChangeText={(val) =>
                  setField("timeLimitSeconds", Number(val))
                }
                keyboardType="numeric"
              />
            </View>

            <View style={adminStyles.adminSubSection}>
              <View style={adminStyles.adminSubHeader}>
                <Text style={adminStyles.adminSubTitle}>Domande</Text>
                <PrimaryButton
                  title="Aggiungi"
                  icon="plus"
                  onPress={addQuestion}
                />
              </View>
              {quizData.questions?.map((q, qIndex) => (
                <View
                  key={q.id}
                  style={[
                    adminStyles.adminListItem,
                    { flexDirection: "column" },
                  ]}
                >
                  <View
                    style={{
                      ...adminStyles.adminRow,
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={adminStyles.adminSubTitle}>
                      Domanda #{qIndex + 1}
                    </Text>
                    <TouchableOpacity
                      style={adminStyles.removeButton}
                      onPress={() => removeQuestion(qIndex)}
                    >
                      <Icon
                        name="trash-2"
                        size={20}
                        color={theme.colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={{
                      ...adminStyles.adminSmallInput,
                      flex: 0,
                      marginBottom: 10,
                      width: "100%",
                    }}
                    placeholder="Testo Domanda"
                    value={q.questionText}
                    onChangeText={(val) =>
                      updateQuestion(qIndex, "questionText", val)
                    }
                    multiline
                  />
                  <TextInput
                    style={{
                      ...adminStyles.adminSmallInput,
                      flex: 0,
                      marginBottom: 10,
                      width: "100%",
                    }}
                    placeholder="URL Immagine (opzionale)"
                    value={q.imageUrl}
                    onChangeText={(val) =>
                      updateQuestion(qIndex, "imageUrl", val)
                    }
                  />
                  {q.options.map((opt: string, oIndex: number) => (
                    <View
                      key={oIndex}
                      style={{
                        ...adminStyles.adminRow,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      <Text
                        style={{
                          ...adminStyles.adminLabel,
                          width: 80,
                          fontSize: 12,
                        }}
                      >
                        Opzione {oIndex + 1}
                      </Text>
                      <TextInput
                        style={adminStyles.adminSmallInput}
                        value={opt}
                        onChangeText={(val) =>
                          updateOption(qIndex, oIndex, val)
                        }
                      />
                    </View>
                  ))}
                  <View style={adminStyles.adminRow}>
                    <Text style={{ ...adminStyles.adminLabel, width: 120 }}>
                      Risposta Corretta
                    </Text>
                    <Picker
                      selectedValue={q.correctAnswerIndex}
                      onValueChange={(val) =>
                        updateQuestion(qIndex, "correctAnswerIndex", val)
                      }
                      style={[adminStyles.adminSmallInput]}
                      dropdownIconColor={theme.colors.textPrimary}
                    >
                      <Picker.Item label="Opzione 1" value={0} />
                      <Picker.Item label="Opzione 2" value={1} />
                      <Picker.Item label="Opzione 3" value={2} />
                      <Picker.Item label="Opzione 4" value={3} />
                    </Picker>
                  </View>
                  <View style={{ ...adminStyles.adminRow, marginBottom: 0 }}>
                    <Text style={{ ...adminStyles.adminLabel, width: 120 }}>
                      Punti
                    </Text>
                    <TextInput
                      style={adminStyles.adminSmallInput}
                      value={String(q.points)}
                      onChangeText={(val) =>
                        updateQuestion(qIndex, "points", Number(val))
                      }
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* --- Sezione MULTIPLECHOICELEADERBOARD --- */}
        {quizData.type === "multipleChoiceLeaderboard" && (
          <View style={adminStyles.adminSection}>
            <Text style={adminStyles.adminSectionTitle}>
              Dettagli Classifica Quiz
            </Text>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Titolo Schermata</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={quizData.title}
                onChangeText={(val) => setField("title", val)}
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>ID Quiz Sorgente</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={quizData.sourceQuizId}
                onChangeText={(val) => setField("sourceQuizId", val)}
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Domande Totali</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={String(quizData.totalQuestions)}
                onChangeText={(val) => setField("totalQuestions", Number(val))}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        <PrimaryButton
          title={initialData ? "Aggiorna Quiz" : "Salva Quiz"}
          onPress={handleSave}
          loading={loading && !initialData}
          style={{ marginHorizontal: theme.spacing.md }}
        />

        {initialData && (
          <TouchableOpacity
            style={adminStyles.deleteButton}
            onPress={handleDelete}
            disabled={loading}
          >
            {loading && initialData ? (
              <ActivityIndicator color={theme.colors.error} />
            ) : (
              <Text style={adminStyles.deleteButtonText}>Elimina Quiz</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
};
