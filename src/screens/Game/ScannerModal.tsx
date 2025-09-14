import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

// --- Importazioni Locali ---
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { MainStackNavigationProps } from "../../navigation/types";
import { verifyQRCode } from "../../api/scannerService";
import { listenToGameState, GameState } from "../../api/gameService";
import { PrimaryButton } from "../../components/PrimaryButton";
import { theme } from "../../theme/theme";
import { styles } from "../../styles/styles";

type ScannerModalProps = MainStackNavigationProps<"ScannerModal">;

const ScannerModal: React.FC<ScannerModalProps> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);

  const [gameState, setGameState] = useState<GameState | null>(null);
  // Stato per i permessi della fotocamera
  const [permission, requestPermission] = useCameraPermissions();
  // Stato per sapere se un codice è già stato scansionato (per evitare scansioni multiple)
  const [scanned, setScanned] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Ascolta lo stato di gioco per avere sempre i dati più aggiornati
  useEffect(() => {
    if (!authContext?.user) return;
    const unsubscribe = listenToGameState(authContext.user.uid, setGameState);
    return () => unsubscribe();
  }, [authContext?.user]);

  // Chiedi i permessi all'avvio del componente
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Se stiamo già verificando o abbiamo già scansionato, ignora
    if (isVerifying || scanned) return;

    setScanned(true);
    setIsVerifying(true);

    if (!authContext?.user || !gameState) return;

    // Chiama il servizio per verificare il QR code
    const result = await verifyQRCode(
      authContext.teamId.toString(),
      gameState.currentEventId,
      data // Usa i dati reali del QR code
    );

    if (result.success) {
      modal?.showModal({
        type: "success",
        title: "Corretto!",
        message: result.message,
      });
      navigation.navigate("GameTab");
    } else {
      modal?.showModal({
        type: "error",
        title: "Sbagliato!",
        message: result.message,
      });
      setTimeout(() => setScanned(false), 2000);
    }
    setIsVerifying(false);
  };

  // --- Render condizionale in base ai permessi ---
  if (!permission) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.colors.backgroundEnd },
        ]}
      />
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.colors.backgroundEnd },
        ]}
      >
        <Text style={styles.scannerPermissionText}>
          Devi concedere l'accesso alla fotocamera per poter giocare.
        </Text>
        <PrimaryButton title="Concedi Permesso" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.scannerMask} />
      <View style={{ flexDirection: "row" }}>
        <View style={styles.scannerMask} />
        <View style={styles.scannerFocusBox} />
        <View style={styles.scannerMask} />
      </View>
      <View
        style={[
          styles.scannerMask,
          { alignItems: "center", justifyContent: "flex-start" },
        ]}
      >
        <Text style={styles.scannerInfoText}>Inquadra il QR Code</Text>
        {scanned && !isVerifying && (
          <PrimaryButton
            title="Scansiona di nuovo"
            onPress={() => setScanned(false)}
            style={{ marginTop: 20 }}
          />
        )}
      </View>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.scannerCloseButton}
      >
        <Text style={styles.scannerCloseButtonText}>Chiudi</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ScannerModal;
