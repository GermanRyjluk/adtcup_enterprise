import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";
import { Feather as Icon } from "@expo/vector-icons";

// --- Importazioni Locali ---
import { theme } from "../theme/theme";
import { styles } from "../styles/styles";
import { PrimaryButton } from "./PrimaryButton";

/**
 * @interface CustomModalProps
 * Definisce le props che il componente CustomModal riceve.
 */
interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "info";
  persistent?: boolean;
  onClose: () => void;
}

/**
 * @component CustomModal
 * Un componente modale a schermo intero per mostrare messaggi all'utente.
 * È progettato per essere controllato da un provider di contesto.
 */
export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  title,
  message,
  type,
  persistent,
  onClose,
}) => {
  // Stato per controllare se il componente deve essere renderizzato.
  // Serve per permettere all'animazione di uscita di completarsi prima di smontare il componente.
  const [isRendered, setIsRendered] = useState(visible);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Se il modale deve apparire, lo renderizziamo subito.
      setIsRendered(true);
      Animated.spring(animValue, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    } else {
      // Se il modale deve scomparire, avviamo l'animazione di uscita.
      Animated.spring(animValue, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true,
      }).start(({ finished }) => {
        // Solo quando l'animazione è finita, smontiamo il componente.
        if (finished) {
          setIsRendered(false);
        }
      });
    }
  }, [visible, animValue]);

  // Ottimizzazione: non renderizzare nulla se lo stato isRendered è false.
  if (!isRendered) {
    return null;
  }

  // Scegli l'icona e il colore in base al tipo di modale
  const iconName =
    type === "success"
      ? "check-circle"
      : type === "error"
      ? "alert-circle"
      : "info";
  const iconColor =
    type === "success"
      ? theme.colors.success
      : type === "error"
      ? theme.colors.error
      : theme.colors.textSecondary;

  // Stile animato per la scala del contenitore del modale
  const animatedContainerStyle = {
    transform: [{ scale: animValue }],
  };

  return (
    <View style={styles.modalBackdrop}>
      <Animated.View style={[styles.modalContainer, animatedContainerStyle]}>
        <Icon name={iconName} size={48} color={iconColor} />
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalMessage}>{message}</Text>
        {/* Mostra il bottone solo se il modal è persistente */}
        {persistent && (
          <PrimaryButton
            title="Chiudi"
            onPress={onClose}
            style={{ marginTop: theme.spacing.lg, width: "100%" }}
          />
        )}
      </Animated.View>
    </View>
  );
};
