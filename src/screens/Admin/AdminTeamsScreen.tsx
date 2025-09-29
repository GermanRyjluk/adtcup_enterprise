import { Feather as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DocumentData, GeoPoint, Timestamp } from "firebase/firestore";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { styles } from "@/src/styles/styles";
import {
  adminAssignUserToTeam,
  adminCreateTeam,
  adminDeleteTeam,
  adminRemoveUserFromTeam,
  adminUpdateTeam,
  listenToAllTeamsProgress,
  listenToUsersRegisteredAfter,
} from "../../api/adminService";
import { AdminHeader } from "../../components/AdminHeader";
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
  | { type: "empty"; message: string };

const AdminTeamsScreen: React.FC<Props> = () => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<DocumentData[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<DocumentData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<DocumentData[]>([]);

  // Stati per i selettori di data
  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);
  const [showScanTimePicker, setShowScanTimePicker] = useState(false); // Stato per il nuovo picker

  const [editableTeamData, setEditableTeamData] = useState({
    name: "",
    numericId: "",
    score: "",
    currentRiddleIndex: "",
    currentRiddleNumber: "",
    photoUrl: "",
    startLocationLat: "",
    startLocationLon: "",
    lastScanTime: "",
  });

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
    const unsubscribe = listenToUsersRegisteredAfter(
      filterDate,
      setFilteredUsers
    );
    return () => unsubscribe();
  }, [filterDate]);

  const { teamMembers, availablePlayers } = useMemo(() => {
    if (!selectedTeam || !selectedTeam.numericId) {
      return { teamMembers: [], availablePlayers: [] };
    }
    const members = filteredUsers.filter(
      (user) => user.teamId === selectedTeam.numericId
    );
    const available = filteredUsers.filter((user) => !user.teamId);
    return { teamMembers: members, availablePlayers: available };
  }, [selectedTeam, filteredUsers]);

  const onFilterDateChange = (event: any, selectedDate?: Date) => {
    setShowFilterDatePicker(false);
    if (selectedDate) {
      setFilterDate(selectedDate);
    }
  };

  // Handler per il nuovo DatePicker di lastScanTime
  const onScanTimeChange = (event: any, selectedDate?: Date) => {
    setShowScanTimePicker(false);
    if (event.type === "set" && selectedDate) {
      setEditableTeamData((prev) => ({
        ...prev,
        lastScanTime: selectedDate.toISOString(),
      }));
    }
  };

  const handleOpenModal = (team: DocumentData | null) => {
    setIsCreating(!team);
    setSelectedTeam(team);

    const lastScanTimeString =
      team?.lastScanTime instanceof Timestamp
        ? team.lastScanTime.toDate().toISOString()
        : "";

    setEditableTeamData({
      name: team?.name || "",
      numericId: team?.numericId?.toString() || "",
      score: team?.score?.toString() || "0",
      currentRiddleIndex: team?.currentRiddleIndex || "",
      currentRiddleNumber: team?.currentRiddleNumber?.toString() || "1",
      photoUrl: team?.photoUrl || "",
      startLocationLat: team?.startLocation?.latitude?.toString() || "",
      startLocationLon: team?.startLocation?.longitude?.toString() || "",
      lastScanTime: lastScanTimeString,
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleSave = async () => {
    const {
      name,
      numericId,
      score,
      startLocationLat,
      startLocationLon,
      lastScanTime,
      ...rest
    } = editableTeamData;

    const numId = parseInt(numericId, 10);
    if (!authContext?.currentEventId || !name || isNaN(numId)) {
      modal?.showModal({
        type: "error",
        title: "Dati mancanti",
        message: "Nome squadra e ID Numerico valido sono obbligatori.",
      });
      return;
    }

    try {
      const dataToSave: DocumentData = {
        name: name.trim(),
        numericId: numId,
        score: parseInt(score, 10) || 0,
        currentRiddleIndex: rest.currentRiddleIndex.trim(),
        currentRiddleNumber: parseInt(rest.currentRiddleNumber, 10) || 1,
        photoUrl: rest.photoUrl.trim(),
      };

      const lat = parseFloat(startLocationLat);
      const lon = parseFloat(startLocationLon);
      if (!isNaN(lat) && !isNaN(lon)) {
        dataToSave.startLocation = new GeoPoint(lat, lon);
      }

      if (lastScanTime) {
        const date = new Date(lastScanTime);
        if (!isNaN(date.getTime())) {
          dataToSave.lastScanTime = Timestamp.fromDate(date);
        }
      }

      if (isCreating) {
        await adminCreateTeam(authContext.currentEventId, dataToSave);
      } else if (selectedTeam) {
        await adminUpdateTeam(
          authContext.currentEventId,
          selectedTeam.id,
          dataToSave
        );
      }
      handleCloseModal();
    } catch (error: any) {
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: error.message,
      });
      console.error("Errore salvataggio team:", error);
    }
  };

  const handleDelete = (team: DocumentData) => {
    Alert.alert(
      "Conferma",
      `Sei sicuro di voler eliminare il team "${team.name}"?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            if (!authContext?.currentEventId) return;
            await adminDeleteTeam(authContext.currentEventId, team.id);
          },
        },
      ]
    );
  };

  const handleAssignPlayer = async (userId: string) => {
    if (
      !authContext?.currentEventId ||
      !selectedTeam ||
      !selectedTeam.numericId
    )
      return;
    await adminAssignUserToTeam(
      authContext.currentEventId,
      selectedTeam.numericId,
      userId
    );
  };

  const handleRemovePlayer = async (userId: string) => {
    await adminRemoveUserFromTeam(userId);
  };

  const renderTeamItem = ({ item }: { item: DocumentData }) => (
    <TouchableOpacity
      style={adminStyles.adminListItem}
      onPress={() => handleOpenModal(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={adminStyles.adminListItemContent}>
        <Text style={adminStyles.adminListItemTitle}>{item.name}</Text>
        <Text style={adminStyles.adminListItemSubtitle}>
          ID Numerico: {item.numericId ?? "N/A"} - Punti: {item.score || 0}
        </Text>
      </View>
      <Icon name="edit-2" size={24} color={theme.colors.textSecondary} />
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

  const modalListData: ListItem[] = useMemo(() => {
    if (isCreating) return [];
    const data: ListItem[] = [
      { type: "header", title: "Giocatori in squadra" },
    ];
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
    if (availablePlayers.length > 0) {
      availablePlayers.forEach((p) =>
        data.push({ type: "player", data: p, inTeam: false })
      );
    } else {
      data.push({
        type: "empty",
        message: "Nessun giocatore disponibile trovato.",
      });
    }
    return data;
  }, [isCreating, teamMembers, availablePlayers]);

  const renderModalListItem = ({ item }: { item: ListItem }) => {
    switch (item.type) {
      case "header":
        return <Text style={adminStyles.adminSectionTitle}>{item.title}</Text>;
      case "player":
        return renderPlayerItem({ item: item.data, inTeam: item.inTeam });
      case "empty":
        return (
          <Text style={[styles.bodyText, { textAlign: "left", padding: 10 }]}>
            {item.message}
          </Text>
        );
      default:
        return null;
    }
  };

  const renderTextInput = (
    label: string,
    field: keyof typeof editableTeamData,
    keyboardType: any = "default"
  ) => (
    <View style={adminStyles.adminRow}>
      <Text style={adminStyles.adminLabel}>{label}</Text>
      <TextInput
        style={adminStyles.adminInput}
        value={editableTeamData[field]}
        keyboardType={keyboardType}
        onChangeText={(text) =>
          setEditableTeamData((prev) => ({ ...prev, [field]: text }))
        }
        placeholderTextColor={theme.colors.textSecondary}
      />
    </View>
  );

  const renderModalHeader = () => {
    const formattedScanTime = editableTeamData.lastScanTime
      ? new Date(editableTeamData.lastScanTime).toLocaleString("it-IT")
      : "Seleziona data";

    return (
      <View>
        <Text style={adminStyles.adminSectionTitle}>Info Squadra</Text>
        {renderTextInput("Nome Squadra", "name")}
        {renderTextInput("ID Numerico", "numericId", "number-pad")}
        {renderTextInput("Punteggio", "score", "number-pad")}
        {renderTextInput("ID Quiz Attuale", "currentRiddleIndex")}
        {renderTextInput(
          "Numero Quiz Attuale",
          "currentRiddleNumber",
          "number-pad"
        )}
        {renderTextInput("URL Foto", "photoUrl")}
        {renderTextInput("Latitudine Partenza", "startLocationLat", "numeric")}
        {renderTextInput("Longitudine Partenza", "startLocationLon", "numeric")}

        {/* Campo Data/Ora cliccabile */}
        <View style={adminStyles.adminRow}>
          <Text style={adminStyles.adminLabel}>Ultima Scansione</Text>
          <TouchableOpacity
            onPress={() => setShowScanTimePicker(true)}
            style={{ flex: 1 }}
          >
            <Text style={adminStyles.adminInput}>{formattedScanTime}</Text>
          </TouchableOpacity>
        </View>

        {showScanTimePicker && (
          <DateTimePicker
            value={new Date(editableTeamData.lastScanTime || Date.now())}
            mode="datetime"
            display="default"
            onChange={onScanTimeChange}
            style={{ marginBottom: theme.spacing.md }}
            themeVariant="dark"
          />
        )}

        <TouchableOpacity
          onPress={() => setShowFilterDatePicker(true)}
          style={adminStyles.adminRow}
        >
          <Text style={adminStyles.adminLabel}>Filtra utenti dal:</Text>
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
            themeVariant="dark"
          />
        )}
      </View>
    );
  };

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
        contentContainerStyle={adminStyles.adminListContainer}
        ListEmptyComponent={
          <View style={styles.centeredContainer}>
            {loading ? (
              <ActivityIndicator color={theme.colors.accentPrimary} />
            ) : (
              <Text style={styles.bodyText}>Nessuna squadra creata.</Text>
            )}
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent
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
            ListFooterComponent={
              <PrimaryButton
                title={isCreating ? "Crea Squadra" : "Salva Modifiche"}
                onPress={handleSave}
                style={{ marginVertical: theme.spacing.md }}
              />
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default AdminTeamsScreen;
