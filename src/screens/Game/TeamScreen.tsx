// src/screens/Game/TeamScreen.tsx
import { Feather as Icon } from "@expo/vector-icons";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- Importazioni Locali ---
import { GameHeader } from "@/src/components/GameHeader";
import {
  listenToTeamData,
  listenToTeamMembers,
  updateTeamName,
} from "../../api/teamService";
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { useFadeIn } from "../../hooks/animationHooks";
import {
  GameTabScreenProps,
  MainStackNavigationProps,
} from "../../navigation/types";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";

type TeamScreenProps =
  | MainStackNavigationProps<"TeamDetail">
  | GameTabScreenProps<"TeamTab">;

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

const TeamScreen: React.FC<TeamScreenProps> = ({ route, navigation }) => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);

  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<DocumentData | null>(null);
  const [members, setMembers] = useState<DocumentData[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const isMyTeam =
    "params" in route && route.params?.teamId
      ? route.params.teamId === authContext?.teamId?.toString()
      : true;

  useEffect(() => {
    if (isEditingName) {
      textInputRef.current?.focus();
    }
  }, [isEditingName]);

  useEffect(() => {
    const routeTeamId =
      "params" in route && route.params?.teamId ? route.params.teamId : null;
    if (routeTeamId) {
      setTeamId(routeTeamId);
    } else if (authContext?.teamId) {
      setTeamId(authContext.teamId.toString());
    }

    if (authContext?.currentEventId) {
      setEventId(authContext.currentEventId);
    } else {
      setLoading(false);
    }
  }, [route, authContext]);

  useEffect(() => {
    if (!teamId || !eventId) return;

    setLoading(true);
    const unsubscribeTeam = listenToTeamData(eventId, teamId, (data) => {
      setTeamData(data);
      setTeamName(data?.name || "");
      setLoading(false);
    });

    const unsubscribeMembers = listenToTeamMembers(
      eventId,
      parseInt(teamId, 10),
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
    setIsEditingName(false);
    if (!teamId || !eventId || !isMyTeam) return;

    const trimmedName = teamName.trim();
    const originalName = teamData?.name;

    if (trimmedName.length > 22) {
      modal?.showModal({
        type: "error",
        title: "Nome troppo lungo",
        message: "Il nome del team non può superare i 22 caratteri.",
      });
      setTeamName(originalName || "");
      return;
    }

    if (!trimmedName) {
      modal?.showModal({
        type: "error",
        title: "Nome non valido",
        message: "Il nome del team non può essere vuoto.",
      });
      setTeamName(originalName || "");
      return;
    }

    if (trimmedName === originalName) {
      return;
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
      setTeamName(originalName || "");
      modal?.showModal({
        type: "error",
        title: "Errore di Salvataggio",
        message: "Impossibile aggiornare il nome. Riprova.",
      });
    }
  }, [teamId, eventId, teamName, teamData, modal, isMyTeam]);

  const handleDownloadImage = async () => {
    // ... logica di download invariata
  };

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
        <Text style={styles.bodyText}>Dati del team non disponibili.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <GameHeader
        title={isMyTeam ? "Il Mio Team" : teamData?.name || "Team"}
        styles_override={{
          marginBottom: -20,
          zIndex: 2,
          paddingVertical: theme.spacing.md,
          backgroundColor: theme.colors.backgroundEnd,
        }}
      />
      <ScrollView>
        <View style={styles.teamHeaderContainer}>
          {teamData.photoUrl ? (
            <>
              <Image
                source={{ uri: teamData.photoUrl }}
                style={styles.teamHeaderImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleDownloadImage}
              >
                <Icon
                  name="download-cloud"
                  size={24}
                  color={theme.colors.textPrimary}
                />
              </TouchableOpacity>
            </>
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

        <View style={[styles.teamContentContainer, { marginBottom: 120 }]}>
          <View style={styles.teamNameContainer}>
            {isEditingName ? (
              <TextInput
                ref={textInputRef}
                style={styles.teamNameInput}
                value={teamName}
                onChangeText={setTeamName}
                onBlur={handleSaveTeamName}
                onSubmitEditing={handleSaveTeamName}
                maxLength={22}
                autoFocus={true}
              />
            ) : (
              <Text style={styles.teamNameInput}>
                {teamName || "Nome Team"}
              </Text>
            )}

            {isMyTeam && (
              <TouchableOpacity
                style={styles.teamNameEditIcon}
                onPress={() =>
                  isEditingName ? handleSaveTeamName() : setIsEditingName(true)
                }
              >
                <Icon
                  name={isEditingName ? "check" : "edit-2"}
                  size={18}
                  color={
                    isEditingName
                      ? theme.colors.success
                      : theme.colors.textSecondary
                  }
                />
              </TouchableOpacity>
            )}
          </View>

          {isMyTeam && (
            <Text
              style={[
                styles.teamNameCharCount,
                teamName.length > 22 && styles.teamNameCharCountError,
              ]}
            >
              {teamName.length}/22 caratteri
            </Text>
          )}

          <Text style={styles.sectionTitleWithSpacing}>Membri</Text>
          <FlatList
            data={members}
            renderItem={({ item, index }) => (
              <TeamMemberItem item={item} index={index} />
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default TeamScreen;
