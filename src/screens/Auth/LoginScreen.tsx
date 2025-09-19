import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useCallback, useContext, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Importazioni Condizionali ---
// Importiamo il nostro helper per controllare l'ambiente
import { isExpoGo } from "../../utils/environment";

// Dichiariamo le variabili che conterranno i moduli nativi
let GoogleSignin: any;
let AppleAuthentication: any;

// Carichiamo i moduli nativi solo se NON siamo in Expo Go
if (!isExpoGo) {
  try {
    GoogleSignin =
      require("@react-native-google-signin/google-signin").GoogleSignin;
    AppleAuthentication = require("expo-apple-authentication");
  } catch (e) {
    console.warn(
      "Could not load native modules for social login. Are you in Expo Go?",
      e
    );
  }
}

// --- Importazioni Locali ---
import { Image } from "react-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { StyledInput } from "../../components/StyledInput";
import { auth } from "../../config/firebaseConfig";
import { ModalContext } from "../../contexts/ModalContext";
import { useFadeIn } from "../../hooks/animationHooks";
import { AuthNavigationProps } from "../../navigation/types";
import { styles } from "../../styles/styles";
import { theme } from "../../theme/theme";

type LoginScreenProps = AuthNavigationProps<"Login">;

// Configurazione Google eseguita solo se la libreria è stata caricata
if (!isExpoGo && GoogleSignin) {
  GoogleSignin.configure({
    webClientId: "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com", // Sostituisci con il tuo Web Client ID
  });
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const modal = useContext(ModalContext);
  const fadeInAnim = useFadeIn();

  const handleAuthentication = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      modal?.showModal({
        type: "error",
        title: "Campi Vuoti",
        message: "Per favore, inserisci email e password.",
      });
      return;
    }
    setLoading(true);
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        if (userCredential.user) {
          await sendEmailVerification(userCredential.user);
        }
      }
    } catch (error) {
      let title = "Errore";
      let message = "Si è verificato un errore inaspettato. Riprova.";

      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        typeof error.code === "string"
      ) {
        switch (error.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            title = "Credenziali non valide";
            message = "L'email o la password inserite non sono corrette.";
            break;
          case "auth/email-already-in-use":
            title = "Email già in uso";
            message = "Questa email è già associata a un altro account.";
            break;
          case "auth/weak-password":
            title = "Password debole";
            message = "La password deve essere di almeno 6 caratteri.";
            break;
          case "auth/invalid-email":
            title = "Email non valida";
            message = "L'indirizzo email non è formattato correttamente.";
            break;
          default:
            console.error("Errore di autenticazione non gestito:", error.code);
        }
      }
      modal?.showModal({ type: "error", title, message });
    } finally {
      setLoading(false);
    }
  }, [email, password, isLoginView, navigation, modal]);

  // const handleGoogleLogin = useCallback(async () => {
  //   if (isExpoGo || !GoogleSignin) {
  //     modal?.showModal({
  //       type: "info",
  //       title: "Info",
  //       message: "Il login con Google è disponibile solo nell'app installata.",
  //     });
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     await GoogleSignin.hasPlayServices({
  //       showPlayServicesUpdateDialog: true,
  //     });
  //     const { idToken } = await GoogleSignin.signIn();
  //     if (!idToken) throw new Error("Token ID di Google non ricevuto.");
  //     const googleCredential = GoogleAuthProvider.credential(idToken);
  //     await signInWithCredential(auth, googleCredential);
  //   } catch (error: any) {
  //     if (error.code !== "12501") {
  //       console.error("Google Sign-In Error", error);
  //       modal?.showModal({
  //         type: "error",
  //         title: "Errore Google",
  //         message: "Impossibile completare l'accesso con Google.",
  //       });
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [modal]);

  // const handleAppleLogin = useCallback(async () => {
  //   if (isExpoGo || !AppleAuthentication) {
  //     modal?.showModal({
  //       type: "info",
  //       title: "Info",
  //       message: "Il login con Apple è disponibile solo nell'app installata.",
  //     });
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     const appleCredential = await AppleAuthentication.signInAsync({
  //       requestedScopes: [
  //         AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
  //         AppleAuthentication.AppleAuthenticationScope.EMAIL,
  //       ],
  //     });
  //     const { identityToken } = appleCredential;
  //     if (identityToken) {
  //       const provider = new OAuthProvider("apple.com");
  //       const credential = provider.credential({ idToken: identityToken });
  //       await signInWithCredential(auth, credential);
  //     } else {
  //       throw new Error("Nessun identityToken ricevuto da Apple");
  //     }
  //   } catch (error: any) {
  //     if (error.code !== "ERR_REQUEST_CANCELED") {
  //       console.error("Apple Sign-In Error", error);
  //       modal?.showModal({
  //         type: "error",
  //         title: "Errore Apple",
  //         message: "Impossibile completare l'accesso con Apple.",
  //       });
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [modal]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.authContainer}>
        <Animated.View style={[styles.authContent, fadeInAnim]}>
          <View
            style={[styles.logoContainer, { marginBottom: theme.spacing.sm }]}
          >
            <Text
              style={[
                styles.logoTextPart,
                { fontSize: 40, fontFamily: theme.fonts.primary.extraBold },
              ]}
            >
              ADT
            </Text>
            <Image
              source={require("../../../assets/images/icon.png")}
              style={[styles.logoIcon, { width: 100, height: 100 }]}
            />
            <Text
              style={[
                styles.logoTextPart,
                {
                  fontSize: 40,
                  fontFamily: theme.fonts.primary.extraBold,
                },
              ]}
            >
              CUP
            </Text>
          </View>
          <Text style={styles.authTitle}>
            {isLoginView ? "Bentornato!" : "Crea un Account"}
          </Text>

          {/* {!isExpoGo && (
            <>
              <AnimatedPressable
                style={styles.socialButton}
                onPress={handleGoogleLogin}
              >
                <Icon name="mail" size={24} color={theme.colors.textPrimary} />
                <Text style={styles.socialButtonText}>Continua con Google</Text>
              </AnimatedPressable>

              {Platform.OS === "ios" && (
                <AnimatedPressable
                  style={styles.socialButton}
                  onPress={handleAppleLogin}
                >
                  <Icon
                    name="smartphone"
                    size={24}
                    color={theme.colors.textPrimary}
                  />
                  <Text style={styles.socialButtonText}>
                    Continua con Apple
                  </Text>
                </AnimatedPressable>
              )}
            </>
          )} */}

          <Text style={styles.separatorText}>oppure</Text>

          <StyledInput
            icon="mail"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <StyledInput
            icon="lock"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {isLoginView && (
            <TouchableOpacity
              onPress={() => navigation.navigate("RestorePassword")}
            >
              <Text style={styles.linkText}>Password dimenticata?</Text>
            </TouchableOpacity>
          )}

          <PrimaryButton
            title={isLoginView ? "Accedi" : "Registrati"}
            onPress={handleAuthentication}
            loading={loading}
            style={{ marginTop: theme.spacing.lg }}
          />

          <TouchableOpacity
            onPress={() => setIsLoginView(!isLoginView)}
            style={{ marginTop: theme.spacing.lg }}
          >
            <Text style={styles.toggleAuthText}>
              {isLoginView ? "Non hai un account? " : "Hai già un account? "}
              <Text style={{ color: theme.colors.accentPrimary }}>
                {isLoginView ? "Registrati" : "Accedi"}
              </Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
