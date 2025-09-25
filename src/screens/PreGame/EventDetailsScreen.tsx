import { Feather as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { DocumentData, GeoPoint, Timestamp } from "firebase/firestore";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Importazioni Locali ---
import { getUserProfile } from "@/src/api/userService";
import { DistanceIndicator } from "@/src/components/DistanceIndicator";
import { ModalContext } from "@/src/contexts/ModalContext";
import { getHaversineDistance } from "@/src/utils/locationHelper";
import { getEventDetails, getTeamDetails } from "../../api/eventService";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthContext } from "../../contexts/AuthContext";
import { PreGameNavigationProps } from "../../navigation/types";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";

type EventDetailsScreenProps = PreGameNavigationProps<"EventDetails">;

const DISTANCE_THRESHOLD = 35;

const EventDetailsScreen: React.FC<EventDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const HEADER_HEIGHT = Dimensions.get("window").height * 0.3;
  const eventId = route.params?.eventId ?? "default-event-id";
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<DocumentData | null>(null);
  const [teamStartLocation, setTeamStartLocation] = useState<GeoPoint | null>(
    null
  );
  const [distance, setDistance] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(""); // Stato per il countdown

  const scrollY = useRef(new Animated.Value(0)).current;

  // 1. Gestione Permessi e Dati Iniziali
  useEffect(() => {
    const initialize = async () => {
      if (!authContext?.user) return;
      setLoading(true);

      // Chiedi i permessi di localizzazione
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        const detailedMessage =
          "Per partecipare, l'app ha bisogno di sapere dove sei.\n\n" +
          "Sembra che i permessi siano bloccati. Per abilitarli, segui questi passaggi:\n\n" +
          (Platform.OS === "ios"
            ? '1. Apri le Impostazioni\n2. Trova la nostra app "ADT Cup"\n3. "Posizione"\n4. Seleziona "Mentre usi l\'app"'
            : '1. Apri le Impostazioni del tuo telefono\n2. Vai su "App" e poi cerca "ADT Cup"\n3. Tocca "Autorizzazioni" e poi "Posizione"\n4. Seleziona "Consenti solo mentre l\'app è in uso"');

        modal?.showModal({
          type: "error",
          title: "Attiva la Localizzazione",
          message: detailedMessage,
          persistent: true,
        });
        setLoading(false);
        return;
      }

      try {
        // Carica in parallelo i dati dell'evento e del profilo utente
        const [eventDetails, userProfile] = await Promise.all([
          getEventDetails(eventId),
          getUserProfile(authContext.user.uid),
        ]);

        setEventData(eventDetails);

        if (userProfile?.teamId && eventDetails) {
          // Con il teamId, carica i dettagli della squadra per l'evento
          const teamDetails = await getTeamDetails(eventId, userProfile.teamId);
          if (teamDetails?.startLocation) {
            setTeamStartLocation(teamDetails.startLocation);
          }
        }
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [eventId, authContext?.user]);

  // 2. Monitoraggio della posizione e calcolo della distanza
  useEffect(() => {
    if (!teamStartLocation) return;

    const startWatchingLocation = async () => {
      // Inizia a monitorare la posizione dell'utente
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // ogni 2 secondi
          distanceInterval: 5, // ogni 5 metri
        },
        (location) => {
          const userCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          const startCoords = {
            latitude: teamStartLocation.latitude,
            longitude: teamStartLocation.longitude,
          };

          // Calcola e aggiorna la distanza
          const newDistance = getHaversineDistance(userCoords, startCoords);
          setDistance(newDistance);
        }
      );

      // Cleanup: smetti di monitorare quando il componente viene smontato
      return () => subscription.remove();
    };

    startWatchingLocation();
  }, [teamStartLocation]);

  // 3. Countdown Logic
  useEffect(() => {
    if (!eventData?.startTime) return;

    const targetDate = (eventData.startTime as Timestamp).toDate();

    const interval = setInterval(() => {
      const now = new Date();
      const timeDifference = targetDate.getTime() - now.getTime();

      if (timeDifference < 0) {
        clearInterval(interval);
        setCountdown("Evento iniziato!");
        return;
      }

      const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

      setCountdown(`${days}g ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [eventData]);

  useEffect(() => {
    const fetchData = async () => {
      if (!authContext?.user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const eventDetails = await getEventDetails(eventId);
        setEventData(eventDetails);
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId, authContext?.user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "Data non disponibile";
    return timestamp
      .toDate()
      .toLocaleDateString("it-IT", { day: "2-digit", month: "long" });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return "Ora non disponibile";
    return timestamp
      .toDate()
      .toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  const isButtonDisabled =
    distance === null ||
    !eventData?.isStarted ||
    (distance !== null && distance > DISTANCE_THRESHOLD);

  const getButtonSubtitle = () => {
    if (!eventData?.eventStarted) return countdown;
    if (distance === null) return "Calcolo posizione in corso...";
    if (distance > DISTANCE_THRESHOLD)
      return `Sei a ${Math.round(distance)} metri di distanza`;
    return "Sei nel punto giusto, puoi iniziare!";
  };

  const headerImageStyle = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, HEADER_HEIGHT],
          outputRange: [0, -HEADER_HEIGHT / 2],
          extrapolate: "clamp",
        }),
      },
      {
        scale: scrollY.interpolate({
          inputRange: [-HEADER_HEIGHT, 0],
          outputRange: [1.5, 1],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  if (!eventData) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.bodyText}>
          Impossibile caricare i dettagli dell'evento.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {eventData.photo && (
        <Animated.Image
          source={{ uri: eventData.photo }}
          style={[
            styles.detailsHeaderImage,
            { height: HEADER_HEIGHT },
            headerImageStyle,
          ]}
        />
      )}

      {/* I pulsanti rimangono posizionati in modo assoluto sopra a tutto */}
      <View style={styles.detailsHeaderButtons}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.detailsHeaderButton}
        >
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Lo ScrollView ora gestisce correttamente l'evento onScroll */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Questo View agisce come spaziatore per spingere il contenuto sotto l'header */}
        <View style={{ height: HEADER_HEIGHT }} />

        {/* La card del contenuto ora è un semplice View all'interno dello ScrollView */}
        <View
          style={[
            styles.detailsContentCard,
            {
              minHeight:
                Dimensions.get("window").height -
                HEADER_HEIGHT +
                theme.radius.lg,
            },
          ]}
        >
          <Text style={styles.detailsTitle}>{eventData.name}</Text>
          <View style={styles.detailsInfoRow}>
            <View style={styles.detailsInfoItem}>
              <Icon
                name="calendar"
                size={18}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.detailsInfoText}>
                {formatDate(eventData.startTime)}
              </Text>
            </View>
            <View style={styles.detailsInfoItem}>
              <Icon name="clock" size={18} color={theme.colors.textSecondary} />
              <Text style={styles.detailsInfoText}>
                {formatTime(eventData.startTime)}
              </Text>
            </View>
          </View>

          <Text style={styles.detailsSectionTitle}>Descrizione</Text>
          <Text style={[styles.bodyText, { textAlign: "left" }]}>
            {eventData.description}
          </Text>

          <Text style={styles.detailsSectionTitle}>Punto di Ritrovo</Text>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                eventData.meetingPointUrl || "https://maps.google.com"
              )
            }
          >
            <Image
              source={{ uri: eventData.mapImageUrl }}
              style={styles.detailsMap}
            />
          </TouchableOpacity>

          {/* Spazio extra per non sovrapporsi al footer */}
          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* Il footer flottante rimane in posizione assoluta in fondo allo schermo */}
      <View style={styles.floatingFooter}>
        <LinearGradient
          colors={["transparent", theme.colors.backgroundEnd]}
          style={styles.floatingFooterGradient}
        >
          <PrimaryButton
            title="INIZIA"
            subtitle={getButtonSubtitle()}
            onPress={
              authContext?.startGame
                ? () => authContext.startGame(eventId)
                : () => {}
            }
            disabled={isButtonDisabled}
            style={{ width: "90%" }}
          />
          <DistanceIndicator
            distance={distance}
            threshold={DISTANCE_THRESHOLD}
          />
        </LinearGradient>
      </View>
    </View>
  );
};

export default EventDetailsScreen;
