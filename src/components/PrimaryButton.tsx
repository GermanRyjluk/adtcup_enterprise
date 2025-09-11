import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
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
  subtitle?: string; // NUOVA PROP per il sottotitolo (es. countdown)
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
  subtitle, // Nuova prop
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

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        styles.primaryButtonContainer,
        (loading || disabled) && { opacity: 0.5 },
        animatedStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={[theme.colors.accentPrimary, "#FFB300"]}
        style={styles.primaryButtonGradient}
      >
        {loading ? (
          <Text style={styles.primaryButtonText}>Caricamento...</Text>
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
