import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { DocumentData } from "firebase/firestore";

// --- Importazioni Locali ---
import { AuthContext } from "../../contexts/AuthContext";
import { GameTabScreenProps } from "../../navigation/types";
import { getEventDetails } from "../../api/eventService"; // Importiamo il servizio
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";
import { useBounceIn } from "../../hooks/animationHooks";
import { GameHeader } from "@/src/components/GameHeader";

type ManualScreenProps = GameTabScreenProps<"ManualTab">;

type ManualCardData = {
  id: string;
  icon: keyof typeof Icon.glyphMap;
  title: string;
  description: string;
};

// Componente per la singola card (invariato)
const ManualCardItem: React.FC<{ item: ManualCardData; index: number }> = ({
  item,
  index,
}) => {
  const anim = useBounceIn(600, index * 100);
  return (
    <Animated.View style={[styles.manualCard, anim]}>
      <Icon name={item.icon} size={40} color={theme.colors.accentPrimary} />
      <Text style={styles.manualCardTitle}>{item.title}</Text>
      <Text style={styles.manualCardDescription}>{item.description}</Text>
    </Animated.View>
  );
};

const ManualScreen: React.FC<ManualScreenProps> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [manualCards, setManualCards] = useState<ManualCardData[]>([]);

  useEffect(() => {
    const fetchManualData = async () => {
      // Assicurati che l'ID dell'evento sia disponibile nel contesto
      if (authContext?.currentEventId) {
        try {
          const eventData = await getEventDetails(authContext.currentEventId);
          // Usiamo i "helpfulTips" dall'evento, con un fallback a un array vuoto
          setManualCards(eventData?.manualTips || []);
        } catch (error) {
          console.error("Errore nel caricamento del manuale:", error);
          setManualCards([]); // In caso di errore, non mostrare nulla
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // Nessun evento in corso
      }
    };

    fetchManualData();
  }, [authContext?.currentEventId]); // Ricarica i dati se l'evento cambia

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.standardScreenContainer}>
      <GameHeader title="Manuale di Gioco" />
      {manualCards.length > 0 ? (
        <FlatList
          data={manualCards}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ManualCardItem item={item} index={index} />
          )}
          numColumns={2}
          contentContainerStyle={{ alignItems: "center", paddingBottom: 100 }}
        />
      ) : (
        <View style={styles.centeredContainer}>
          <Text style={styles.bodyText}>
            Nessun consiglio disponibile per questo evento.
          </Text>
        </View>
      )}
    </View>
  );
};

export default ManualScreen;
