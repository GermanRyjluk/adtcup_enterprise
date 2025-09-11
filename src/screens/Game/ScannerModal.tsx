import React, { useState, useEffect, useContext, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// --- Importazioni Locali ---
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { MainStackNavigationProps } from "../../navigation/types";
import { verifyQRCode } from "../../api/scannerService";
import { listenToGameState, GameState } from "../../api/gameService";
import { styles } from "../../styles/styles";
import { PrimaryButton } from "../../components/PrimaryButton";
import { theme } from "../../theme/theme";

type ScannerModalProps = MainStackNavigationProps<"ScannerModal">;

const ScannerModal: React.FC<ScannerModalProps> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);

  const [scanning, setScanning] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Valore animato per la barra di scansione
  const scanAnimation = useRef(new Animated.Value(0)).current;

  // Avvia l'animazione della barra quando il componente viene montato
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scanAnimation]);

  // Ascolta lo stato di gioco per avere sempre i dati più aggiornati
  useEffect(() => {
    if (!authContext?.user) return;
    const unsubscribe = listenToGameState(authContext.user.uid, setGameState);
    return () => unsubscribe();
  }, [authContext?.user]);

  const handleSimulateScan = async () => {
    if (!authContext?.user || !gameState) return;

    setScanning(true);
    // In un'app reale, `scannedData` proverrebbe dalla fotocamera.
    // Per la simulazione, usiamo un valore che sappiamo essere corretto.
    const scannedData = "RISPOSTA_CORRETTA";

    const result = await verifyQRCode(
      authContext.user.uid,
      gameState.currentEventId,
      gameState.currentRiddleIndex,
      scannedData
    );

    if (result.success) {
      modal?.showModal({
        type: "success",
        title: "Corretto!",
        message: result.message,
      });
      navigation.goBack(); // Chiude il modale
    } else {
      modal?.showModal({
        type: "error",
        title: "Sbagliato!",
        message: result.message,
      });
    }
    setScanning(false);
  };

  const scanBarPosition = scanAnimation.interpolate({
    inputRange: [0, 1],
    // Si muove dall'alto verso il basso all'interno del focus box
    outputRange: [0, 250], // 250 è l'altezza del focus box
  });

  return (
    <View style={styles.scannerContainer}>
      <View style={styles.scannerFocusBox}>
        <Animated.View
          style={[
            styles.scannerBar,
            { transform: [{ translateY: scanBarPosition }] },
          ]}
        >
          <LinearGradient
            colors={["transparent", "rgba(255, 193, 7, 0.8)", "transparent"]}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>
      <Text style={styles.scannerText}>Inquadra il QR Code</Text>

      <PrimaryButton
        title={scanning ? "Verifica..." : "Simula Scansione Corretta"}
        onPress={handleSimulateScan}
        disabled={scanning || !gameState}
      />
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginTop: theme.spacing.lg }}
      >
        <Text style={{ color: theme.colors.textPrimary }}>Chiudi</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ScannerModal;
