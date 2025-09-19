import { Feather as Icon } from "@expo/vector-icons";
import { DocumentData, Timestamp } from "firebase/firestore";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  DimensionValue,
  FlatList,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Importazioni Locali ---
import { GameHeader } from "@/src/components/GameHeader";
import { ModalContext } from "@/src/contexts/ModalContext";
import {
  GameState,
  listenToGameState,
  listenToRiddle,
} from "../../api/gameService";
import {
  advanceToNextStage,
  listenToQuizLeaderboard,
  submitMultipleChoiceAnswers,
} from "../../api/quizService";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthContext } from "../../contexts/AuthContext";
import { GameTabScreenProps } from "../../navigation/types";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";

type GameScreenProps = GameTabScreenProps<"GameTab">;

// --- COMPONENTI PER LE FASI DI GIOCO ---

const RiddleComponent: React.FC<{ riddle: DocumentData }> = ({ riddle }) => {
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);
  useEffect(() => {
    if (riddle?.photo) {
      Image.getSize(
        riddle.photo,
        (width, height) => setImageAspectRatio(width / height),
        () => setImageAspectRatio(16 / 9)
      );
    }
  }, [riddle?.photo]);
  return (
    <View style={styles.riddleCard}>
      {riddle.photo && (
        <Image
          source={{ uri: riddle.photo }}
          style={[
            styles.riddleImage,
            {
              aspectRatio: imageAspectRatio,
              marginBottom: riddle.message ? theme.spacing.md : undefined,
            },
          ]}
        />
      )}
      {riddle.message && (
        <Text style={styles.riddleText}>{riddle.message}</Text>
      )}
    </View>
  );
};

