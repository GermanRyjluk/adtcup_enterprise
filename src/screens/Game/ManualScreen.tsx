// src/screens/Game/ManualScreen.tsx
import { Feather as Icon } from "@expo/vector-icons";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Importazioni Locali ---
import { GameHeader } from "@/src/components/GameHeader";
import { getEventDetails } from "../../api/eventService";
import { AuthContext } from "../../contexts/AuthContext";
import { GameTabScreenProps } from "../../navigation/types";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";

type ManualScreenProps = GameTabScreenProps<"ManualTab">;

type ManualItemData = {
  id: string;
  icon: keyof typeof Icon.glyphMap;
  title: string;
  description: string;
};

// --- Nuovo Componente Accordion Interattivo ---
const ManualAccordionItem: React.FC<{ item: ManualItemData }> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const animationController = useRef(new Animated.Value(0)).current;

  const toggleExpansion = () => {
    const toValue = isExpanded ? 0 : 1;
    Animated.timing(animationController, {
      toValue: toValue,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false, // Necessario per animare l'altezza
    }).start();
    setIsExpanded(!isExpanded);
  };

  const rotateAnimation = animationController.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const bodyHeight = animationController.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1000], // Un valore grande per permettere al contenuto di espandersi
  });

  return (
    <View style={styles.manualAccordionItem}>
      <TouchableOpacity
        style={styles.manualAccordionHeader}
        onPress={toggleExpansion}
        activeOpacity={0.8}
      >
        <Icon name={item.icon} size={24} color={theme.colors.accentPrimary} />
        <Text style={styles.manualAccordionTitle}>{item.title}</Text>
        <Animated.View style={{ transform: [{ rotate: rotateAnimation }] }}>
          <Icon
            name="chevron-right"
            size={24}
            color={theme.colors.textSecondary}
          />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={{ maxHeight: bodyHeight, overflow: "hidden" }}>
        <View style={styles.manualAccordionContent}>
          <Text style={styles.manualAccordionDescription}>
            {item.description}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const ManualScreen: React.FC<ManualScreenProps> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [manualItems, setManualItems] = useState<ManualItemData[]>([]);

  useEffect(() => {
    const fetchManualData = async () => {
      if (authContext?.currentEventId) {
        try {
          const eventData = await getEventDetails(authContext.currentEventId);
          setManualItems(eventData?.manualTips || []);
        } catch (error) {
          console.error("Errore nel caricamento del manuale:", error);
          setManualItems([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchManualData();
  }, [authContext?.currentEventId]);

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
      {manualItems.length > 0 ? (
        <FlatList
          data={manualItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ManualAccordionItem item={item} />}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: 100,
          }}
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
