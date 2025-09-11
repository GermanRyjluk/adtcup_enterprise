import React from "react";
import { View, TextInput, TextInputProps } from "react-native";
import { Feather as Icon } from "@expo/vector-icons";

// --- Importazioni Locali ---
import { theme } from "../theme/theme";
import { styles } from "../styles/styles";

/**
 * @interface StyledInputProps
 * Estende le props standard di TextInput e aggiunge la nostra prop `icon`.
 */
interface StyledInputProps extends TextInputProps {
  /**
   * Il nome di un'icona dalla libreria Feather Icons da mostrare
   * all'interno del campo di input.
   */
  icon: keyof typeof Icon.glyphMap;
}

/**
 * @component StyledInput
 * Un componente TextInput personalizzato che include un'icona e uno stile
 * coerente con il tema dell'applicazione.
 */
export const StyledInput: React.FC<StyledInputProps> = ({
  icon,
  style,
  ...props
}) => {
  return (
    <View style={styles.inputContainer}>
      <Icon
        name={icon}
        size={20}
        color={theme.colors.textSecondary}
        style={styles.inputIcon}
      />
      <TextInput
        style={[styles.input, style]} // Permette di sovrascrivere lo stile se necessario
        placeholderTextColor={theme.colors.textSecondary}
        {...props} // Passa tutte le altre props (value, onChangeText, etc.) al TextInput
      />
    </View>
  );
};
