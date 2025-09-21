import { Feather as Icon } from "@expo/vector-icons";
import { DocumentData } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AdminHeader } from "@/src/components/AdminHeader";
import { styles } from "@/src/styles/styles";
import {
  adminAssignUserToTeam,
  adminCreateTeam,
  adminDeleteTeam,
  adminGetUsers,
  adminRemoveUserFromTeam,
  adminUpdateTeam,
  listenToAllTeamsProgress,
} from "../../api/adminService";
import { listenToTeamMembers } from "../../api/teamService";
import { PrimaryButton } from "../../components/PrimaryButton";
import { StyledInput } from "../../components/StyledInput";
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { AdminTabScreenProps } from "../../navigation/types";
import { adminStyles } from "../../styles/adminStyles";
import { theme } from "../../theme/theme";

type Props = AdminTabScreenProps<"AdminTeams">;

const AdminTeamsScreen: React.FC<Props> = () => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<DocumentData[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<DocumentData | null>(null);
  const [teamName, setTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [teamMembers, setTeamMembers] = useState<DocumentData[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<DocumentData[]>([]);

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

  useEffect(() => {
    if (selectedTeam && authContext?.currentEventId) {
      const unsubscribe = listenToTeamMembers(
        authContext.currentEventId,
        selectedTeam.id,
        setTeamMembers
      );
      return () => unsubscribe();
    }
  }, [selectedTeam, authContext?.currentEventId]);

  const handleOpenModal = async (team: DocumentData | null) => {
    setIsCreating(!team);
    setSelectedTeam(team);
    setTeamName(team ? team.name : "");
    if (team) {
      const unassigned = await adminGetUsers(true);
      setAvailablePlayers(unassigned);
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTeam(null);
    setTeamName("");
    setTeamMembers([]);
    setAvailablePlayers([]);
  };

  const handleSave = async () => {
    if (!authContext?.currentEventId || !teamName.trim()) {
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: "Il nome del team non può essere vuoto.",
      });
      return;
    }

    try {
      if (isCreating) {
        await adminCreateTeam(authContext.currentEventId, teamName.trim());
        modal?.showModal({
          type: "success",
          title: "Successo",
          message: "Squadra creata!",
        });
      } else if (selectedTeam) {
        await adminUpdateTeam(authContext.currentEventId, selectedTeam.id, {
          name: teamName.trim(),
        });
        modal?.showModal({
          type: "success",
          title: "Successo",
          message: "Nome squadra aggiornato!",
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Errore salvataggio team:", error);
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: "Impossibile salvare le modifiche.",
      });
    }
  };

  const handleDelete = (team: DocumentData) => {
    if (!authContext?.currentEventId) return;

    Alert.alert(
      "Conferma cancellazione",
      `Sei sicuro di voler eliminare la squadra "${team.name}"? L'azione è irreversibile.`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            try {
              await adminDeleteTeam(authContext.currentEventId!, team.id);
              modal?.showModal({
                type: "success",
                title: "Eliminata",
                message: "La squadra è stata cancellata.",
              });
            } catch (error) {
              console.error("Errore eliminazione team:", error);
              modal?.showModal({
                type: "error",
                title: "Errore",
                message: "Impossibile cancellare la squadra.",
              });
            }
          },
        },
      ]
    );
  };

  const handleAssignPlayer = async (userId: string) => {
    if (!authContext?.currentEventId || !selectedTeam) return;
    await adminAssignUserToTeam(
      authContext.currentEventId,
      selectedTeam.id,
      userId
    );
    const unassigned = await adminGetUsers(true);
    setAvailablePlayers(unassigned);
  };

  const handleRemovePlayer = async (userId: string) => {
    if (!authContext?.currentEventId || !selectedTeam) return;
    await adminRemoveUserFromTeam(userId);
    const unassigned = await adminGetUsers(true);
    setAvailablePlayers(unassigned);
  };

  const renderTeamItem = ({ item }: { item: DocumentData }) => (
    <TouchableOpacity
      style={adminStyles.adminListItem}
      onPress={() => handleOpenModal(item)}
    >
      <View>
        <Text style={adminStyles.adminListItemTitle}>{item.name}</Text>
        <Text style={adminStyles.adminListItemSubtitle}>
          {item.score || 0} punti
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        style={{ padding: 8 }}
      >
        <Icon name="trash-2" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderPlayerItem = ({
    item,
    inTeam,
  }: {
    item: DocumentData;
    inTeam: boolean;
  }) => (
    <View style={adminStyles.adminListItem}>
      <Text style={adminStyles.adminListItemTitle}>{item.username}</Text>
      <TouchableOpacity
        onPress={() =>
          inTeam ? handleRemovePlayer(item.id) : handleAssignPlayer(item.id)
        }
      >
        <Icon
          name={inTeam ? "minus-circle" : "plus-circle"}
          size={24}
          color={inTeam ? theme.colors.error : theme.colors.success}
        />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.standardScreenContainer}>
      <AdminHeader title="Gestione Squadre">
        <TouchableOpacity onPress={() => handleOpenModal(null)}>
          <Icon
            name="plus-circle"
            size={28}
            color={theme.colors.accentPrimary}
          />
        </TouchableOpacity>
      </AdminHeader>

      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={renderTeamItem}
        ListEmptyComponent={
          <View style={{ paddingTop: 50, alignItems: "center" }}>
            <Text style={styles.bodyText}>
              Nessuna squadra creata per questo evento.
            </Text>
          </View>
        }
        contentContainerStyle={{
          paddingBottom: 100,
          paddingHorizontal: theme.spacing.lg,
        }}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={adminStyles.adminModalContainer}>
          <View style={adminStyles.adminModalHeader}>
            <Text style={adminStyles.adminModalTitle}>
              {isCreating ? "Crea Squadra" : "Modifica Squadra"}
            </Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <Icon name="x" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={adminStyles.adminModalContent}>
            <StyledInput
              icon="users"
              placeholder="Nome della squadra"
              value={teamName}
              onChangeText={setTeamName}
            />
            <PrimaryButton
              title="Salva"
              onPress={handleSave}
              style={{ marginTop: theme.spacing.md }}
            />

            {!isCreating && (
              <>
                <Text style={adminStyles.adminSectionTitle}>
                  Giocatori in squadra
                </Text>
                <FlatList
                  data={teamMembers}
                  keyExtractor={(item) => item.id}
                  renderItem={(props) =>
                    renderPlayerItem({ ...props, inTeam: true })
                  }
                  ListEmptyComponent={
                    <Text style={styles.bodyText}>
                      Nessun giocatore in questa squadra.
                    </Text>
                  }
                />
                <Text style={adminStyles.adminSectionTitle}>
                  Giocatori disponibili
                </Text>
                <FlatList
                  data={availablePlayers}
                  keyExtractor={(item) => item.id}
                  renderItem={(props) =>
                    renderPlayerItem({ ...props, inTeam: false })
                  }
                  ListEmptyComponent={
                    <Text style={styles.bodyText}>
                      Nessun giocatore disponibile.
                    </Text>
                  }
                />
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default AdminTeamsScreen;
