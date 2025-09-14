import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  DimensionValue,
} from "react-native";
import { DocumentData, Timestamp } from "firebase/firestore";

// --- Importazioni Locali ---
import { AuthContext } from "../../contexts/AuthContext";
import { GameTabScreenProps } from "../../navigation/types";
import {
  GameState,
  listenToGameState,
  listenToRiddle,
} from "../../api/gameService";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";
import { PrimaryButton } from "../../components/PrimaryButton";
import { GameHeader } from "@/src/components/GameHeader";

type GameScreenProps = GameTabScreenProps<"GameTab">;

const GameScreen: React.FC<GameScreenProps> = ({ navigation }) => {
  const authContext = useContext(AuthContext);

  // --- Stati Essenziali ---
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentRiddle, setCurrentRiddle] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);
  const [timeToNextClue, setTimeToNextClue] = useState(0);
  const [unlockedCluesCount, setUnlockedCluesCount] = useState(0);

  // Listener per lo stato di gioco
  useEffect(() => {
    if (!authContext?.user) return;
    const unsubscribe = listenToGameState(authContext.user.uid, (state) => {
      setGameState(state);
      if (state === null) setLoading(false);
    });
    return () => unsubscribe();
  }, [authContext?.user]);

  // Listener per i dati dell'indovinello
  useEffect(() => {
    if (!gameState) return;
    setLoading(true);
    setCurrentRiddle(null);
    const { currentEventId, currentRiddleIndex } = gameState;
    const unsubscribe = listenToRiddle(
      currentEventId,
      currentRiddleIndex,
      (riddle) => {
        setCurrentRiddle(riddle);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [gameState]);

  // Calcolo delle dimensioni dell'immagine
  useEffect(() => {
    if (currentRiddle?.photo) {
      Image.getSize(
        currentRiddle.photo,
        (width, height) => setImageAspectRatio(width / height),
        () => setImageAspectRatio(16 / 9)
      );
    }
  }, [currentRiddle?.photo]);

  // Countdown per gli indizi (versione semplificata e corretta)
  useEffect(() => {
    const timerId = setInterval(() => {
      if (gameState?.lastScanTime && currentRiddle) {
        const CLUE_INTERVAL_SECONDS = currentRiddle.clueIntervalSeconds || 300;
        const MAX_CLUES = currentRiddle.maxClues || 3;
        const lastScanDate = (gameState.lastScanTime as Timestamp).toDate();
        const elapsedSeconds = Math.floor(
          (Date.now() - lastScanDate.getTime()) / 1000
        );

        const unlockedCount = Math.min(
          Math.floor(elapsedSeconds / CLUE_INTERVAL_SECONDS),
          MAX_CLUES
        );
        setUnlockedCluesCount(unlockedCount);

        if (unlockedCount < MAX_CLUES) {
          const remainingSeconds =
            CLUE_INTERVAL_SECONDS - (elapsedSeconds % CLUE_INTERVAL_SECONDS);
          setTimeToNextClue(remainingSeconds);
        } else {
          setTimeToNextClue(0);
        }
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [gameState, currentRiddle]);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const getClueButtonSubtitle = () => {
    const maxClues = currentRiddle?.maxClues || 3;
    if (unlockedCluesCount >= maxClues) {
      return "Tutti gli indizi sbloccati";
    }
    if (!gameState?.lastScanTime) {
      const intervalMinutes = Math.floor(
        (currentRiddle?.clueIntervalSeconds || 300) / 60
      );
      return `Il primo indizio arriva in ${intervalMinutes}:00`;
    }
    return `Prossimo indizio tra: ${formatTime(timeToNextClue)}`;
  };

  // --- Render ---

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  if (gameState?.isGameFinished) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.authTitle}>Caccia al Tesoro Completata!</Text>
      </View>
    );
  }

  if (!currentRiddle || !gameState) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.bodyText}>Impossibile caricare l'indovinello.</Text>
      </View>
    );
  }

  const totalRiddles = currentRiddle.totalRiddles || 10;
  const progress = `${
    (currentRiddle.currentRiddleNumber / totalRiddles) * 100
  }%` as DimensionValue;

  return (
    <ScrollView style={styles.gameContainer}>
      <GameHeader
        title={`Indovinello ${currentRiddle.currentRiddleNumber} di ${totalRiddles}`}
      />
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: progress }]} />
      </View>

      <View style={styles.riddleCard}>
        {currentRiddle.photo && (
          <Image
            source={{ uri: currentRiddle.photo }}
            style={[
              styles.riddleImage,
              {
                aspectRatio: imageAspectRatio,
                marginBottom: currentRiddle.message ? theme.spacing.md : null,
              },
            ]}
          />
        )}
        {currentRiddle.message && (
          <Text style={styles.riddleText}>{currentRiddle.message}</Text>
        )}
      </View>

      <View style={styles.clueCard}>
        <Text style={styles.clueTimerText}>{getClueButtonSubtitle()}</Text>
        <PrimaryButton
          title={`Indizi (${unlockedCluesCount} / ${
            currentRiddle?.maxClues || 3
          })`}
          onPress={() =>
            navigation.navigate("Clues", {
              riddleId: String(gameState.currentRiddleIndex),
            })
          }
          disabled={unlockedCluesCount === 0}
          style={{ width: "100%" }}
        />
      </View>
    </ScrollView>
  );
};

export default GameScreen;
