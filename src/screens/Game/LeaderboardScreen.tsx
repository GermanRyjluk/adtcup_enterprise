import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Animated,
} from "react-native";
import { DocumentData } from "firebase/firestore";
import { Feather as Icon } from "@expo/vector-icons";

// --- Importazioni Locali ---
import { AuthContext } from "../../contexts/AuthContext";
import { GameTabScreenProps } from "../../navigation/types";
import { listenToLeaderboard } from "../../api/leaderboardService";
import { getUserProfile } from "../../api/userService";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";
import { useFadeIn } from "../../hooks/animationHooks";

type LeaderboardScreenProps = GameTabScreenProps<"LeaderboardTab">;

// Componente per ogni riga della classifica
const LeaderboardItem: React.FC<{
  item: DocumentData;
  index: number;
  isUserTeam: boolean;
}> = ({ item, index, isUserTeam }) => {
  const fadeIn = useFadeIn(500, index * 100);
  const position = index + 1;

  const medalIcons: {
    [key: number]: { name: keyof typeof Icon.glyphMap; color: string };
  } = {
    1: { name: "award", color: "#FFD700" }, // Oro
    2: { name: "award", color: "#C0C0C0" }, // Argento
    3: { name: "award", color: "#CD7F32" }, // Bronzo
  };

  return (
    <Animated.View
      style={[
        styles.leaderboardRow,
        isUserTeam && styles.userLeaderboardRow,
        fadeIn,
      ]}
    >
      <Text style={styles.leaderboardPosition}>{position}</Text>
      <View style={styles.leaderboardIconContainer}>
        {medalIcons[position] ? (
          <Icon
            name={medalIcons[position].name}
            size={24}
            color={medalIcons[position].color}
          />
        ) : null}
      </View>
      <Text style={styles.leaderboardTeamName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.leaderboardScore}>{item.score} pts</Text>
    </Animated.View>
  );
};

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  navigation,
}) => {
  const authContext = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<DocumentData[]>([]);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);

  useEffect(() => {
    const setupListeners = async () => {
      if (!authContext?.user) {
        setLoading(false);
        return;
      }

      // 1. Recupera il profilo utente per ottenere eventId e teamId
      const profile = await getUserProfile(authContext.user.uid);
      if (profile?.currentEventId && profile?.teamId) {
        setUserTeamId(profile.teamId);

        // 2. Imposta il listener per la classifica
        const unsubscribe = listenToLeaderboard(
          profile.currentEventId,
          (teams) => {
            setLeaderboard(teams);
            if (loading) setLoading(false);
          }
        );

        // Funzione di cleanup
        return () => unsubscribe();
      } else {
        setLoading(false); // Nessun evento o team trovato
      }
    };

    setupListeners();
  }, [authContext?.user]);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.standardScreenContainer}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Classifica</Text>
      </View>
      {leaderboard.length > 0 ? (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <LeaderboardItem
              item={item}
              index={index}
              isUserTeam={item.id === userTeamId}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }} // Spazio per la tab bar
        />
      ) : (
        <View style={styles.centeredContainer}>
          <Text style={styles.bodyText}>
            La classifica per questo evento non è ancora disponibile.
          </Text>
        </View>
      )}
    </View>
  );
};

export default LeaderboardScreen;
