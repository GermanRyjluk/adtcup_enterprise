import { Feather as Icon } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { adminStyles } from "../styles/adminStyles"; // Usa stili admin per coerenza
import { styles } from "../styles/styles";
import { theme } from "../theme/theme";
import { PrimaryButton } from "./PrimaryButton";

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "confirmation";
  persistent?: boolean;
  onClose: () => void;
  actions?: {
    text: string;
    style?: "default" | "destructive";
    onPress: () => void;
  }[];
}

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  title,
  message,
  type,
  persistent,
  onClose,
  actions,
}) => {
  const [isRendered, setIsRendered] = useState(visible);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.spring(animValue, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(animValue, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setIsRendered(false);
        }
      });
    }
  }, [visible, animValue]);

  if (!isRendered) {
    return null;
  }

  const iconName =
    type === "success"
      ? "check-circle"
      : type === "error"
      ? "alert-circle"
      : type === "confirmation"
      ? "help-circle"
      : "info";
  const iconColor =
    type === "success"
      ? theme.colors.success
      : type === "error"
      ? theme.colors.error
      : theme.colors.textSecondary;

  const animatedContainerStyle = {
    transform: [{ scale: animValue }],
  };

  return (
    <View style={styles.modalBackdrop}>
      <Animated.View style={[styles.modalContainer, animatedContainerStyle]}>
        <Icon name={iconName} size={48} color={iconColor} />
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalMessage}>{message}</Text>

        {/* MODIFICA: Logica per mostrare i pulsanti di azione */}
        {actions && actions.length > 0 ? (
          <View style={adminStyles.modalActionsContainer}>
            <TouchableOpacity
              style={[
                adminStyles.modalActionButton,
                adminStyles.modalCancelButton,
              ]}
              onPress={onClose}
            >
              <Text style={adminStyles.modalActionButtonText}>Annulla</Text>
            </TouchableOpacity>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  adminStyles.modalActionButton,
                  action.style === "destructive"
                    ? adminStyles.modalDestructiveButton
                    : adminStyles.modalConfirmButton,
                ]}
                onPress={action.onPress}
              >
                <Text style={adminStyles.modalActionButtonText}>
                  {action.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : persistent ? (
          <PrimaryButton
            title="Chiudi"
            onPress={onClose}
            style={{ marginTop: theme.spacing.lg, width: "100%" }}
          />
        ) : null}
      </Animated.View>
    </View>
  );
};
