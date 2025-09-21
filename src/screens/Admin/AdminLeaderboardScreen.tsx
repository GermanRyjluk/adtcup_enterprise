import { Feather as Icon } from "@expo/vector-icons";
import { DocumentData } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  adminChangeTeamRiddle,
  adminUpdateTeamScore,
  getQuizDetails,
  listenToAllTeamsProgress,
} from "../../api/adminService";
import { AdminHeader } from "../../components/AdminHeader";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { AdminTabScreenProps } from "../../navigation/types";
import { adminStyles } from "../../styles/adminStyles";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";

type Props = AdminTabScreenProps<"AdminLeaderboard">;

const AdminLeaderboardScreen: React.FC<Props> = () => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<DocumentData[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<DocumentData | null>(null);
  const [points, setPoints] = useState("");

  useEffect(() => {
    if (!authContext?.currentEventId) {
      setLoading(false);
      return;
    }
    const unsubscribe = listenToAllTeamsProgress(
      authContext.currentEventId,
      (data) => {
        setTeams(data);
        if (loading) setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [authContext?.currentEventId]);

  const handleOpenModal = (team: DocumentData) => {
    setSelectedTeam(team);
    setPoints("");
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTeam(null);
  };

  const handleAddPoints = async () => {
    if (!selectedTeam || !points || !authContext?.currentEventId) return;
    const pointsToAdd = parseInt(points, 10);
    if (isNaN(pointsToAdd)) {
      modal?.showModal({
        type: "error",
        title: "Valore non valido",
        message: "Inserisci un numero valido.",
      });
      return;
    }

    try {
      await adminUpdateTeamScore(
        authContext.currentEventId,
        selectedTeam.id,
        pointsToAdd
      );
      modal?.showModal({
        type: "success",
        title: "Successo!",
        message: `${pointsToAdd} punti assegnati a ${selectedTeam.name}.`,
      });
      handleCloseModal();
    } catch (error: any) {
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: error.message,
      });
    }
  };

  const handleChangeRiddle = async (
    team: DocumentData,
    direction: "next" | "prev"
  ) => {
    if (!authContext?.currentEventId) return;
    const currentRiddleNum = parseInt(team.currentRiddleIndex, 10);
    if (isNaN(currentRiddleNum)) return;

    const newRiddleNum =
      direction === "next" ? currentRiddleNum + 1 : currentRiddleNum - 1;
    if (newRiddleNum < 1) return;

    try {
      await adminChangeTeamRiddle(
        authContext.currentEventId,
        team.id,
        String(newRiddleNum),
        team.currentRiddleNumber
      );
    } catch (error: any) {
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: `Impossibile cambiare quiz: ${error.message}`,
      });
    }
  };

  // Componente per la singola riga della classifica
  const TeamItem = ({ item }: { item: DocumentData }) => {
    const [riddleIndexInput, setRiddleIndexInput] = useState(
      String(item.currentRiddleIndex || "")
    );

    useEffect(() => {
      setRiddleIndexInput(String(item.currentRiddleIndex || ""));
    }, [item.currentRiddleIndex]);

    const handleRiddleInputSubmit = async () => {
      if (!authContext?.currentEventId) return;

      const newRiddleId = riddleIndexInput.trim();
      const originalRiddleId = String(item.currentRiddleIndex);

      if (newRiddleId && newRiddleId !== originalRiddleId) {
        try {
          // Cerca il quiz di destinazione per ottenere il suo numero di tappa
          const targetQuiz = await getQuizDetails(
            authContext.currentEventId,
            newRiddleId
          );

          if (!targetQuiz) {
            throw new Error(`Quiz con ID "${newRiddleId}" non trovato.`);
          }

          // Se il quiz esiste, usa il suo currentRiddleNumber per l'aggiornamento
          await adminChangeTeamRiddle(
            authContext.currentEventId,
            item.id,
            newRiddleId,
            targetQuiz.currentRiddleNumber
          );
        } catch (err: any) {
          modal?.showModal({
            type: "error",
            title: "Errore",
            message: `Impossibile aggiornare il quiz: ${err.message}`,
          });
          setRiddleIndexInput(originalRiddleId); // Ripristina in caso di errore
        }
      } else {
        // Se il valore è vuoto o invariato, ripristina l'originale
        setRiddleIndexInput(originalRiddleId);
      }
    };

    return (
      <View style={[adminStyles.adminListItem, { flexDirection: "column" }]}>
        {/* Riga 1: Nome e Punteggio */}
        <View style={[adminStyles.leaderboardRow, { paddingBottom: 20 }]}>
          <Text
            style={[adminStyles.adminListItemTitle, { textAlign: "center" }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <TouchableOpacity
            style={[
              adminStyles.leaderboardScoreContainer,
              {
                flexDirection: "column",
                alignItems: "center",
              },
            ]}
            onPress={() => handleOpenModal(item)}
          >
            <Text
              style={[
                adminStyles.adminListItemSubtitle,
                {
                  marginTop: theme.spacing.sm,
                },
              ]}
            >
              Punteggio
            </Text>
            <Text style={adminStyles.leaderboardScoreText}>
              {item.score || 0}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Riga 2: Controllo Quiz */}
        <View
          style={[
            adminStyles.leaderboardRow,
            {
              paddingTop: 20,
              borderTopWidth: 1,
              borderTopColor: theme.colors.inputBackground,
              flexDirection: "column",
              alignItems: "center",
            },
          ]}
        >
          <Text
            style={[
              adminStyles.adminListItemSubtitle,
              {
                paddingBottom: 10,
              },
            ]}
          >
            Quiz Attuale
          </Text>
          <View style={adminStyles.leaderboardRiddleControl}>
            <TouchableOpacity onPress={() => handleChangeRiddle(item, "prev")}>
              <Icon
                name="arrow-left-circle"
                size={32}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <TextInput
              style={adminStyles.leaderboardRiddleTextInput}
              value={riddleIndexInput}
              onChangeText={setRiddleIndexInput}
              onSubmitEditing={handleRiddleInputSubmit}
              onBlur={handleRiddleInputSubmit}
              selectTextOnFocus
            />
            <TouchableOpacity onPress={() => handleChangeRiddle(item, "next")}>
              <Icon
                name="arrow-right-circle"
                size={32}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.standardScreenContainer}>
      <AdminHeader title="Gestione Classifica" />
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TeamItem item={item} />}
        contentContainerStyle={adminStyles.adminListContainer}
        ListEmptyComponent={
          <View style={styles.centeredContainer}>
            <Text style={styles.bodyText}>Nessuna squadra in classifica.</Text>
          </View>
        }
      />

      {/* Modale per aggiungere punti */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={adminStyles.adminModalContainer}>
          <View style={adminStyles.adminModalHeader}>
            <Text style={adminStyles.adminModalTitle}>Modifica Punti</Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <Icon name="x" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={adminStyles.adminModalContent}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                style={[
                  adminStyles.adminModalTitle,
                  {
                    marginBottom: theme.spacing.md,
                    fontFamily: theme.fonts.primary.medium,
                  },
                ]}
              >
                {selectedTeam?.name}
              </Text>
              <Text
                style={[
                  adminStyles.adminModalTitle,
                  {
                    marginBottom: theme.spacing.xl,
                  },
                ]}
              >
                {selectedTeam?.score} pts
              </Text>
            </View>
            <TextInput
              key={selectedTeam?.id}
              style={[
                adminStyles.adminInput,
                {
                  textAlign: "center",
                  fontSize: 24,
                  marginBottom: theme.spacing.lg,
                  padding: theme.spacing.xs,
                  color: theme.colors.textPrimary,
                  minHeight: 60,
                },
              ]}
              placeholderTextColor={theme.colors.textSecondary}
              placeholder="es. 100 o -50"
              keyboardType="numeric"
              value={points}
              onChangeText={(point) => setPoints(point)}
            />
            <PrimaryButton title="Assegna Punti" onPress={handleAddPoints} />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default AdminLeaderboardScreen;
