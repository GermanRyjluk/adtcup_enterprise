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
import { getEventDetails, listenEventDetails } from "@/src/api/eventService";
import { GameHeader } from "@/src/components/GameHeader";

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
      <Text style={styles.leaderboardPosition}>{position}.</Text>
      {medalIcons[position] ? (
        <View style={styles.leaderboardIconContainer}>
          <Icon
            name={medalIcons[position].name}
            size={24}
            color={medalIcons[position].color}
          />
        </View>
      ) : null}
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
  const [userTeamId, setUserTeamId] = useState<number | null>(null);
  const [isScoreboardVisible, setIsScoreboardVisible] = useState(false);

  useEffect(() => {
    if (!authContext?.currentEventId || !authContext?.teamId) {
      setLoading(false);
      return;
    }

    setUserTeamId(authContext.teamId);

    // 3. Listener per i dettagli dell'evento (per controllare la visibilità)
    const unsubscribeEvent = listenEventDetails(
      authContext.currentEventId,
      (eventData) => {
        setIsScoreboardVisible(eventData?.isScoreboardVisible ?? false);
      }
    );

    // 4. Listener per i dati della classifica
    const unsubscribeLeaderboard = listenToLeaderboard(
      authContext.currentEventId,
      (teams) => {
        setLeaderboard(teams);
        if (loading) setLoading(false);
      }
    );

    // 5. Funzione di cleanup che interrompe ENTRAMBI i listener
    return () => {
      unsubscribeEvent();
      unsubscribeLeaderboard();
    };
  }, [authContext]);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.standardScreenContainer}>
      <GameHeader title="Classifica" />

      {/* 6. Render condizionale basato su isScoreboardVisible */}
      {isScoreboardVisible ? (
        leaderboard.length > 0 ? (
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
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <View style={styles.centeredContainer}>
            <Text style={styles.bodyText}>
              La classifica è vuota al momento.
            </Text>
          </View>
        )
      ) : (
        <View style={styles.centeredContainer}>
          <Icon name="eye-off" size={60} color={theme.colors.textSecondary} />
          <Text style={[styles.bodyText, { marginTop: theme.spacing.md }]}>
            La classifica non è visibile in questa fase dell'evento.
          </Text>
        </View>
      )}
    </View>
  );
};

export default LeaderboardScreen;
