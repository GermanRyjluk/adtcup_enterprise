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
  const [countdown, setCountdown] = useState("");

  const scrollY = useRef(new Animated.Value(0)).current;

  // Usa il valore dall'evento o un default di 50 metri
  const distanceThreshold = eventData?.distanceThreshold || 50;

  useEffect(() => {
    const initialize = async () => {
      if (!authContext?.user) return;
      setLoading(true);

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
        const [eventDetails, userProfile] = await Promise.all([
          getEventDetails(eventId),
          getUserProfile(authContext.user.uid),
        ]);

        setEventData(eventDetails);

        if (userProfile?.teamId && eventDetails) {
          const teamDetails = await getTeamDetails(
            eventId,
            userProfile.teamId.toString()
          );
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

  useEffect(() => {
    if (!teamStartLocation) return;

    const startWatchingLocation = async () => {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 5,
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
          const newDistance = getHaversineDistance(userCoords, startCoords);
          setDistance(newDistance);
        }
      );
      return () => subscription.remove();
    };

    startWatchingLocation();
  }, [teamStartLocation]);

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

  const handleMeetingPointPress = () => {
    if (teamStartLocation) {
      const { latitude, longitude } = teamStartLocation;
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url);
    } else {
      modal?.showModal({
        type: "info",
        title: "Punto di Partenza Squadra",
        message:
          "Il punto di partenza specifico per la tua squadra sarà visibile qui poco prima dell'inizio dell'evento.\n\nNel frattempo, puoi aprire il punto di ritrovo generale dell'evento.",
        actions: [
          {
            text: "Apri Mappa Generale",
            onPress: () => {
              if (eventData?.meetingPointUrl) {
                Linking.openURL(eventData.meetingPointUrl);
              }
              modal.hideModal();
            },
            style: "default",
          },
        ],
      });
    }
  };

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

  // Usa la variabile dinamica `distanceThreshold`
  const isButtonDisabled =
    distance === null ||
    !eventData?.isStarted ||
    (distance !== null && distance > distanceThreshold);

  const getButtonSubtitle = () => {
    if (!eventData?.isStarted) return countdown;
    if (distance === null) return "Calcolo posizione in corso...";
    // Usa la variabile dinamica `distanceThreshold`
    if (distance > distanceThreshold)
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

      <View style={styles.detailsHeaderButtons}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.detailsHeaderButton}
        >
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={{ height: HEADER_HEIGHT }} />

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
          <TouchableOpacity onPress={handleMeetingPointPress}>
            <Image
              source={{ uri: eventData.mapImageUrl }}
              style={styles.detailsMap}
            />
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

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
            threshold={distanceThreshold} // Usa la variabile dinamica
          />
        </LinearGradient>
      </View>
    </View>
  );
};

export default EventDetailsScreen;
