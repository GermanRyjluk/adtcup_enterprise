import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
  ActivityIndicator, // Importa ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";

// --- Importazioni Locali ---
import { theme } from "../theme/theme";
import { styles } from "../styles/styles";
import { AnimatedPressable } from "./AnimatedPressable";

/**
 * @interface PrimaryButtonProps
 * Definisce le props per il nostro bottone principale.
 */
interface PrimaryButtonProps {
  title: string;
  subtitle?: string; // PROP per il sottotitolo (es. countdown)
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Icon.glyphMap;
  style?: StyleProp<ViewStyle>;
}

/**
 * @component PrimaryButton
 * Il componente principale per le azioni "Call to Action" nell'app.
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  subtitle,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    if (!disabled && !loading) {
      animation.start();
    } else {
      animation.stop();
    }
    return () => animation.stop();
  }, [pulseAnim, disabled, loading]);

  const animatedStyle = {
    transform: [{ scale: pulseAnim }],
  };

  const isDisabled = loading || disabled;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.primaryButtonContainer,
        isDisabled && styles.primaryButtonDisabled, // Applica lo stile disabilitato
        animatedStyle,
        style,
      ]}
    >
      <LinearGradient
        // Usa un gradiente grigio se disabilitato
        colors={
          isDisabled
            ? [theme.colors.disabled, theme.colors.disabled]
            : [theme.colors.accentPrimary, "#FFB300"]
        }
        style={styles.primaryButtonGradient}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <View style={styles.footerButtonContent}>
            {icon && (
              <Icon
                name={icon}
                size={20}
                color="#000"
                style={{ marginRight: theme.spacing.sm }}
              />
            )}
            <View>
              <Text style={styles.primaryButtonText}>{title}</Text>
              {/* Mostra il sottotitolo solo se esiste */}
              {subtitle && (
                <Text style={styles.primaryButtonSubtitle}>{subtitle}</Text>
              )}
            </View>
          </View>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
};
