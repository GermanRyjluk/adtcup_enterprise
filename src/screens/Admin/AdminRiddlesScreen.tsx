import { Feather as Icon } from "@expo/vector-icons";
import { DocumentData } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AdminHeader } from "@/src/components/AdminHeader";
import { listenToRiddles } from "../../api/adminService";
import { AuthContext } from "../../contexts/AuthContext";
import { AdminTabScreenProps } from "../../navigation/types";
import { adminStyles } from "../../styles/adminStyles"; // Nuovi stili admin
import { styles } from "../../styles/styles"; // Stili globali
import { theme } from "../../theme/theme";
import { QuizCreator } from "./QuizCreatorScreen";

type Props = AdminTabScreenProps<"AdminRiddles">;

const AdminRiddlesScreen: React.FC<Props> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [riddles, setRiddles] = useState<DocumentData[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedRiddle, setSelectedRiddle] = useState<DocumentData | null>(
    null
  );

  useEffect(() => {
    if (!authContext?.currentEventId) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToRiddles(authContext.currentEventId, (data) => {
      setRiddles(data);
      if (loading) setLoading(false);
    });

    return () => unsubscribe();
  }, [authContext?.currentEventId]);

  const getRiddleTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      riddle: "Indovinello",
      location: "",
      multipleChoice: "Quiz a Tempo",
      multipleChoiceLeaderboard: "Riepilogo Quiz",
    };
    return names[type] || "Tipo Sconosciuto";
  };

  const handleOpenModal = (riddle: DocumentData | null) => {
    setSelectedRiddle(riddle);
    setModalVisible(true);
  };
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRiddle(null);
  };

  const handleViewLeaderboard = (riddle: DocumentData) => {
    const riddleTitle = `${riddle.currentRiddleNumber}. ${
      riddle.locationName || getRiddleTypeName(riddle.type)
    }`;
    navigation.navigate("QuizLeaderboard", {
      riddleId: riddle.id,
      riddleTitle: riddleTitle,
    });
  };

  const renderRiddleItem = ({ item }: { item: DocumentData }) => (
    <View style={adminStyles.adminListItem}>
      <View
        style={[adminStyles.adminListItemContent, { justifyContent: "center" }]}
      >
        <Text style={adminStyles.adminListItemTitle}>
          {item.currentRiddleNumber}. {item.type == "location" ? "" : ""}
          {item.type == "location" ? "" : getRiddleTypeName(item.type)}
          {item.locationName}
        </Text>
        <Text style={adminStyles.adminListItemSubtitle}>{item.id}</Text>
      </View>
      <View
        style={[
          adminStyles.adminListItemActions,
          {
            alignItems: "center",
            justifyContent: "space-between",
          },
        ]}
      >
        <TouchableOpacity
          style={[
            adminStyles.adminListItem,
            {
              backgroundColor: theme.colors.backgroundEnd,
              marginRight: theme.spacing.sm,
              marginBottom: 0,
            },
          ]}
          onPress={() => handleOpenModal(item)}
        >
          <Icon name="settings" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            adminStyles.adminListItem,
            {
              backgroundColor: theme.colors.backgroundEnd,
              marginBottom: 0,
            },
          ]}
          onPress={() => handleViewLeaderboard(item)}
        >
          <Icon name="play" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
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
      <AdminHeader title="Gestione Indovinelli">
        <TouchableOpacity onPress={() => handleOpenModal(null)}>
          <Icon
            name="plus-circle"
            size={28}
            color={theme.colors.accentPrimary}
          />
        </TouchableOpacity>
      </AdminHeader>

      <FlatList
        data={riddles}
        keyExtractor={(item) => item.id}
        renderItem={renderRiddleItem}
        ListEmptyComponent={
          <View style={{ paddingTop: 50, alignItems: "center" }}>
            <Text style={styles.bodyText}>Nessun indovinello creato.</Text>
          </View>
        }
        contentContainerStyle={adminStyles.adminListContainer}
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
              {selectedRiddle ? "Modifica Quiz" : "Crea Indovinello"}
            </Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <Icon name="x" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <QuizCreator
            eventId={authContext?.currentEventId ?? null}
            initialData={selectedRiddle}
            onClose={handleCloseModal}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default AdminRiddlesScreen;
