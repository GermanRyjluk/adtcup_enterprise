import React, { useCallback, useContext, useState } from "react";
import {
  Text,
  View,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { sendEmailVerification } from "firebase/auth";

// --- Importazioni Locali ---
import { useFadeIn } from "../../hooks/animationHooks";
import { theme } from "../../theme/theme";
import { styles } from "../../styles/styles";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { AuthNavigationProps } from "../../navigation/types";
import { auth } from "../../config/firebaseConfig";

// CORREZIONE: Il tipo delle props è direttamente AuthNavigationProps, non un oggetto che lo contiene.
type VerifyEmailScreenProps = AuthNavigationProps<"VerifyEmail">;

const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({
  navigation,
}) => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const fadeInAnim = useFadeIn();

  // Funzione per controllare lo stato di verifica dell'email
  const checkVerificationStatus = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setIsChecking(true);
    try {
      // Ricarica lo stato dell'utente da Firebase per ottenere il valore più recente di emailVerified
      await currentUser.reload();

      // Controlla se l'email è stata verificata dopo il ricaricamento
      if (currentUser.emailVerified) {
        // Se l'email è verificata, procedi a completare il profilo
      } else {
        // Altrimenti, informa l'utente
        modal?.showModal({
          type: "info",
          title: "Verifica in sospeso",
          message:
            "Non abbiamo ancora registrato la tua verifica. Controlla la tua casella di posta (anche lo spam) e clicca sul link.",
        });
      }
    } catch (error) {
      console.error("Errore durante la verifica dell'email:", error);
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: "Si è verificato un errore. Riprova.",
      });
    } finally {
      setIsChecking(false);
    }
  }, [navigation, modal]);

  // Funzione per rinviare l'email di verifica
  const handleResendEmail = useCallback(async () => {
    const currentUser = authContext?.user;
    if (!currentUser) {
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: "Nessun utente trovato. Riprova il login.",
      });
      return;
    }

    setIsResending(true);
    try {
      await sendEmailVerification(currentUser);
      modal?.showModal({
        type: "success",
        title: "Email Inviata!",
        message:
          "Abbiamo inviato una nuova email di verifica al tuo indirizzo.",
      });
    } catch (error: any) {
      console.error("Errore durante il rinvio dell'email:", error);
      const message =
        error.code === "auth/too-many-requests"
          ? "Hai richiesto l'invio troppe volte. Riprova tra qualche minuto."
          : "Impossibile inviare l'email. Riprova.";
      modal?.showModal({ type: "error", title: "Errore", message });
    } finally {
      setIsResending(false);
    }
  }, [authContext?.user, modal]);

  return (
    <View style={styles.centeredContainer}>
      <Animated.View
        style={[styles.authContent, { alignItems: "center" }, fadeInAnim]}
      >
        <Icon name="mail" size={80} color={theme.colors.accentPrimary} />
        <Text style={[styles.authTitle, { marginTop: theme.spacing.lg }]}>
          Controlla la tua email
        </Text>
        <Text style={styles.bodyText}>
          Ti abbiamo inviato un link di verifica. Cliccalo per attivare il tuo
          account e torna qui per continuare.
        </Text>

        <PrimaryButton
          title="Ho verificato!"
          onPress={checkVerificationStatus}
          loading={isChecking}
          style={{ width: "100%", marginTop: theme.spacing.xl }}
        />

        <TouchableOpacity
          onPress={handleResendEmail}
          disabled={isResending}
          style={{ marginTop: theme.spacing.lg }}
        >
          {isResending ? (
            <ActivityIndicator color={theme.colors.textSecondary} />
          ) : (
            <Text style={styles.textButton}>Non hai ricevuto la mail?</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default VerifyEmailScreen;
