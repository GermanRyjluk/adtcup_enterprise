import { DefaultTheme } from "@react-navigation/native";
import { Dimensions } from "react-native";

// Ottiene le dimensioni dello schermo per un uso futuro (es. card responsive)
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

/**
 * @constant theme
 * L'oggetto principale che contiene tutti i "design tokens" dell'applicazione.
 * Centralizzare questi valori garantisce coerenza visiva e facilita la manutenzione.
 */
export const theme = {
  colors: {
    // backgroundStart: "#191D3A",
    backgroundStart: "#040037ff",
    backgroundEnd: "#040037ff",
    textPrimary: "#EAEAEA",
    textSecondary: "#B0B0B0",
    accentPrimary: "#FFC107",
    cardBackground: "#4f4869ff",
    success: "#2ecc71",
    error: "#e74c3c",
    inputBackground: "rgba(255, 255, 255, 0.1)",
    disabled: "#787586",
  },
  fonts: {
    primary: {
      regular: "Poppins_400Regular", // Nomi dei font come verranno caricati con expo-font
      medium: "Poppins_500Medium",
      bold: "Poppins_700Bold",
      extraBold: "Poppins_800ExtraBold",
    },
    secondary: {
      bold: "PlayfairDisplay_700Bold",
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 999,
  },
};

/**
 * @constant navigationTheme
 * Un oggetto tema specifico per React Navigation.
 * Estende il tema di default ma imposta lo sfondo come trasparente.
 * Questo permette al gradiente definito in App.tsx di essere visibile
 * su tutte le schermate, invece di essere coperto da uno sfondo bianco.
 */
export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
  },
};
