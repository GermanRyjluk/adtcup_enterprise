import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
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
import { getUserProfile } from "../../api/userService";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";
import { useFadeIn } from "../../hooks/animationHooks";

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
        source={{ uri: `https://i.pravatar.cc/150?u=${item.uid}` }}
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
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<DocumentData | null>(null);
  const [members, setMembers] = useState<DocumentData[]>([]);
  const [teamName, setTeamName] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);

  // 1. Recupera il teamId dell'utente al primo caricamento
  useEffect(() => {
    const fetchUserTeam = async () => {
      if (authContext?.user) {
        const profile = await getUserProfile(authContext.user.uid);
        if (profile?.teamId) {
          setTeamId(profile.teamId);
          setIsCaptain(profile.uid === profile.teamCaptainUid); // Controlla se l'utente è il capitano
        } else {
          setLoading(false); // Nessun team, smetti di caricare
        }
      }
    };
    fetchUserTeam();
  }, [authContext?.user]);

  // 2. Imposta i listener quando il teamId è disponibile
  useEffect(() => {
    if (!teamId) return;

    // Listener per i dati del team
    const unsubscribeTeam = listenToTeamData(teamId, (data) => {
      setTeamData(data);
      setTeamName(data?.name || "");
      if (loading) setLoading(false);
    });

    // Listener per i membri del team
    const unsubscribeMembers = listenToTeamMembers(teamId, (memberData) => {
      setMembers(memberData);
    });

    // Funzione di cleanup
    return () => {
      unsubscribeTeam();
      unsubscribeMembers();
    };
  }, [teamId]);

  const handleSaveTeamName = useCallback(async () => {
    if (!teamId || !isCaptain) return; // Solo il capitano può salvare

    const originalName = teamData?.name;
    if (teamName.trim() === originalName) return; // Nessuna modifica

    try {
      await updateTeamName(teamId, teamName);
      modal?.showModal({
        type: "success",
        title: "Successo",
        message: "Nome del team aggiornato!",
      });
    } catch (error) {
      console.error("Errore aggiornamento nome team:", error);
      setTeamName(originalName || ""); // Ripristina il nome originale in caso di errore
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: "Impossibile aggiornare il nome.",
      });
    }
  }, [teamId, teamName, teamData, isCaptain, modal]);

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
    <ScrollView style={styles.standardScreenContainer}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Il Mio Team</Text>
      </View>

      <View style={styles.teamCard}>
        <TouchableOpacity style={styles.teamIconContainer}>
          <Icon name="camera" size={32} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <TextInput
          style={styles.teamNameInput}
          value={teamName}
          onChangeText={setTeamName}
          onBlur={handleSaveTeamName} // Salva quando l'utente esce dal campo
          placeholder="Nome del Team"
          placeholderTextColor={theme.colors.textSecondary}
          editable={isCaptain} // Il campo è modificabile solo se l'utente è il capitano
        />
        {!isCaptain && (
          <Text style={styles.captainOnlyText}>
            Solo il capitano può modificare il nome.
          </Text>
        )}
      </View>

      <Text
        style={[
          styles.sectionTitle,
          { paddingHorizontal: 0, paddingBottom: theme.spacing.md },
        ]}
      >
        Membri
      </Text>
      <FlatList
        data={members}
        renderItem={({ item, index }) => (
          <TeamMemberItem item={item} index={index} />
        )}
        keyExtractor={(item) => item.uid}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

export default TeamScreen;
