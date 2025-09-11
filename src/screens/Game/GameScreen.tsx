import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  DimensionValue,
} from "react-native";
import { DocumentData } from "firebase/firestore";

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

type GameScreenProps = GameTabScreenProps<"GameTab">;

const GameScreen: React.FC<GameScreenProps> = ({ navigation }) => {
  const authContext = useContext(AuthContext);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentRiddle, setCurrentRiddle] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextClueTime, setNextClueTime] = useState(300); // 5 minuti in secondi

  // 1. Listener per lo stato di gioco dell'utente
  useEffect(() => {
    if (!authContext?.user) return;

    const unsubscribe = listenToGameState(authContext.user.uid, (state) => {
      setGameState(state);
      if (state === null) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [authContext?.user]);

  // 2. Listener per i dati dell'indovinello
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

  // 3. Timer per il prossimo indizio
  useEffect(() => {
    const timer = setInterval(() => {
      setNextClueTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  // --- Render condizionale ---

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
        <Text style={[styles.bodyText, { marginTop: theme.spacing.md }]}>
          Caricamento gioco...
        </Text>
      </View>
    );
  }

  if (gameState?.isGameFinished) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.authTitle}>Caccia al Tesoro Completata!</Text>
        <Text style={styles.bodyText}>
          Congratulazioni! Controlla la classifica per vedere il tuo risultato.
        </Text>
      </View>
    );
  }

  if (!currentRiddle || !gameState) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.bodyText}>
          Impossibile caricare l'indovinello. Riprova più tardi.
        </Text>
      </View>
    );
  }

  const totalRiddles = currentRiddle.totalRiddlesInEvent || 10;
  // La variabile 'progress' è una stringa nel formato 'XX%', che è corretto per la prop 'width'.
  const progress = `${
    (gameState.currentRiddleIndex / totalRiddles) * 100
  }%` as DimensionValue;

  return (
    <ScrollView style={styles.gameContainer}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>
          Indovinello {gameState.currentRiddleIndex} di {totalRiddles}
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: progress }]} />
      </View>

      <View style={styles.riddleCard}>
        {currentRiddle.imageUrl && (
          <Image
            source={{ uri: currentRiddle.imageUrl }}
            style={styles.riddleImage}
          />
        )}
        {currentRiddle.text && (
          <Text style={styles.riddleText}>{currentRiddle.text}</Text>
        )}
      </View>

      <View style={styles.clueCard}>
        <Text style={styles.clueTimerText}>
          Prossimo indizio tra: {formatTime(nextClueTime)}
        </Text>
        <PrimaryButton
          title="Mostra Indizi"
          onPress={() =>
            navigation.navigate("Clues", {
              riddleId: String(gameState.currentRiddleIndex),
            })
          }
          style={{ width: "100%" }}
        />
      </View>
    </ScrollView>
  );
};

export default GameScreen;
