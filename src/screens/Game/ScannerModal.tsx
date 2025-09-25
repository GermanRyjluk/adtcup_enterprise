import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import React, { useContext, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// --- Importazioni Locali ---
import { GameState, listenToGameState } from "../../api/gameService";
import { verifyQRCode } from "../../api/scannerService";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { MainStackNavigationProps } from "../../navigation/types";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";

type ScannerModalProps = MainStackNavigationProps<"ScannerModal">;

const ScannerModal: React.FC<ScannerModalProps> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
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
    (async () => {
      // Chiedi il permesso per la fotocamera se non è già stato concesso
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }

      // Chiedi il permesso per la localizzazione
      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== "granted") {
        Alert.alert(
          "Permesso di Localizzazione",
          "L'app ha bisogno di accedere alla tua posizione per verificare alcuni indovinelli. Per favore, abilitalo dalle impostazioni."
        );
      }
    })();
  }, [cameraPermission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Se stiamo già verificando o abbiamo già scansionato, ignora
    if (isVerifying || scanned) return;

    setScanned(true);
    setIsVerifying(true);

    if (!authContext?.user || !gameState) {
      setIsVerifying(false);
      return;
    }

    // Chiama il servizio per verificare il QR code (che ora include il controllo della posizione)
    const result = await verifyQRCode(
      authContext.teamId.toString(),
      gameState.currentEventId,
      data
    );

    if (result.success) {
      modal?.showModal({
        type: "success",
        title: "Corretto!",
        message: result.message,
      });
      navigation.goBack();
    } else {
      modal?.showModal({
        type: "error",
        title: "Sbagliato!",
        message: result.message,
      });
      // Permetti una nuova scansione dopo un breve ritardo
      setTimeout(() => setScanned(false), 2000);
    }
    setIsVerifying(false);
  };

  // --- Render condizionale in base ai permessi ---
  if (!cameraPermission) {
    // Schermata di caricamento mentre si attendono i permessi
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.colors.backgroundEnd },
        ]}
      />
    );
  }

  if (!cameraPermission.granted) {
    // Schermata per richiedere esplicitamente i permessi della fotocamera
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
        <PrimaryButton
          title="Concedi Permesso"
          onPress={requestCameraPermission}
        />
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
