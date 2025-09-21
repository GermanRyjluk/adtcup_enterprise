import { Feather as Icon } from "@expo/vector-icons";
import { DocumentData, Timestamp } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

import { AdminHeader } from "@/src/components/AdminHeader";
import { listenToAllTeamsProgress } from "../../api/adminService";
import { listenEventDetails } from "../../api/eventService";
import { AuthContext } from "../../contexts/AuthContext";
import { AdminTabScreenProps } from "../../navigation/types";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";

type Props = AdminTabScreenProps<"AdminDashboard">;

// Componente per le card di riepilogo
const StatCard: React.FC<{
  icon: keyof typeof Icon.glyphMap;
  label: string;
  value: string | number;
}> = ({ icon, label, value }) => (
  <View style={styles.statCard}>
    <Icon name={icon} size={24} color={theme.colors.accentPrimary} />
    <Text style={styles.statCardValue}>{value}</Text>
    <Text style={styles.statCardLabel}>{label}</Text>
  </View>
);

// Componente per la riga di progresso di un team
const TeamProgressItem: React.FC<{
  item: DocumentData;
  totalRiddles: number;
}> = ({ item, totalRiddles }) => (
  <View style={styles.teamProgressRow}>
    <Text style={styles.teamProgressName} numberOfLines={1}>
      {item.name || "Team Senza Nome"}
    </Text>
    <View style={styles.teamProgressInfo}>
      <Icon
        name="check-circle"
        size={16}
        color={theme.colors.textSecondary}
        style={{ marginRight: 4 }}
      />
      <Text style={styles.teamProgressText}>
        {item.currentRiddleNumber || 0} / {totalRiddles}
      </Text>
      <Icon
        name="star"
        size={16}
        color={theme.colors.textSecondary}
        style={{ marginLeft: 12, marginRight: 4 }}
      />
      <Text style={styles.teamProgressText}>{item.score || 0} pts</Text>
    </View>
  </View>
);

const AdminDashboardScreen: React.FC<Props> = () => {
  const authContext = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<DocumentData | null>(null);
  const [teamsProgress, setTeamsProgress] = useState<DocumentData[]>([]);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  // Listener per i dati dell'evento e dei team
  useEffect(() => {
    if (!authContext?.currentEventId) {
      setLoading(false);
      return;
    }

    const unsubscribeEvent = listenEventDetails(
      authContext.currentEventId,
      (data) => {
        setEventData(data);
      }
    );

    const unsubscribeTeams = listenToAllTeamsProgress(
      authContext.currentEventId,
      (teams) => {
        setTeamsProgress(teams);
        if (loading) setLoading(false);
      }
    );

    return () => {
      unsubscribeEvent();
      unsubscribeTeams();
    };
  }, [authContext?.currentEventId]);

  // Timer per il tempo trascorso
  useEffect(() => {
    const timer = setInterval(() => {
      if (eventData?.startTime && eventData?.isStarted) {
        const startTime = (eventData.startTime as Timestamp).toMillis();
        const now = Date.now();
        const diff = Math.max(0, now - startTime);

        const hours = String(Math.floor(diff / 3600000)).padStart(2, "0");
        const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(
          2,
          "0"
        );
        const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(
          2,
          "0"
        );

        setElapsedTime(`${hours}:${minutes}:${seconds}`);
      } else {
        setElapsedTime("00:00:00");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [eventData]);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  if (!eventData) {
    return (
      <View style={styles.standardScreenContainer}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={styles.bodyText}>Nessun evento attivo trovato.</Text>
        </View>
      </View>
    );
  }

  const totalRiddles = eventData?.totalRiddles || 10;

  return (
    <View style={styles.standardScreenContainer}>
      <AdminHeader title={`Dashboard: ${eventData.name}`} />
      <FlatList
        ListHeaderComponent={
          <>
            <Text style={styles.adminSectionTitle}>Informazione</Text>
            <View style={styles.statCardContainer}>
              <StatCard
                icon="clock"
                label="Tempo Trascorso"
                value={elapsedTime}
              />
              <StatCard
                icon="users"
                label="Squadre"
                value={teamsProgress.length}
              />
            </View>
            <Text style={styles.adminSectionTitle}>Progresso Squadre</Text>
          </>
        }
        data={teamsProgress}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TeamProgressItem item={item} totalRiddles={totalRiddles} />
        )}
        ListEmptyComponent={
          <Text style={[styles.bodyText, { textAlign: "left" }]}>
            Nessuna squadra ancora in gioco.
          </Text>
        }
        contentContainerStyle={{
          paddingBottom: 100,
          paddingHorizontal: theme.spacing.lg,
        }}
      />
    </View>
  );
};

export default AdminDashboardScreen;
