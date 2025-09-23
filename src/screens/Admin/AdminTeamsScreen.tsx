import { Feather as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DocumentData } from "firebase/firestore";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { styles } from "@/src/styles/styles";
import {
  adminAssignUserToTeam,
  adminRemoveUserFromTeam,
  listenToAllTeamsProgress,
  listenToUsersRegisteredAfter,
} from "../../api/adminService";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { AdminTabScreenProps } from "../../navigation/types";
import { adminStyles } from "../../styles/adminStyles";
import { theme } from "../../theme/theme";

type Props = AdminTabScreenProps<"AdminTeams">;

type ListItem =
  | { type: "header"; title: string }
  | { type: "player"; data: DocumentData; inTeam: boolean }
  | { type: "empty"; message: string }
  | { type: "date_picker" };

const AdminTeamsScreen: React.FC<Props> = () => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<DocumentData[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<DocumentData | null>(null);
  const [editableTeamData, setEditableTeamData] = useState<
    Partial<DocumentData>
  >({});
  const [isCreating, setIsCreating] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<DocumentData[]>([]);
  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Una settimana fa
    return d;
  });
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);

  // Listener per i team
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

  // Listener per gli utenti, si riattiva quando cambia la data del filtro
  useEffect(() => {
    const unsubscribe = listenToUsersRegisteredAfter(
      filterDate,
      setFilteredUsers
    );
    return () => unsubscribe();
  }, [filterDate]);

  const { teamMembers, availablePlayers } = useMemo(() => {
    if (!selectedTeam) return { teamMembers: [], availablePlayers: [] };

    // I membri del team sono quelli il cui teamId corrisponde, presi dalla lista filtrata
    const members = filteredUsers.filter(
      (user) => user.teamId === selectedTeam.id
    );
    // I giocatori disponibili sono quelli senza teamId
    const available = filteredUsers.filter((user) => !user.teamId);

    return { teamMembers: members, availablePlayers: available };
  }, [selectedTeam, filteredUsers]);

  const onFilterDateChange = (event: any, selectedDate?: Date) => {
    setShowFilterDatePicker(false);
    if (selectedDate) {
      setFilterDate(selectedDate);
    }
  };

  const handleOpenModal = (team: DocumentData | null) => {
    setIsCreating(!team);
    setSelectedTeam(team);
    setEditableTeamData(
      team
        ? {
            ...team,
            score: team.score?.toString() ?? "0",
            currentRiddleNumber: team.currentRiddleNumber?.toString() ?? "1",
            startLocationLat: team.startLocation?.latitude?.toString() ?? "",
            startLocationLon: team.startLocation?.longitude?.toString() ?? "",
          }
        : { name: "" }
    );
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleSave = async () => {
    // ... (logica di salvataggio invariata)
  };

  const handleDelete = (team: DocumentData) => {
    // ... (logica di cancellazione invariata)
  };

  const handleAssignPlayer = async (userId: string) => {
    if (!authContext?.currentEventId || !selectedTeam) return;
    await adminAssignUserToTeam(
      authContext.currentEventId,
      selectedTeam.id,
      userId
    );
  };

  const handleRemovePlayer = async (userId: string) => {
    if (!authContext?.currentEventId || !selectedTeam) return;
    await adminRemoveUserFromTeam(userId);
  };

  const renderTeamItem = ({ item }: { item: DocumentData }) => (
    <TouchableOpacity
      style={adminStyles.adminListItem}
      onPress={() => handleOpenModal(item)}
    >
      {/* ... (contenuto invariato) */}
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
          name={inTeam ? "x-circle" : "plus-circle"}
          size={24}
          color={inTeam ? theme.colors.error : theme.colors.success}
        />
      </TouchableOpacity>
    </View>
  );

  // Costruisce la lista di dati per la FlatList nella modal
  const modalListData: ListItem[] = useMemo(() => {
    if (isCreating) return [];

    const data: ListItem[] = [];
    data.push({ type: "header", title: "Giocatori in squadra" });
    if (teamMembers.length > 0) {
      teamMembers.forEach((p) =>
        data.push({ type: "player", data: p, inTeam: true })
      );
    } else {
      data.push({
        type: "empty",
        message: "Nessun giocatore in questa squadra.",
      });
    }

    data.push({ type: "header", title: "Giocatori disponibili" });
    data.push({ type: "date_picker" }); // Elemento per il selettore data

    if (availablePlayers.length > 0) {
      availablePlayers.forEach((p) =>
        data.push({ type: "player", data: p, inTeam: false })
      );
    } else {
      data.push({
        type: "empty",
        message: "Nessun giocatore trovato dopo la data selezionata.",
      });
    }

    return data;
  }, [isCreating, teamMembers, availablePlayers]);

  const renderModalListItem = ({ item }: { item: ListItem }) => {
    switch (item.type) {
      case "header":
        return <Text style={adminStyles.adminSectionTitle}>{item.title}</Text>;
      case "date_picker":
        return (
          <View>
            <TouchableOpacity
              onPress={() => setShowFilterDatePicker(true)}
              style={adminStyles.adminRow}
            >
              <Text style={adminStyles.adminLabel}>Mostra registrati dal:</Text>
              <Text style={adminStyles.adminInput}>
                {filterDate.toLocaleDateString("it-IT")}
              </Text>
            </TouchableOpacity>
            {showFilterDatePicker && (
              <DateTimePicker
                value={filterDate}
                mode="date"
                display="default"
                onChange={onFilterDateChange}
              />
            )}
          </View>
        );
      case "player":
        return renderPlayerItem({ item: item.data, inTeam: item.inTeam });
      case "empty":
        return <Text style={styles.bodyText}>{item.message}</Text>;
      default:
        return null;
    }
  };

  const renderModalHeader = () => (
    <View>
      <Text style={adminStyles.adminSectionTitle}>Info Squadra</Text>
      {/* ... (tutti i TextInput per i dati della squadra) */}
      <PrimaryButton
        title="Salva Modifiche"
        onPress={handleSave}
        style={{ marginVertical: theme.spacing.md }}
      />
    </View>
  );

  return (
    <View style={styles.standardScreenContainer}>
      {/* ... (Header e lista team principale invariati) */}

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
          <FlatList
            style={adminStyles.adminModalContent}
            data={modalListData}
            keyExtractor={(item, index) => `${item.type}-${index}`}
            renderItem={renderModalListItem}
            ListHeaderComponent={renderModalHeader}
            ListFooterComponent={<View style={{ height: 50 }} />}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default AdminTeamsScreen;
