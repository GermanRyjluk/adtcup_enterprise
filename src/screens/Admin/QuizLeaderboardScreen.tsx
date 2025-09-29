// src/screens/admin/QuizLeaderboardScreen.tsx

import { DocumentData } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  assignPointsInBatch,
  getQuizDetails,
  getQuizLeaderboard,
  getTeamsByIds,
} from "../../api/adminService";
import { AdminHeader } from "../../components/AdminHeader";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { QuizLeaderboardScreenProps } from "../../navigation/types";
import { adminStyles } from "../../styles/adminStyles";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";

// Definiamo un tipo per i dati combinati
interface TeamWithPoints extends DocumentData {
  teamId: string;
  teamName: string;
  currentScore: number;
  pointsToAdd: number;
}

const QuizLeaderboardScreen: React.FC<QuizLeaderboardScreenProps> = ({
  route,
}) => {
  const { riddleId, riddleTitle } = route.params; // riddleId è il quizId
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);

  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false); // Stato per il caricamento del bottone
  const [teamsWithPoints, setTeamsWithPoints] = useState<TeamWithPoints[]>([]);
  const [quizDetails, setQuizDetails] = useState<DocumentData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!authContext?.currentEventId) return;
      try {
        setLoading(true); // Inizia il caricamento

        // 1. Recupera la classifica e i dettagli del quiz
        const [leaderboardData, details] = await Promise.all([
          getQuizLeaderboard(authContext.currentEventId, riddleId),
          getQuizDetails(authContext.currentEventId, riddleId),
        ]);
        setQuizDetails(details);

        if (leaderboardData.length === 0) {
          setTeamsWithPoints([]);
          return; // Esce se la classifica è vuota
        }

        // 2. Estrai gli ID dei team dalla classifica
        const teamIds = leaderboardData.map((team) => team.teamId);

        // 3. Recupera i dati completi di tutti i team in classifica
        const teamsDataMap = await getTeamsByIds(
          authContext.currentEventId,
          teamIds
        );

        const pointsSystem: number[] = details?.points || [];

        // 4. Combina tutti i dati per creare lo stato finale
        const combinedData = leaderboardData.map((leaderboardEntry, index) => {
          const teamData = teamsDataMap.get(leaderboardEntry.teamId);
          const pointsToAdd = pointsSystem[index] || 0;

          return {
            ...leaderboardEntry,
            pointsToAdd: pointsToAdd,
            currentScore: teamData?.score || 0,
          };
        });

        setTeamsWithPoints(combinedData);
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
        // Gestisci l'errore, magari con un modale
      } finally {
        setLoading(false); // Termina il caricamento
      }
    };

    fetchData();
  }, [authContext?.currentEventId, riddleId]);

  const handleAssignPoints = async () => {
    setIsAssigning(true);
    if (!authContext?.currentEventId) {
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: "ID Evento non trovato.",
      });
      setIsAssigning(false);
      return;
    }

    try {
      const assignments = teamsWithPoints.map(({ teamId, pointsToAdd }) => ({
        teamId: teamId,
        points: pointsToAdd,
      }));

      await assignPointsInBatch(authContext.currentEventId, assignments);

      modal?.showModal({
        type: "success",
        title: "Successo!",
        message: "Punti assegnati correttamente.",
      });
    } catch (error: any) {
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: error.message,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePointsChange = (text: string, teamId: string) => {
    const newPoints = parseInt(text.replace("+", ""), 10) || 0;

    setTeamsWithPoints((currentTeams) =>
      currentTeams.map((team) =>
        team.teamId === teamId ? { ...team, pointsToAdd: newPoints } : team
      )
    );
  };

  const renderTeamItem = ({
    item,
    index,
  }: {
    item: TeamWithPoints;
    index: number;
  }) => {
    const totalQuestions = quizDetails?.questions?.length || 0;
    return (
      <View
        style={[
          adminStyles.adminListItem,
          { marginHorizontal: theme.spacing.lg },
        ]}
      >
        <Text style={adminStyles.leaderboardPosition}>{index + 1}</Text>
        <View style={adminStyles.adminListItemContent}>
          <Text style={adminStyles.adminListItemTitle}>{item.teamName}</Text>
          {quizDetails?.type === "multipleChoice" ? (
            <Text
              style={[adminStyles.adminListItemSubtitle, { marginBottom: 5 }]}
            >
              {`Risposte: ${item.correctAnswers || 0}/${totalQuestions}`}
            </Text>
          ) : null}

          <Text
            style={[adminStyles.adminListItemSubtitle, { marginBottom: 5 }]}
          >
            {`Tempo: ${formatDuration(item.durationSeconds)}`}
          </Text>
          <Text style={adminStyles.adminListItemSubtitle}>
            Punti attuali: {item.currentScore}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <TextInput
            style={adminStyles.pointsInput}
            value={`+${item.pointsToAdd}`}
            onChangeText={(text) => handlePointsChange(text, item.teamId)}
            keyboardType="numeric"
          />
        </View>
      </View>
    );
  };

  const formatDuration = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "N/D";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(" ");
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  //   console.log(teamsWithPoints);

  return (
    <View style={styles.standardScreenContainer}>
      <AdminHeader title={riddleTitle} />
      <FlatList
        data={teamsWithPoints}
        keyExtractor={(item) => item.teamId}
        renderItem={renderTeamItem}
        contentContainerStyle={{ paddingBottom: 120 }} // Spazio per il bottone
        ListEmptyComponent={
          <View style={{ paddingTop: 50, alignItems: "center" }}>
            <Text style={styles.bodyText}>
              Nessuna squadra in classifica per questo quiz.
            </Text>
          </View>
        }
      />
      <View style={adminStyles.fixedBottomButton}>
        <PrimaryButton
          title="Assegna Punti"
          onPress={handleAssignPoints}
          loading={isAssigning}
          disabled={isAssigning || teamsWithPoints.length === 0}
        />
      </View>
    </View>
  );
};

export default QuizLeaderboardScreen;
