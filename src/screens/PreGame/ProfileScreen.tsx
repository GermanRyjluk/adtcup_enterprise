import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { signOut, deleteUser } from "firebase/auth";
import { doc, deleteDoc, DocumentData } from "firebase/firestore";

// --- Importazioni Locali ---
import { auth, db } from "../../config/firebaseConfig";
import { AuthContext } from "../../contexts/AuthContext";
import { ModalContext } from "../../contexts/ModalContext";
import { PreGameNavigationProps } from "../../navigation/types";
import { getUserProfile } from "../../api/userService";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";
import { useFadeIn } from "../../hooks/animationHooks";
import { PrimaryButton } from "../../components/PrimaryButton";

type ProfileScreenProps = PreGameNavigationProps<"Profile">;

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const modal = useContext(ModalContext);
  const [userProfile, setUserProfile] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    "logout" | "delete" | null
  >(null);

  const fadeInAnim = useFadeIn();

  useEffect(() => {
    const fetchProfile = async () => {
      if (authContext?.user) {
        setLoading(true);
        const profile = await getUserProfile(authContext.user.uid);
        setUserProfile(profile);
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authContext?.user]);

  const handleSignOut = useCallback(async () => {
    setActionLoading("logout");
    try {
      await signOut(auth);
      // Il listener onAuthStateChanged in App.tsx gestirà la navigazione
    } catch (error) {
      console.error("Errore durante il logout:", error);
      modal?.showModal({
        type: "error",
        title: "Errore",
        message: "Impossibile effettuare il logout. Riprova.",
      });
    } finally {
      setActionLoading(null);
    }
  }, [modal]);

  const handleDeleteAccount = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Mostra un dialogo di conferma prima di procedere
    Alert.alert(
      "Conferma Cancellazione",
      "Sei sicuro di voler cancellare il tuo account? Questa azione è irreversibile.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Cancella",
          style: "destructive",
          onPress: async () => {
            setActionLoading("delete");
            try {
              // 1. Cancella il documento utente da Firestore
              const userDocRef = doc(db, "users", currentUser.uid);
              await deleteDoc(userDocRef);

              // 2. Cancella l'utente da Firebase Authentication
              await deleteUser(currentUser);

              modal?.showModal({
                type: "success",
                title: "Successo",
                message: "Il tuo account è stato cancellato.",
              });
              // Il listener onAuthStateChanged gestirà la navigazione
            } catch (error: any) {
              console.error(
                "Errore durante la cancellazione dell'account:",
                error
              );
              // Firebase richiede un login recente per operazioni sensibili
              const message =
                error.code === "auth/requires-recent-login"
                  ? "Questa operazione è sensibile e richiede un accesso recente. Effettua nuovamente il login e riprova."
                  : "Impossibile cancellare l'account. Riprova.";

              modal?.showModal({ type: "error", title: "Errore", message });
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [modal]);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.centeredContainer}>
        <Icon name="alert-circle" size={60} color={theme.colors.error} />
        <Text
          style={[
            styles.authTitle,
            { fontSize: 24, marginTop: theme.spacing.md },
          ]}
        >
          Errore Profilo
        </Text>
        <Text style={styles.bodyText}>
          Impossibile caricare i dati del tuo profilo. Potrebbe essere un
          problema di rete o il tuo profilo non è stato creato correttamente.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: theme.spacing.lg }}
        >
          <Text style={styles.linkText}>Torna indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.centeredContainer}>
      <Animated.View
        style={[styles.authContent, { alignItems: "center" }, fadeInAnim]}
      >
        <Icon name="user" size={80} color={theme.colors.accentPrimary} />
        <Text style={[styles.authTitle, { marginTop: theme.spacing.lg }]}>
          {userProfile?.username || "Profilo"}
        </Text>
        <Text style={styles.bodyText}>{authContext?.user?.email}</Text>

        <PrimaryButton
          title="Logout"
          onPress={handleSignOut}
          loading={actionLoading === "logout"}
          style={{ width: "100%", marginTop: theme.spacing.xl }}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          disabled={!!actionLoading}
        >
          {actionLoading === "delete" ? (
            <ActivityIndicator color={theme.colors.error} />
          ) : (
            <Text style={styles.deleteButtonText}>Cancella Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: theme.spacing.md }}
        >
          <Text style={{ color: theme.colors.textSecondary }}>Indietro</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default ProfileScreen;
