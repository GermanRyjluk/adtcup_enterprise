import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Animated,
  Platform,
  Dimensions, // Importiamo Dimensions
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { DocumentData } from "firebase/firestore";

// --- Importazioni Locali ---
import { AuthContext } from "../../contexts/AuthContext";
import { PreGameNavigationProps } from "../../navigation/types";
import { getEventDetails } from "../../api/eventService";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";
import { PrimaryButton } from "../../components/PrimaryButton";

type EventDetailsScreenProps = PreGameNavigationProps<"EventDetails">;

const EventDetailsScreen: React.FC<EventDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const HEADER_HEIGHT = Dimensions.get("window").height * 0.3;

  const eventId = route.params?.eventId ?? "default-event-id";
  const authContext = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<DocumentData | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;

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

          <Text style={styles.detailsSectionTitle}>Punto di Partenza</Text>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                eventData.startPointUrl || "https://maps.google.com"
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
            onPress={authContext?.startGame ?? (() => {})}
            disabled={!eventData.eventStarted}
            style={styles.footerButton}
            subtitle="asdasd"
          />
        </LinearGradient>
      </View>
    </View>
  );
};

export default EventDetailsScreen;
