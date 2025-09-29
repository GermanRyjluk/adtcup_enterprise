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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { styles as globalStyles } from "@/src/styles/styles";
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

// ### COMPONENTE MODALE ESTERNO (FIX DEFINITIVO) ###
// Definito fuori dal componente principale per evitare ri-creazioni.
const TeamEditorModal = ({ isVisible, onClose, initialData, eventId }) => {
  if (!isVisible) {
    return null;
  }

  const modal = useContext(ModalContext);
  const [isCreating] = useState(!initialData);

  // Stato interno per tutti i campi del form.
  // useState viene chiamato una sola volta alla creazione del componente.
  const [name, setName] = useState(initialData?.name || "");
  const [numericId, setNumericId] = useState(
    initialData?.numericId?.toString() || ""
  );
  const [score, setScore] = useState(initialData?.score?.toString() || "0");
  const [currentRiddleIndex, setCurrentRiddleIndex] = useState(
    initialData?.currentRiddleIndex || ""
  );
  const [currentRiddleNumber, setCurrentRiddleNumber] = useState(
    initialData?.currentRiddleNumber?.toString() || "1"
  );
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || "");
  const [startLocationLat, setStartLocationLat] = useState(
    initialData?.startLocation?.latitude?.toString() || ""
  );
  const [startLocationLon, setStartLocationLon] = useState(
    initialData?.startLocation?.longitude?.toString() || ""
  );
  const [lastScanTime, setLastScanTime] = useState(
    initialData?.lastScanTime instanceof Timestamp
      ? initialData.lastScanTime.toDate()
      : null
  );

  const [showScanTimePicker, setShowScanTimePicker] = useState(false);
  const [showPlayerManager, setShowPlayerManager] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<DocumentData[]>([]);
  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);

  useEffect(() => {
    if (!showPlayerManager) return;
    const unsubscribe = listenToUsersRegisteredAfter(
      filterDate,
      setFilteredUsers
    );
    return () => unsubscribe();
  }, [filterDate, showPlayerManager]);

  const { teamMembers, availablePlayers } = useMemo(() => {
    if (!initialData || !initialData.numericId) {
      return { teamMembers: [], availablePlayers: [] };
    }
    const members = filteredUsers.filter(
      (user) => user.teamId === initialData.numericId
    );
    const available = filteredUsers.filter((user) => !user.teamId);
    return { teamMembers: members, availablePlayers: available };
  }, [initialData, filteredUsers]);

  const handleSave = async () => {
    const numId = parseInt(numericId, 10);
    if (!eventId || !name.trim() || isNaN(numId)) {
      modal?.showModal({
        type: "error",
        title: "Dati mancanti",
        message: "Nome squadra e ID Numerico sono obbligatori.",
      });
      return;
    }

    try {
      const dataToSave: DocumentData = {
        name: name.trim(),
        numericId: numId,
        score: parseInt(score, 10) || 0,
        currentRiddleIndex: currentRiddleIndex.trim(),
        currentRiddleNumber: parseInt(currentRiddleNumber, 10) || 1,
        photoUrl: photoUrl.trim(),
      };

      const lat = parseFloat(startLocationLat);
      const lon = parseFloat(startLocationLon);
      if (!isNaN(lat) && !isNaN(lon)) {
        dataToSave.startLocation = new GeoPoint(lat, lon);
      }

      if (lastScanTime) {
        dataToSave.lastScanTime = Timestamp.fromDate(lastScanTime);
      }

      if (isCreating) {
        await adminCreateTeam(eventId, dataToSave);
      } else if (initialData) {
        await adminUpdateTeam(eventId, initialData.id, dataToSave);
      }
      onClose();
    } catch (error: any) {
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: error.message,
      });
    }
  };

  const handleAssignPlayer = async (userId: string) => {
    if (!eventId || !initialData?.numericId) return;
    await adminAssignUserToTeam(eventId, initialData.numericId, userId);
  };

  const handleRemovePlayer = async (userId: string) => {
    await adminRemoveUserFromTeam(userId);
  };

  const onScanTimeChange = (event: any, selectedDate?: Date) => {
    setShowScanTimePicker(false);
    if (event.type === "set" && selectedDate) {
      setLastScanTime(selectedDate);
    }
  };

  const onFilterDateChange = (event: any, selectedDate?: Date) => {
    setShowFilterDatePicker(false);
    if (selectedDate) {
      setFilterDate(selectedDate);
    }
  };

  const formattedScanTime = lastScanTime
    ? lastScanTime.toLocaleString("it-IT")
    : "Seleziona data";

  return (
    <Modal
      animationType="slide"
      transparent
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={adminStyles.adminModalContainer}>
        <View style={adminStyles.adminModalHeader}>
          <Text style={adminStyles.adminModalTitle}>
            {isCreating ? "Crea Squadra" : "Modifica Squadra"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="x" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={adminStyles.adminModalContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={adminStyles.adminSection}>
            <Text style={adminStyles.adminSectionTitle}>Info Squadra</Text>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Nome Squadra</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>ID Numerico</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={numericId}
                onChangeText={setNumericId}
                keyboardType="number-pad"
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Punteggio</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={score}
                onChangeText={setScore}
                keyboardType="number-pad"
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>ID Quiz Attuale</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={currentRiddleIndex}
                onChangeText={setCurrentRiddleIndex}
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Numero Quiz</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={currentRiddleNumber}
                onChangeText={setCurrentRiddleNumber}
                keyboardType="number-pad"
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>URL Foto</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={photoUrl}
                onChangeText={setPhotoUrl}
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Latitudine</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={startLocationLat}
                onChangeText={setStartLocationLat}
                keyboardType="numeric"
              />
            </View>
            <View style={adminStyles.adminRow}>
              <Text style={adminStyles.adminLabel}>Longitudine</Text>
              <TextInput
                style={adminStyles.adminInput}
                value={startLocationLon}
                onChangeText={setStartLocationLon}
                keyboardType="numeric"
              />
            </View>
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
                value={lastScanTime || new Date()}
                mode="datetime"
                display="default"
                onChange={onScanTimeChange}
                themeVariant="dark"
              />
            )}
          </View>

          {!isCreating && (
            <>
              <TouchableOpacity
                style={localStyles.secondaryButton}
                onPress={() => setShowPlayerManager((prev) => !prev)}
              >
                <Text style={localStyles.secondaryButtonText}>
                  {showPlayerManager
                    ? "Nascondi Giocatori"
                    : "Gestisci Giocatori"}
                </Text>
                <Icon
                  name={showPlayerManager ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.colors.textPrimary}
                />
              </TouchableOpacity>

              {showPlayerManager && (
                <View
                  style={[
                    adminStyles.adminSection,
                    { marginTop: theme.spacing.md },
                  ]}
                >
                  <Text style={adminStyles.adminSectionTitle}>
                    Membri Squadra
                  </Text>
                  {teamMembers.length > 0 ? (
                    teamMembers.map((user) => (
                      <View key={user.id} style={adminStyles.adminListItem}>
                        <Text style={adminStyles.adminListItemTitle}>
                          {user.username}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemovePlayer(user.id)}
                        >
                          <Icon
                            name="x-circle"
                            size={24}
                            color={theme.colors.error}
                          />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text
                      style={[
                        globalStyles.bodyText,
                        { textAlign: "left", padding: 10 },
                      ]}
                    >
                      Nessun giocatore in squadra.
                    </Text>
                  )}

                  <Text style={adminStyles.adminSectionTitle}>
                    Giocatori Disponibili
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowFilterDatePicker(true)}
                    style={adminStyles.adminRow}
                  >
                    <Text style={adminStyles.adminLabel}>
                      Filtra utenti dal:
                    </Text>
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

                  {availablePlayers.length > 0 ? (
                    availablePlayers.map((user) => (
                      <View key={user.id} style={adminStyles.adminListItem}>
                        <Text style={adminStyles.adminListItemTitle}>
                          {user.username}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleAssignPlayer(user.id)}
                        >
                          <Icon
                            name="plus-circle"
                            size={24}
                            color={theme.colors.success}
                          />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text
                      style={[
                        globalStyles.bodyText,
                        { textAlign: "left", padding: 10 },
                      ]}
                    >
                      Nessun giocatore disponibile.
                    </Text>
                  )}
                </View>
              )}
            </>
          )}

          <PrimaryButton
            title={isCreating ? "Crea Squadra" : "Salva Modifiche"}
            onPress={handleSave}
            style={{ marginVertical: theme.spacing.lg }}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const AdminTeamsScreen: React.FC<Props> = () => {
  const authContext = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<DocumentData[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<DocumentData | null>(null);

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

  const handleOpenModal = (team: DocumentData | null) => {
    setSelectedTeam(team);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTeam(null);
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

  const renderTeamItem = ({ item }: { item: DocumentData }) => (
    <TouchableOpacity
      style={adminStyles.adminListItem}
      onPress={() => handleOpenModal(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={adminStyles.adminListItemContent}>
        <Text style={adminStyles.adminListItemTitle}>{item.name}</Text>
        <Text style={adminStyles.adminListItemSubtitle}>
          ID: {item.numericId ?? "N/A"} - Punti: {item.score || 0}
        </Text>
      </View>
      <Icon name="edit-2" size={24} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.standardScreenContainer}>
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
          <View style={globalStyles.centeredContainer}>
            {loading ? (
              <ActivityIndicator color={theme.colors.accentPrimary} />
            ) : (
              <Text style={globalStyles.bodyText}>Nessuna squadra creata.</Text>
            )}
          </View>
        }
      />

      {isModalVisible && (
        <TeamEditorModal
          isVisible={isModalVisible}
          onClose={handleCloseModal}
          initialData={selectedTeam}
          eventId={authContext?.currentEventId}
          onSave={handleCloseModal}
        />
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.lg,
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.primary.bold,
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
});

export default AdminTeamsScreen;
