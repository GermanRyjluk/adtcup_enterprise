import React, { useRef } from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Animated,
  GestureResponderEvent,
} from "react-native";

/**
 * @interface AnimatedPressableProps
 * Estende le props standard di TouchableOpacity, permettendo al nostro componente
 * di accettare tutti gli stessi parametri (come onPress, disabled, style, etc.).
 */
interface AnimatedPressableProps extends TouchableOpacityProps {
  children: React.ReactNode;
}

/**
 * @component AnimatedPressable
 * Un wrapper attorno a TouchableOpacity che aggiunge un'animazione di scalatura
 * al tocco per un feedback visivo più piacevole.
 * @param {AnimatedPressableProps} props - Le props del componente.
 */
export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  onPressIn,
  onPressOut,
  ...props
}) => {
  // useRef viene usato per mantenere il valore dell'animazione tra i render.
  // Inizializziamo la scala a 1 (dimensione normale).
  const animValue = useRef(new Animated.Value(1)).current;

  // Funzione chiamata quando l'utente preme il dito sull'elemento.
  const handlePressIn = (event: GestureResponderEvent) => {
    // Avvia un'animazione a molla che riduce la scala a 0.95.
    Animated.spring(animValue, {
      toValue: 0.95,
      useNativeDriver: true, // Essenziale per le performance
    }).start();
    // Se è stata passata una funzione onPressIn esterna, la chiamiamo.
    if (onPressIn) {
      onPressIn(event);
    }
  };

  // Funzione chiamata quando l'utente solleva il dito.
  const handlePressOut = (event: GestureResponderEvent) => {
    // Avvia un'animazione a molla che riporta la scala a 1.
    Animated.spring(animValue, {
      toValue: 1,
      friction: 4, // Aggiungiamo un po' di frizione per un ritorno più naturale
      tension: 50,
      useNativeDriver: true,
    }).start();
    // Se è stata passata una funzione onPressOut esterna, la chiamiamo.
    if (onPressOut) {
      onPressOut(event);
    }
  };

  // Creiamo l'oggetto stile che applicherà la trasformazione di scala.
  const animatedStyle = {
    transform: [{ scale: animValue }],
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8} // Usiamo un'opacità meno aggressiva del default
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};
