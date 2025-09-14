import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { styles } from "../styles/styles";
import { theme } from "../theme/theme";

interface DistanceIndicatorProps {
  /** La distanza attuale in metri. Null se in fase di calcolo. */
  distance: number | null;
  /** La soglia in metri per essere considerati "in zona". */
  threshold: number;
}

/**
 * Un componente UI che mostra un feedback visuale sulla distanza
 * dell'utente da un punto di partenza.
 */
export const DistanceIndicator: React.FC<DistanceIndicatorProps> = ({
  distance,
  threshold,
}) => {
  // Caso 1: La posizione è ancora in fase di calcolo
  if (distance === null) {
    return (
      <View style={styles.distanceIndicatorContainer}>
        <ActivityIndicator size="small" color={theme.colors.textSecondary} />
        <Text
          style={[
            styles.distanceIndicatorText,
            { color: theme.colors.textSecondary },
          ]}
        >
          Calcolo posizione in corso...
        </Text>
      </View>
    );
  }

  const isReady = distance <= threshold;

  // Caso 2: L'utente è o non è nel raggio corretto
  return (
    <View
      style={[
        styles.distanceIndicatorContainer,
        isReady
          ? styles.distanceIndicatorReady
          : styles.distanceIndicatorNotReady,
      ]}
    >
      <Icon
        name={isReady ? "check-circle" : "x-circle"}
        size={20}
        color={isReady ? theme.colors.success : theme.colors.error}
      />
      <Text
        style={[
          styles.distanceIndicatorText,
          { color: isReady ? theme.colors.success : theme.colors.error },
        ]}
      >
        {isReady
          ? "Sei nell'area di partenza!"
          : `Sei a ${Math.round(distance)} metri, avvicinati`}
      </Text>
    </View>
  );
};
