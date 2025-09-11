import React, { useState, useCallback, useContext } from "react";
import {
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import {
  doc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// --- Importazioni Locali ---
import { db } from "../../config/firebaseConfig";
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { useFadeIn } from "../../hooks/animationHooks";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";
import { PrimaryButton } from "../../components/PrimaryButton";
import { StyledInput } from "../../components/StyledInput";

const CompleteProfileScreen: React.FC = () => {
  // Stato per i campi del form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);

  // Recupera l'utente corrente e la funzione per aggiornare lo stato del profilo dal context
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);
  const fadeInAnim = useFadeIn();

  const handleSaveProfile = useCallback(async () => {
    // 1. Validazione dei dati di input
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !age.trim()
    ) {
      modal?.showModal({
        type: "error",
        title: "Campi Obbligatori",
        message: "Per favore, compila tutti i campi per continuare.",
      });
      return;
    }

    // Controlla che l'utente sia effettivamente loggato
    if (!authContext?.user) {
      modal?.showModal({
        type: "error",
        title: "Errore Utente",
        message: "Nessun utente autenticato trovato. Riprova il login.",
      });
      return;
    }

    setLoading(true);

    try {
      // 2. Controllo unicità dello username su Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        modal?.showModal({
          type: "error",
          title: "Username non disponibile",
          message: "Questo nome utente è già stato scelto. Provane un altro.",
        });
        setLoading(false);
        return;
      }

      // 3. Creazione del documento utente su Firestore
      const userRef = doc(db, "users", authContext.user.uid);
      await setDoc(userRef, {
        uid: authContext.user.uid,
        email: authContext.user.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        age: parseInt(age, 10), // Converte l'età in numero
        createdAt: serverTimestamp(), // Aggiunge il timestamp di creazione
        role: "user", // Ruolo di default
      });

      // 4. Aggiorna lo stato globale dell'app per procedere
      authContext.completeProfile();
      // Non c'è bisogno di navigare manualmente, il cambio di stato in App.tsx
      // si occuperà di mostrare lo stack di navigazione corretto.
    } catch (error) {
      console.error("Errore durante la creazione del profilo:", error);
      modal?.showModal({
        type: "error",
        title: "Errore di Salvataggio",
        message: "Non è stato possibile salvare il tuo profilo. Riprova.",
      });
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, username, age, authContext, modal]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.authContainer}>
        <Animated.View style={[styles.authContent, fadeInAnim]}>
          <Text style={styles.authTitle}>Completa il tuo Profilo</Text>
          <Text style={styles.bodyText}>
            Queste informazioni saranno visibili ai tuoi compagni di squadra.
          </Text>

          <StyledInput
            icon="user"
            placeholder="Nome"
            value={firstName}
            onChangeText={setFirstName}
          />
          <StyledInput
            icon="users"
            placeholder="Cognome"
            value={lastName}
            onChangeText={setLastName}
          />
          <StyledInput
            icon="hash"
            placeholder="Nome Utente (unico)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <StyledInput
            icon="calendar"
            placeholder="Età"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />

          <PrimaryButton
            title="Salva e Continua"
            onPress={handleSaveProfile}
            loading={loading}
            style={{ marginTop: theme.spacing.md }}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CompleteProfileScreen;
