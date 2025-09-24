import { Feather as Icon } from "@expo/vector-icons";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useCallback, useContext, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";

// --- Importazioni Locali ---
import { PrimaryButton } from "../../components/PrimaryButton";
import { StyledInput } from "../../components/StyledInput";
import { auth } from "../../config/firebaseConfig";
import { ModalContext } from "../../contexts/ModalContext";
import { useFadeIn } from "../../hooks/animationHooks";
import { AuthNavigationProps } from "../../navigation/types";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";

// Definiamo i tipi per le props del componente
type RestorePasswordScreenProps = AuthNavigationProps<"RestorePassword">;

const RestorePasswordScreen: React.FC<RestorePasswordScreenProps> = ({
  navigation,
}) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const modal = useContext(ModalContext);
  const fadeInAnim = useFadeIn();

  const handlePasswordReset = useCallback(async () => {
    if (!email.trim()) {
      modal?.showModal({
        type: "error",
        title: "Campo Obbligatorio",
        message: "Per favore, inserisci il tuo indirizzo email.",
      });
      return;
    }

    setLoading(true);
    try {
      // Chiama la funzione di Firebase per inviare l'email di reset
      await sendPasswordResetEmail(auth, email);

      // Mostra un messaggio di successo
      modal?.showModal({
        type: "success",
        title: "Email Inviata!",
        message:
          "Controlla la tua casella di posta per le istruzioni su come reimpostare la password.",
      });

      // Dopo un breve ritardo, torna alla schermata di login
      setTimeout(() => {
        navigation.goBack();
      }, 2500);
    } catch (error) {
      let title = "Errore";
      let message = "Si è verificato un errore. Riprova.";

      // Controlla se l'errore è di tipo Firebase e se l'utente non esiste
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "auth/user-not-found"
      ) {
        title = "Utente non trovato";
        message = "Nessun account trovato con questo indirizzo email.";
      } else {
        console.error("Errore nel reset password:", error);
      }
      modal?.showModal({ type: "error", title, message });
    } finally {
      setLoading(false);
    }
  }, [email, navigation, modal]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.authContainer}>
        <Animated.View style={[styles.authContent, fadeInAnim]}>
          <Text style={styles.authTitle}>Recupera Password</Text>
          <Text style={styles.bodyText}>
            Inserisci la tua email e ti invieremo le istruzioni per reimpostare
            la tua password.
          </Text>

          <StyledInput
            icon="mail"
            placeholder="La tua Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <PrimaryButton
            title="Invia Email di Recupero"
            onPress={handlePasswordReset}
            loading={loading}
            style={{ marginTop: theme.spacing.md }}
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: theme.spacing.lg }}
          >
            <Text style={styles.toggleAuthText}>
              <Icon name="arrow-left" size={14} /> Torna al Login
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RestorePasswordScreen;
