import React from "react";
import { View, Text, FlatList, Animated } from "react-native";
import { Feather as Icon } from "@expo/vector-icons";

// --- Importazioni Locali ---
import { GameTabScreenProps } from "../../navigation/types";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";
import { useBounceIn } from "../../hooks/animationHooks";

type ManualScreenProps = GameTabScreenProps<"ManualTab">;

// CORREZIONE: Definiamo un tipo per le nostre card per essere più espliciti.
type ManualCard = {
  id: string;
  // Specifichiamo che 'icon' deve essere un nome di icona valido dalla libreria Feather.
  icon: keyof typeof Icon.glyphMap;
  title: string;
  description: string;
};

// Dati statici per le card del manuale, ora tipizzati con ManualCard.
const manualCards: ManualCard[] = [
  {
    id: "1",
    icon: "grid",
    title: "Scansiona",
    description: "Trova i QR code nel mondo reale per avanzare nel gioco.",
  },
  {
    id: "2",
    icon: "help-circle",
    title: "Usa gli Indizi",
    description: "Se sei in difficoltà, puoi sbloccare un aiuto prezioso.",
  },
  {
    id: "3",
    icon: "users",
    title: "Collabora",
    description:
      "Il lavoro di squadra è la chiave per risolvere gli enigmi più difficili.",
  },
  {
    id: "4",
    icon: "battery-charging",
    title: "Resta Carico",
    description:
      "Assicurati di avere il telefono carico per tutta la durata dell'evento.",
  },
  {
    id: "5",
    icon: "map-pin",
    title: "Esplora",
    description:
      "Guarda attentamente l'ambiente che ti circonda, ogni dettaglio conta.",
  },
  {
    id: "6",
    icon: "award",
    title: "Punta al Top",
    description:
      "Completa gli indovinelli velocemente per scalare la classifica.",
  },
];

// Componente dedicato per ogni card, per usare correttamente gli hooks
// Ora il tipo di 'item' è inferito correttamente come 'ManualCard'.
const ManualCardItem: React.FC<{ item: ManualCard; index: number }> = ({
  item,
  index,
}) => {
  // Applica l'animazione di rimbalzo con un ritardo progressivo
  const anim = useBounceIn(600, index * 100);
  return (
    <Animated.View style={[styles.manualCard, anim]}>
      {/* Ora TypeScript sa che 'item.icon' è un nome valido e non dà più errore. */}
      <Icon name={item.icon} size={40} color={theme.colors.accentPrimary} />
      <Text style={styles.manualCardTitle}>{item.title}</Text>
      <Text style={styles.manualCardDescription}>{item.description}</Text>
    </Animated.View>
  );
};

const ManualScreen: React.FC<ManualScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.standardScreenContainer}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Manuale di Gioco</Text>
      </View>
      <FlatList
        data={manualCards}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ManualCardItem item={item} index={index} />
        )}
        numColumns={2} // Imposta il layout a griglia
        contentContainerStyle={{ alignItems: "center", paddingBottom: 100 }}
      />
    </View>
  );
};

export default ManualScreen;
