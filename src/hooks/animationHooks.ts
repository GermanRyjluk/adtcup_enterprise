import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

/**
 * @hook useFadeIn
 * Un custom hook che gestisce un'animazione di entrata con effetto "fade-in" e "slide-up".
 * @param duration - La durata dell'animazione in millisecondi (default: 500ms).
 * @param delay - Il ritardo prima che l'animazione inizi (default: 0ms).
 * @returns Un oggetto stile animato da applicare a un componente `Animated.View`.
 */
export const useFadeIn = (duration = 500, delay = 0) => {
  // useRef viene usato per mantenere il valore animato tra i render senza scatenare nuovi render.
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animated.timing crea un'animazione basata sul tempo.
    Animated.timing(animValue, {
      toValue: 1, // Valore finale dell'animazione
      duration,
      delay,
      easing: Easing.out(Easing.cubic), // Effetto di easing per un movimento più naturale
      useNativeDriver: true, // Fondamentale per le performance: l'animazione viene eseguita sul thread nativo.
    }).start(); // Avvia l'animazione
  }, [animValue, duration, delay]);

  // Ritorna gli stili trasformati che verranno applicati al componente
  return {
    opacity: animValue, // L'opacità passa da 0 a 1
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0], // Il componente si sposta dal basso (20 pixel) verso l'alto (0)
        }),
      },
    ],
  };
};

/**
 * @hook useBounceIn
 * Un custom hook che gestisce un'animazione di entrata con effetto "bounce" (rimbalzo).
 * @param duration - La durata (approssimativa) dell'animazione (default: 600ms).
 * @param delay - Il ritardo prima che l'animazione inizi (default: 0ms).
 * @returns Un oggetto stile animato da applicare a un componente `Animated.View`.
 */
export const useBounceIn = (duration = 600, delay = 0) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animated.spring crea un'animazione basata su una fisica a molla.
    Animated.spring(animValue, {
      toValue: 1, // Valore finale
      friction: 4, // Attrito/resistenza della molla (valori più alti = meno rimbalzo)
      tension: 50, // "Forza" della molla
      delay,
      useNativeDriver: true,
    }).start();
  }, [animValue, delay]); // La durata non è un parametro diretto per `spring`

  // Ritorna gli stili trasformati
  return {
    opacity: animValue, // L'opacità passa da 0 a 1
    transform: [{ scale: animValue }], // La scala passa da 0 a 1 con effetto "rimbalzo"
  };
};
