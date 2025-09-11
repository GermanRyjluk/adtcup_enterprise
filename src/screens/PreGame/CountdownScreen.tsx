import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { DocumentData } from "firebase/firestore";

// --- Importazioni Locali ---
import { AuthContext } from "../../contexts/AuthContext";
import { PreGameNavigationProps } from "../../navigation/types";
import { getUserProfile } from "../../api/userService";
import { getUpcomingEvent } from "../../api/eventService";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";
import { useFadeIn } from "../../hooks/animationHooks";
import { PrimaryButton } from "../../components/PrimaryButton";

// --- Componenti Ausiliari ---
const TipCard: React.FC<{ item: any; index: number }> = ({ item, index }) => {
  const anim = useFadeIn(500, index * 150);
  return (
    <Animated.View style={[styles.tipCard, anim]}>
      <Icon name={item.icon} size={24} color={theme.colors.accentPrimary} />
      <Text style={styles.tipCardText}>{item.description}</Text>
    </Animated.View>
  );
};

// --- Schermata Principale ---
type CountdownScreenProps = PreGameNavigationProps<"Countdown">;

const CountdownScreen: React.FC<CountdownScreenProps> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState<DocumentData | null>(null);
  const [event, setEvent] = useState<{ id: string; data: DocumentData } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const fadeInAnim = useFadeIn();

  useEffect(() => {
    const fetchEventData = async () => {
      if (!authContext?.user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const profile = await getUserProfile(authContext.user.uid);
        setUserProfile(profile);
        const upcomingEvent = await getUpcomingEvent();
        setEvent(upcomingEvent);
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [authContext?.user]);

  useEffect(() => {
    if (!event?.data.startTime) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    const targetDate = event.data.startTime.toDate();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      if (distance < 0) {
        clearInterval(interval);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const mockManualCards = [
    {
      id: "1",
      icon: "battery-charging",
      title: "Batteria",
      description:
        "Ricorda di avere il batteria sufficiente prima dell'inizio dell'evento",
    },
    {
      id: "2",
      icon: "alert-triangle",
      title: "Collabora",
      description: "Indossa vestiti e scarpe comode.",
    },
    {
      id: "3",
      icon: "grid",
      title: "Scansiona",
      description: "Trova i QR code per avanzare nel gioco.",
    },
    {
      id: "4",
      icon: "help-circle",
      title: "Usa gli Indizi",
      description: "Se sei bloccato, aspetta l'arrivo di un indizio!",
    },
  ];

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  return (
    // CORREZIONE: Usiamo un View con flex: 1 invece di ScrollView per un layout controllato
    <View style={styles.countdownContentContainer}>
      {/* --- Sezione Superiore --- */}
      <View>
        <View style={styles.header}>
          <Text style={styles.logoTextSmall}>ADT CUP</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <Icon name="user" size={28} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Animated.View style={[fadeInAnim, styles.welcomeContainer]}>
          <Text style={styles.countdownWelcome}>Ciao,</Text>
          <Text style={styles.countdownWelcomeUser}>
            {userProfile?.username || "Giocatore"}!
          </Text>
        </Animated.View>
      </View>

      {/* --- Sezione Centrale (si espande per riempire lo spazio) --- */}
      <View style={{ flex: 1, justifyContent: "center" }}>
        {event ? (
          <Animated.View style={fadeInAnim}>
            <View style={styles.countdownInfoCard}>
              <Text style={styles.countdownCardText}>Il prossimo evento</Text>
              <Text style={styles.countdownCardEventName}>
                {event.data.name}
              </Text>
              <Text style={styles.countdownCardText}>inizia tra:</Text>
              <View
                style={[
                  styles.countdownTimerContainer,
                  { marginVertical: theme.spacing.md, alignSelf: "center" },
                ]}
              >
                {Object.entries(countdown).map(([unit, value]) => (
                  <View key={unit} style={styles.countdownTimerBlock}>
                    <Text style={styles.countdownTimerValue}>
                      {String(value).padStart(2, "0")}
                    </Text>
                    <Text style={styles.countdownTimerUnit}>{unit}</Text>
                  </View>
                ))}
              </View>
              <PrimaryButton
                title="Dettagli Evento"
                onPress={() =>
                  navigation.navigate("EventDetails", { eventId: event.id })
                }
                icon="arrow-right"
                style={{ alignSelf: "center", marginTop: theme.spacing.xl }}
              />
            </View>
          </Animated.View>
        ) : (
          <View style={styles.centeredContainer}>
            <Text style={styles.countdownTitle}>
              Nessun evento in programma al momento.
            </Text>
            <Text style={styles.bodyText}>
              Torna a trovarci presto per nuove avventure!
            </Text>
          </View>
        )}
      </View>

      {/* --- Sezione Inferiore --- */}
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={styles.sectionTitle}>Consigli Utili</Text>
        <FlatList
          data={mockManualCards}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.md,
            paddingTop: theme.spacing.md,
          }}
          renderItem={({ item, index }) => (
            <TipCard item={item} index={index} />
          )}
        />
      </View>
    </View>
  );
};

export default CountdownScreen;
