import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from "react-native";
import { DocumentData } from "firebase/firestore";
import { Feather as Icon } from "@expo/vector-icons";

// --- Importazioni Locali ---
import { AuthContext } from "../../contexts/AuthContext";
import { MainStackNavigationProps } from "../../navigation/types";
import { listenToClues } from "../../api/clueService";
import { getUserProfile } from "../../api/userService";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";
import { useFadeIn } from "../../hooks/animationHooks";

type CluesScreenProps = MainStackNavigationProps<"Clues">;

// Componente per ogni riga della lista
const ClueItem: React.FC<{ item: DocumentData; index: number }> = ({
  item,
  index,
}) => {
  const fadeIn = useFadeIn(500, index * 100);
  return (
    <Animated.View style={[styles.clueItem, fadeIn]}>
      <Icon
        name="key"
        size={20}
        color={theme.colors.accentPrimary}
        style={styles.clueIcon}
      />
      <Text style={[styles.bodyText, { textAlign: "left", flex: 1 }]}>
        {item.text}
      </Text>
    </Animated.View>
  );
};

const CluesScreen: React.FC<CluesScreenProps> = ({ route, navigation }) => {
  const { riddleId } = route.params;
  const authContext = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [clues, setClues] = useState<DocumentData[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);

  // 1. Recupera l'eventId dell'utente al primo caricamento
  useEffect(() => {
    const fetchUserEvent = async () => {
      if (authContext?.user) {
        const profile = await getUserProfile(authContext.user.uid);
        if (profile?.currentEventId) {
          setEventId(profile.currentEventId);
        } else {
          setLoading(false);
        }
      }
    };
    fetchUserEvent();
  }, [authContext?.user]);

  // 2. Imposta il listener per gli indizi quando l'eventId è disponibile
  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = listenToClues(eventId, riddleId, (clueData) => {
      setClues(clueData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, riddleId]);

  if (loading) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.colors.backgroundEnd },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.centeredContainer,
        { backgroundColor: theme.colors.backgroundEnd },
      ]}
    >
      <View style={[styles.header, { paddingBottom: 0 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Indizi Sbloccati</Text>
        <View style={{ width: 24 }} />
      </View>
      {clues.length > 0 ? (
        <FlatList
          data={clues}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ClueItem item={item} index={index} />
          )}
          contentContainerStyle={{
            padding: theme.spacing.md,
            paddingBottom: 100,
          }}
        />
      ) : (
        <View style={styles.centeredContainer}>
          <Text style={styles.bodyText}>
            Nessun indizio sbloccato per questo enigma.
          </Text>
        </View>
      )}
    </View>
  );
};

export default CluesScreen;
