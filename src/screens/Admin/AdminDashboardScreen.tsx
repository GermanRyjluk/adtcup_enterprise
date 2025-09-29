import { Feather as Icon } from "@expo/vector-icons";
import { DocumentData } from "firebase/firestore";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";

import {
  adminStartQuizPhaseForAllTeams,
  assignPointsInBatch,
  listenToAllTeamsProgress,
  listenToRiddles,
} from "../../api/adminService";
import { listenEventDetails } from "../../api/eventService"; // Importa listenEventDetails
import { AdminHeader } from "../../components/AdminHeader";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { adminStyles } from "../../styles/adminStyles";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";

// Nuovo componente per la timeline stilistica
const TimelineItem: React.FC<{
  item: DocumentData;
  isLast: boolean;
  totalTeams: number;
}> = ({ item, isLast, totalTeams }) => {
  const progress = totalTeams > 0 ? (item.teamCount / totalTeams) * 100 : 0;
  const icons: { [key: string]: keyof typeof Icon.glyphMap } = {
    riddle: "key",
    location: "map-pin",
    multipleChoice: "list",
    multipleChoiceLeaderboard: "award",
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.cardBackground,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <Icon
            name={icons[item.type] || "help-circle"}
            size={20}
            color={theme.colors.accentPrimary}
          />
        </View>
        {!isLast && (
          <View
            style={{
              width: 2,
              height: "100%",
              backgroundColor: theme.colors.cardBackground,
              position: "absolute",
              top: 40,
            }}
          />
        )}
      </View>

      <View
        style={[
          adminStyles.adminListItem,
          { flex: 1, marginLeft: theme.spacing.md },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={adminStyles.adminListItemTitle}>
            Fase {item.currentRiddleNumber}
          </Text>
          <Text style={adminStyles.adminListItemSubtitle}>
            {item.locationName || item.type}
          </Text>
          <View
            style={[
              styles.progressBarContainer,
              { marginHorizontal: 0, marginTop: 8 },
            ]}
          >
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={adminStyles.statCardValue}>{item.teamCount}</Text>
          <Text style={adminStyles.statCardLabel}>Squadre</Text>
        </View>
      </View>
    </View>
  );
};

const AdminDashboardScreen = () => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<DocumentData | null>(null); // Stato per i dati dell'evento
  const [teams, setTeams] = useState<DocumentData[]>([]);
  const [riddles, setRiddles] = useState<DocumentData[]>([]);

  const [isGameModalVisible, setGameModalVisible] = useState(false);
  const [currentGame, setCurrentGame] = useState<"Gioco 1" | "Gioco 2" | null>(
    null
  );
  const [rankedTeams, setRankedTeams] = useState<DocumentData[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!authContext?.currentEventId) {
      setLoading(false);
      return;
    }
    const unsubTeams = listenToAllTeamsProgress(
      authContext.currentEventId,
      setTeams
    );
    const unsubRiddles = listenToRiddles(
      authContext.currentEventId,
      setRiddles
    );
    // Aggiungi un listener per i dettagli dell'evento per ottenere i punteggi dinamici
    const unsubEvent = listenEventDetails(
      authContext.currentEventId,
      (data) => {
        setEventData(data);
        setLoading(false);
      }
    );
    return () => {
      unsubTeams();
      unsubRiddles();
      unsubEvent();
    };
  }, [authContext?.currentEventId]);

  const timelineData = useMemo(() => {
    if (riddles.length === 0) return [];
    const teamsByRiddle = teams.reduce((acc, team) => {
      const riddleId = team.currentRiddleIndex;
      if (!acc[riddleId]) acc[riddleId] = 0;
      acc[riddleId]++;
      return acc;
    }, {} as { [key: string]: number });

    return riddles.map((riddle) => ({
      ...riddle,
      teamCount: teamsByRiddle[riddle.id] || 0,
    }));
  }, [teams, riddles]);

  const handleStartQuizPhase = () => {
    Alert.alert(
      "Avviare Fase Quiz?",
      "Tutte le squadre verranno spostate alla fase 4 (Quiz a tempo). Sei sicuro?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Conferma",
          style: "destructive",
          onPress: async () => {
            if (!authContext?.currentEventId) return;
            try {
              await adminStartQuizPhaseForAllTeams(
                authContext.currentEventId,
                "0Vff6VScDHxwK5Qxj51v",
                4
              );
              modal?.showModal({
                type: "success",
                title: "Fase Quiz Avviata!",
                message: "Tutte le squadre sono state spostate.",
              });
            } catch (error: any) {
              modal?.showModal({
                type: "error",
                title: "Errore",
                message: error.message,
              });
            }
          },
        },
      ]
    );
  };

  const handleOpenGameModal = (game: "Gioco 1" | "Gioco 2") => {
    setCurrentGame(game);
    const sortedTeams = [...teams].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );
    setRankedTeams(sortedTeams);
    setGameModalVisible(true);
  };

  const handleCloseGameModal = () => {
    setGameModalVisible(false);
  };

  const handleSaveGameScores = async () => {
    if (!authContext?.currentEventId || !currentGame) return;

    // Seleziona l'array di punteggi corretto in base al gioco corrente
    const pointsArray =
      eventData?.[
        currentGame === "Gioco 1" ? "gioco1Points" : "gioco2Points"
      ] || [];
    if (pointsArray.length === 0) {
      modal?.showModal({
        type: "error",
        title: "Punteggi non trovati",
        message: `Assicurati di aver configurato i punteggi per ${currentGame} nell'evento.`,
      });
      return;
    }

    setIsAssigning(true);
    try {
      const assignments = rankedTeams.map((team, index) => ({
        teamId: team.id,
        points: pointsArray[index] || 0, // Usa l'array dinamico
      }));
      await assignPointsInBatch(authContext.currentEventId, assignments);
      modal?.showModal({
        type: "success",
        title: "Successo!",
        message: `Punti per ${currentGame} assegnati.`,
      });
      handleCloseGameModal();
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

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  // Funzione per renderizzare gli item nel DraggableFlatList
  const renderRankedTeamItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<DocumentData>) => {
    const index = rankedTeams.findIndex((t) => t.id === item.id);
    const pointsArray =
      eventData?.[
        currentGame === "Gioco 1" ? "gioco1Points" : "gioco2Points"
      ] || [];
    const pointsToAdd = pointsArray[index] || 0;

    return (
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        style={[
          adminStyles.adminListItem,
          {
            marginHorizontal: theme.spacing.md,
            backgroundColor: isActive
              ? theme.colors.backgroundStart
              : theme.colors.cardBackground,
          },
        ]}
      >
        <Text style={adminStyles.leaderboardPosition}>{index + 1}</Text>
        <View style={{ flex: 1 }}>
          <Text style={adminStyles.adminListItemTitle}>{item.name}</Text>
          <Text style={adminStyles.adminListItemSubtitle}>
            Score: {item.score}
          </Text>
        </View>
        <Text style={adminStyles.statCardValue}>+{pointsToAdd}</Text>
        <View style={{ marginLeft: theme.spacing.md }}>
          <Icon name="menu" size={28} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.standardScreenContainer}>
      <AdminHeader title="Dashboard Evento" />

      <ScrollView contentContainerStyle={adminStyles.adminListContainer}>
        <Text style={adminStyles.adminSectionTitle}>Controlli Evento</Text>
        <View style={adminStyles.adminListItem}>
          <Text style={adminStyles.adminListItemTitle}>Avvio Fase Quiz</Text>
          <PrimaryButton title="AVVIA" onPress={handleStartQuizPhase} />
        </View>
        <View style={adminStyles.adminListItem}>
          <Text style={adminStyles.adminListItemTitle}>Punti Gioco 1</Text>
          <PrimaryButton
            title="GESTISCI"
            onPress={() => handleOpenGameModal("Gioco 1")}
          />
        </View>
        <View style={adminStyles.adminListItem}>
          <Text style={adminStyles.adminListItemTitle}>Punti Gioco 2</Text>
          <PrimaryButton
            title="GESTISCI"
            onPress={() => handleOpenGameModal("Gioco 2")}
          />
        </View>
        {/* <View style={adminStyles.adminListItem}>
          <Text style={adminStyles.adminListItemTitle}>
            Popola Punti Giochi
          </Text>
          <PrimaryButton
            title="ESEGUI"
            onPress={() =>
              populateQuizPoints(
                authContext?.currentEventId || "",
                "xFdqIIoGHFwyQkiN7YOM"
              )
            }
          />
        </View> */}

        <Text style={adminStyles.adminSectionTitle}>Timeline Evento</Text>
        {timelineData.map((item, index) => (
          <TimelineItem
            key={item.id}
            item={item}
            isLast={index === timelineData.length - 1}
            totalTeams={teams.length}
          />
        ))}
      </ScrollView>

      <Modal
        visible={isGameModalVisible}
        animationType="slide"
        onRequestClose={handleCloseGameModal}
      >
        <SafeAreaView
          style={[
            adminStyles.adminModalContainer,
            { marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
          ]}
        >
          <View style={adminStyles.adminModalHeader}>
            <Text style={adminStyles.adminModalTitle}>
              Classifica {currentGame}
            </Text>
            <TouchableOpacity onPress={handleCloseGameModal}>
              <Icon name="x" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <DraggableFlatList
            data={rankedTeams}
            onDragEnd={({ data }) => setRankedTeams(data)}
            keyExtractor={(item) => item.id}
            renderItem={renderRankedTeamItem}
            containerStyle={{ flex: 1 }}
            contentContainerStyle={{
              paddingBottom: 120,
              paddingTop: theme.spacing.md,
            }}
          />
          <View
            style={[
              adminStyles.fixedBottomButton,
              { marginBottom: theme.spacing.lg },
            ]}
          >
            <PrimaryButton
              title="Assegna Punti"
              onPress={handleSaveGameScores}
              loading={isAssigning}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default AdminDashboardScreen;
