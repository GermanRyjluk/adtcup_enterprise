import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import { DocumentData } from "firebase/firestore";
import { Feather as Icon } from "@expo/vector-icons";

// --- Importazioni Locali ---
import { AuthContext } from "../../contexts/AuthContext";
import { MainStackNavigationProps } from "../../navigation/types";
import { listenToClues } from "../../api/clueService";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";
import { useFadeIn } from "../../hooks/animationHooks";

type CluesScreenProps = MainStackNavigationProps<"Clues">;

// --- Nuovo Componente per ogni Indizio ---
const ClueItem: React.FC<{ item: DocumentData; index: number }> = ({
  item,
  index,
}) => {
  const fadeIn = useFadeIn(500, index * 100);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  useEffect(() => {
    if (item.photo) {
      Image.getSize(
        item.photo,
        (width, height) => setAspectRatio(width / height),
        () => setAspectRatio(1) // Fallback in caso di errore
      );
    }
  }, [item.photo]);

  return (
    <Animated.View style={[styles.clueItem, fadeIn]}>
      <View style={styles.clueHeader}>
        <Icon name="key" size={20} color={theme.colors.accentPrimary} />
        <Text style={styles.clueTitle}>Indizio {index + 1}</Text>
      </View>

      {item.message && <Text style={styles.clueText}>{item.message}</Text>}

      {item.photo && (
        <Image
          source={{ uri: item.photo }}
          style={[styles.clueImage, { aspectRatio }]}
        />
      )}
    </Animated.View>
  );
};

// --- Schermata Principale Aggiornata ---
const CluesScreen: React.FC<CluesScreenProps> = ({ route, navigation }) => {
  const { riddleId, unlockedCluesCount } = route.params;
  const authContext = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [allClues, setAllClues] = useState<DocumentData[]>([]);

  useEffect(() => {
    if (!authContext?.currentEventId) {
      setLoading(false);
      return;
    }
    const unsubscribe = listenToClues(
      authContext.currentEventId,
      riddleId,
      (clueData) => {
        setAllClues(clueData);
        if (loading) setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authContext?.currentEventId, riddleId]);

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

  // Filtra gli indizi da mostrare in base al conteggio passato
  const cluesToShow = allClues.slice(0, unlockedCluesCount);

  return (
    <View
      style={[
        styles.standardScreenContainer,
        { backgroundColor: theme.colors.backgroundEnd },
      ]}
    >
      <View style={[styles.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Indizi Sbloccati</Text>
        <View style={{ width: 24 }} />
      </View>

      {cluesToShow.length > 0 ? (
        <FlatList
          data={cluesToShow}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ClueItem item={item} index={index} />
          )}
          contentContainerStyle={{
            padding: theme.spacing.md,
            paddingTop: 0,
            paddingBottom: 100,
          }}
        />
      ) : (
        <View style={styles.centeredContainer}>
          <Icon name="lock" size={60} color={theme.colors.textSecondary} />
          <Text style={[styles.bodyText, { marginTop: theme.spacing.md }]}>
            Nessun indizio sbloccato per questo enigma.
          </Text>
        </View>
      )}
    </View>
  );
};

export default CluesScreen;
