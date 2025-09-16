import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { DocumentData } from "firebase/firestore";

// --- Importazioni Locali ---
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { GameTabScreenProps } from "../../navigation/types";
import {
  listenToTeamData,
  listenToTeamMembers,
  updateTeamName,
} from "../../api/teamService";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";
import { useFadeIn } from "../../hooks/animationHooks";
import { GameHeader } from "@/src/components/GameHeader";

type TeamScreenProps = GameTabScreenProps<"TeamTab">;

// Componente dedicato per ogni membro del team
const TeamMemberItem: React.FC<{ item: DocumentData; index: number }> = ({
  item,
  index,
}) => {
  const fadeIn = useFadeIn(500, index * 100);
  return (
    <Animated.View style={[styles.teamMemberRow, fadeIn]}>
      <Image
        source={{ uri: `https://i.pravatar.cc/300?u=${item.username}` }}
        style={styles.teamMemberAvatar}
      />
      <Text style={styles.teamMemberName}>{item.username}</Text>
    </Animated.View>
  );
};

const TeamScreen: React.FC<TeamScreenProps> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);

  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<DocumentData | null>(null);
  const [members, setMembers] = useState<DocumentData[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null); // Modificato in string
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    if (authContext?.teamId && authContext?.currentEventId) {
      setTeamId(authContext.teamId.toString()); // Converti in stringa
      setEventId(authContext.currentEventId);
    } else {
      setLoading(false);
    }
  }, [authContext?.teamId, authContext?.currentEventId]);

  useEffect(() => {
    if (!teamId || !eventId) return;

    const unsubscribeTeam = listenToTeamData(eventId, teamId, (data) => {
      setTeamData(data);
      setTeamName(data?.name || "");
      if (loading) setLoading(false);
    });

    const unsubscribeMembers = listenToTeamMembers(
      eventId,
      parseInt(teamId, 10), // Riconverti in numero per la query
      (memberData) => {
        setMembers(memberData);
      }
    );

    return () => {
      unsubscribeTeam();
      unsubscribeMembers();
    };
  }, [teamId, eventId]);

  const handleSaveTeamName = useCallback(async () => {
    if (!teamId || !eventId) return;

    const trimmedName = teamName.trim();
    const originalName = teamData?.name;

    // 1. Controlla la lunghezza prima di salvare
    if (trimmedName.length > 22) {
      modal?.showModal({
        type: "error",
        title: "Nome troppo lungo",
        message: "Il nome del team non può superare i 22 caratteri.",
      });
      return; // Interrompe l'esecuzione per non salvare
    }

    // 2. Controlla se il nome è vuoto
    if (!trimmedName) {
      modal?.showModal({
        type: "error",
        title: "Nome non valido",
        message: "Il nome del team non può essere vuoto.",
      });
      setTeamName(originalName || ""); // Ripristina il nome originale
      return;
    }

    // 3. Controlla se il nome è stato effettivamente modificato
    if (trimmedName === originalName) {
      return; // Nessun cambiamento, non fare nulla
    }

    try {
      await updateTeamName(eventId, teamId, trimmedName);
      modal?.showModal({
        type: "success",
        title: "Successo",
        message: "Nome del team aggiornato!",
      });
    } catch (error) {
      console.error("Errore aggiornamento nome team:", error);
      setTeamName(originalName || ""); // Ripristina in caso di errore di salvataggio
      modal?.showModal({
        type: "error",
        title: "Errore di Salvataggio",
        message: "Impossibile aggiornare il nome. Riprova.",
      });
    }
  }, [teamId, eventId, teamName, teamData, modal]);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  if (!teamData) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.bodyText}>
          Non fai ancora parte di un team per questo evento.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <GameHeader
        title="Il Mio Team"
        styles_override={{
          marginBottom: -20,
          zIndex: 2,
          paddingVertical: theme.spacing.md,
          backgroundColor: theme.colors.backgroundEnd,
        }}
      />
      <ScrollView>
        {/* --- Header con Immagine o Placeholder --- */}
        <View style={styles.teamHeaderContainer}>
          {teamData.photoUrl ? (
            <Image
              source={{ uri: teamData.photoUrl }}
              style={styles.teamHeaderImage}
              resizeMode="cover"
            />
          ) : (
            <View style={{ alignItems: "center" }}>
              <Icon
                name="camera-off"
                size={40}
                color={theme.colors.textSecondary}
                style={styles.teamPlaceholderIcon}
              />
              <Text style={styles.teamPlaceholderText}>
                Chiedi a un admin di caricare la foto del team!
              </Text>
            </View>
          )}
        </View>

        {/* --- Contenuto della Schermata --- */}
        <View style={styles.teamContentContainer}>
          {/* Nuovo contenitore per il nome del team */}
          <View style={styles.teamNameContainer}>
            <TextInput
              style={styles.teamNameInput}
              value={teamName}
              onChangeText={setTeamName}
              onBlur={handleSaveTeamName}
              placeholder="Nome Team"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Icon
              name="edit-2"
              size={18}
              color={theme.colors.textSecondary}
              style={styles.teamNameEditIcon}
            />
          </View>

          <Text
            style={[
              styles.teamNameCharCount,
              teamName.length > 22 && styles.teamNameCharCountError,
            ]}
          >
            {teamName.length}/22 caratteri
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              {
                paddingHorizontal: theme.spacing.lg,
                paddingBottom: theme.spacing.md,
              },
            ]}
          >
            Membri
          </Text>
          <FlatList
            data={members}
            renderItem={({ item, index }) => (
              <TeamMemberItem item={item} index={index} />
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default TeamScreen;
