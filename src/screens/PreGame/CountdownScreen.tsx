// src/screens/PreGame/CountdownScreen.tsx
import { Feather as Icon } from "@expo/vector-icons";
import { DocumentData } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Importazioni Locali ---
import { getUpcomingEvent } from "../../api/eventService";
import { getUserProfile } from "../../api/userService";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthContext } from "../../contexts/AuthContext";
import { useFadeIn } from "../../hooks/animationHooks";
import { PreGameNavigationProps } from "../../navigation/types";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";

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

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  const helpfulTips = event?.data?.helpfulTips || [];

  return (
    <ScrollView contentContainerStyle={styles.countdownContentContainer}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoTextPart}>ADT</Text>
          <Image
            source={require("../../../assets/images/icon.png")}
            style={styles.logoIcon}
          />
          <Text style={styles.logoTextPart}>CUP</Text>
        </View>
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

      {event ? (
        <Animated.View style={fadeInAnim}>
          <View style={styles.countdownInfoCard}>
            <Text style={styles.countdownCardText}>Il prossimo evento</Text>
            <Text
              style={styles.countdownCardEventName}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
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
              style={{ alignSelf: "center", marginTop: theme.spacing.md }}
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

      {helpfulTips.length > 0 && (
        <View
          style={{
            marginTop: theme.spacing.xl,
            paddingHorizontal: theme.spacing.lg,
          }}
        >
          <Text style={styles.sectionTitle}>Consigli Utili</Text>
          <FlatList
            data={helpfulTips}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingTop: theme.spacing.md,
            }}
            renderItem={({ item, index }) => (
              <TipCard item={item} index={index} />
            )}
          />
        </View>
      )}
    </ScrollView>
  );
};

export default CountdownScreen;