const LocationComponent: React.FC<{ location: DocumentData }> = ({
  location,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const handleOpenMaps = () => {
    if (location.mapsLink) Linking.openURL(location.mapsLink);
  };
  return (
    <ScrollView>
      <View style={styles.locationCard}>
        {location.photo && (
          <Image
            source={{ uri: location.photo }}
            style={styles.locationImage}
          />
        )}
        <View style={styles.locationContent}>
          <Text style={styles.locationTitle}>{location.locationName}</Text>
          <Text
            style={styles.locationDescription}
            numberOfLines={isExpanded ? undefined : 4}
            onTextLayout={(e) => {
              if (e.nativeEvent.lines.length > 4 && !canExpand)
                setCanExpand(true);
            }}
          >
            {location.description}
          </Text>
          {canExpand && (
            <TouchableOpacity
              onPress={() => setIsExpanded(!isExpanded)}
              style={styles.readMoreTouchable}
            >
              <Text style={styles.readMoreText}>
                {isExpanded ? "Leggi di meno" : "Leggi di più"}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.locationInfoRow}>
            <Icon name="clock" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.locationInfoText}>{location.openingHours}</Text>
          </View>
          <View style={styles.locationInfoRow}>
            <Icon name="map-pin" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.locationInfoText}>{location.address}</Text>
          </View>
          <PrimaryButton
            title="VAI ALLA MAPPA"
            onPress={handleOpenMaps}
            icon="corner-up-right"
            style={styles.locationButton}
            disabled={!location.mapsLink}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const MultipleChoiceComponent: React.FC<{
  quizData: DocumentData;
  onConfirm: (answers: { [key: string]: number }) => void;
}> = ({ quizData, onConfirm }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState(quizData.timeLimitSeconds || 120);
  const onConfirmRef = React.useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  const handleTimeUp = useCallback(() => {
    onConfirmRef.current(answers);
  }, [answers]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleTimeUp]);

  const handleSelectAnswer = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  };
  const currentQuestion = quizData.questions[currentQuestionIndex];

  console.log(currentQuestionIndex, quizData.questions.length - 1);
  return (
    <View style={styles.mcContainer}>
      <View style={styles.mcHeader}>
        <Text style={styles.mcQuestionCount}>
          Domanda {currentQuestionIndex + 1} di {quizData.questions.length}
        </Text>
        <Text style={styles.mcTimerText}>
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View style={styles.mcQuestionContainer}>
          <Text style={styles.mcQuestionText}>
            {currentQuestion.questionText}
          </Text>
          {currentQuestion.imageUrl && (
            <Image
              source={{ uri: currentQuestion.imageUrl }}
              style={[styles.mcQuestionImage, { aspectRatio: 16 / 9 }]}
            />
          )}
          <View style={styles.mcAnswersContainer}>
            {currentQuestion.options.map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.mcAnswerButton,
                  answers[currentQuestion.id] === index &&
                    styles.mcAnswerButtonSelected,
                ]}
                onPress={() => handleSelectAnswer(currentQuestion.id, index)}
              >
                <Text style={styles.mcAnswerText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.mcNavigation}>
        <TouchableOpacity
          style={styles.mcNavButton}
          disabled={currentQuestionIndex === 0}
          onPress={() => setCurrentQuestionIndex((prev) => prev - 1)}
        >
          <Icon
            name="arrow-left"
            size={28}
            color={
              currentQuestionIndex === 0
                ? theme.colors.disabled
                : theme.colors.textPrimary
            }
          />
        </TouchableOpacity>
        {currentQuestionIndex == quizData.questions.length - 1 ? (
          <PrimaryButton title="Conferma" onPress={handleTimeUp} />
        ) : null}
        <TouchableOpacity
          style={styles.mcNavButton}
          disabled={currentQuestionIndex === quizData.questions.length - 1}
          onPress={() => setCurrentQuestionIndex((prev) => prev + 1)}
        >
          <Icon
            name="arrow-right"
            size={28}
            color={
              currentQuestionIndex === quizData.questions.length - 1
                ? theme.colors.disabled
                : theme.colors.textPrimary
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MultipleChoiceLeaderboardComponent: React.FC<{
  quizData: DocumentData;
  gameState: GameState;
}> = ({ quizData, gameState }) => {
  const [leaderboard, setLeaderboard] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const authContext = useContext(AuthContext);

  useEffect(() => {
    const unsubscribe = listenToQuizLeaderboard(
      gameState.currentEventId,
      quizData.sourceQuizId,
      (data) => {
        setLeaderboard(data);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [gameState.currentEventId, quizData.sourceQuizId]);

  const handleAdvance = () => {
    if (authContext?.teamId) {
      advanceToNextStage(
        gameState.currentEventId,
        authContext.teamId.toString(),
        quizData.nextQuizId
      );
    }
  };

  const formatDuration = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "N/D";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  };

  const userTeamResult = leaderboard.find(
    (item) => item.id === authContext?.teamId?.toString()
  );

  if (loading) {
    return (
      <ActivityIndicator
        style={{ marginTop: 50 }}
        size="large"
        color={theme.colors.accentPrimary}
      />
    );
  }

  return (
    <View style={styles.mcLeaderboardContainer}>
      <Text style={styles.detailsTitle}>{quizData.title}</Text>
      {userTeamResult && (
        <View style={styles.userResultCard}>
          <Text style={styles.userResultTitle}>Il Tuo Risultato</Text>
          <View style={styles.userResultRow}>
            <View style={styles.userResultBlock}>
              <Text style={styles.userResultLabel}>Punteggio</Text>
              <Text style={styles.userResultValue}>
                {userTeamResult.correctAnswers}/{quizData.totalQuestions}
              </Text>
            </View>
            <View style={styles.userResultBlock}>
              <Text style={styles.userResultLabel}>Tempo</Text>
              <Text style={styles.userResultValue}>
                {formatDuration(userTeamResult.durationSeconds)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.quizLeaderboardHeader}>
        <Text style={[styles.quizLeaderboardHeaderText, { width: 30 }]}>
          Pos.
        </Text>
        <Text style={[styles.quizLeaderboardHeaderText, { flex: 1 }]}>
          Squadra
        </Text>
        <Text
          style={[
            styles.quizLeaderboardHeaderText,
            { width: 60, textAlign: "right" },
          ]}
        >
          Punti
        </Text>
        <Text
          style={[
            styles.quizLeaderboardHeaderText,
            { width: 70, textAlign: "right" },
          ]}
        >
          Tempo
        </Text>
      </View>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.quizLeaderboardRow,
              item.id === authContext?.teamId?.toString() && {
                backgroundColor: "rgba(255,193,7,0.1)",
              },
            ]}
          >
            <Text style={styles.quizLeaderboardPosition}>{index + 1}</Text>
            <Text style={styles.quizLeaderboardTeamName}>{item.teamName}</Text>
            <Text style={styles.quizLeaderboardScore}>
              {item.correctAnswers}/{quizData.totalQuestions}
            </Text>
            <Text style={styles.quizLeaderboardTime}>
              {formatDuration(item.durationSeconds)}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

// --- SCHERMATA PRINCIPALE ---
const GameScreen: React.FC<GameScreenProps> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentRiddle, setCurrentRiddle] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeToNextClue, setTimeToNextClue] = useState(0);
  const [unlockedCluesCount, setUnlockedCluesCount] = useState(0);

  useEffect(() => {
    if (!authContext?.user) return;
    const unsubscribe = listenToGameState(authContext.user.uid, (state) => {
      setGameState(state);
      if (state === null) setLoading(false);
    });
    return () => unsubscribe();
  }, [authContext?.user]);

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

  useEffect(() => {
    const timerId = setInterval(() => {
      if (gameState?.lastScanTime && currentRiddle?.type === "riddle") {
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

  const handleQuizSubmit = useCallback(
    async (answers: { [key: string]: number }) => {
      if (
        isSubmitting ||
        !gameState ||
        !authContext?.teamId ||
        !currentRiddle ||
        !gameState.lastScanTime
      )
        return;

      setIsSubmitting(true);

      try {
        await submitMultipleChoiceAnswers(
          gameState.currentEventId,
          gameState.currentRiddleIndex.toString(),
          currentRiddle,
          authContext.teamId.toString(),
          answers,
          gameState.lastScanTime
        );
      } catch (error) {
        modal?.showModal({
          type: "error",
          title: "Errore",
          message: "Non è stato possibile inviare le risposte. Riprova.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, gameState, authContext, currentRiddle, modal]
  );

  if (loading || isSubmitting) {
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
        <Text style={styles.bodyText}>
          Impossibile caricare la fase di gioco.
        </Text>
      </View>
    );
  }

  const totalRiddles = currentRiddle.totalRiddles || 10;
  const progress = `${
    (currentRiddle.currentRiddleNumber / totalRiddles) * 100
  }%` as DimensionValue;

  const renderContent = () => {
    switch (currentRiddle.type) {
      case "multipleChoice":
        return (
          <MultipleChoiceComponent
            quizData={currentRiddle}
            onConfirm={handleQuizSubmit}
          />
        );
      case "multipleChoiceLeaderboard":
        return (
          <MultipleChoiceLeaderboardComponent
            quizData={currentRiddle}
            gameState={gameState}
          />
        );
      case "location":
        return <LocationComponent location={currentRiddle} />;
      case "riddle":
      default:
        return (
          <ScrollView>
            <RiddleComponent riddle={currentRiddle} />
            <View style={styles.clueCard}>
              <Text style={styles.clueTimerText}>
                {getClueButtonSubtitle()}
              </Text>
              <PrimaryButton
                title={`Indizi (${unlockedCluesCount} / ${
                  currentRiddle?.maxClues || 3
                })`}
                onPress={() =>
                  navigation.navigate("Clues", {
                    riddleId: String(gameState.currentRiddleIndex),
                    unlockedCluesCount: unlockedCluesCount,
                  })
                }
                disabled={unlockedCluesCount === 0}
                style={{ width: "100%" }}
              />
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <View
      style={[
        styles.gameContainer,
        { paddingBottom: currentRiddle.type === "riddle" ? 100 : 0 },
      ]}
    >
      <GameHeader
        title={`Fase ${currentRiddle.currentRiddleNumber} di ${totalRiddles}`}
      />
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: progress }]} />
      </View>
      {renderContent()}
    </View>
  );
};

export default GameScreen;
