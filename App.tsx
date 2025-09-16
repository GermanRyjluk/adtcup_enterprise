import React, { useState, useEffect, useMemo } from "react";
import { SafeAreaView, StatusBar, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// --- Importazioni Locali ---
import { auth, db } from "./src/config/firebaseConfig";
import { theme, navigationTheme } from "./src/theme/theme";
import { AuthContext } from "./src/contexts/AuthContext";
import { ModalProvider } from "./src/providers/ModalProvider";
import {
  AuthStack,
  PreGameStack,
  MainStack,
} from "./src/navigation/AppNavigator";
import VerifyEmailScreen from "./src/screens/Auth/VerifyEmailScreen";
import { styles } from "./src/styles/styles";
import CompleteProfileScreen from "./src/screens/Auth/CompleteProfileScreen";
import {
  startGameForUser,
  updateUserBookingStatus,
} from "./src/api/userService";

import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

// --- Componente Principale App ---
export default function App() {
  // Stato unificato per gestire l'autenticazione
  const [authState, setAuthState] = useState<{
    isLoading: boolean;
    user: User | null;
    isProfileComplete: boolean;
    isGameStarted: boolean;
    teamId: number;
    currentEventId: string | null;
  }>({
    isLoading: true,
    user: null,
    isProfileComplete: false,
    isGameStarted: false,
    teamId: 0,
    currentEventId: null,
  });

  const checkUserStatus = async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setAuthState({
          user: firebaseUser,
          isProfileComplete: true,
          isLoading: false,
          isGameStarted: userData.isGameStarted ?? false,
          teamId: userData.teamId ?? null,
          currentEventId: userData.currentEventId ?? null,
        });
      } else {
        setAuthState({
          user: firebaseUser,
          isProfileComplete: false,
          isLoading: false,
          isGameStarted: false,
          teamId: 0,
          currentEventId: null,
        });
      }
    } else {
      setAuthState({
        user: null,
        isProfileComplete: false,
        isLoading: false,
        isGameStarted: false,
        teamId: 0,
        currentEventId: null,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, checkUserStatus);
    return () => unsubscribe();
  }, []);

  // Creiamo il valore per il contesto, ottimizzato con useMemo
  const authContextValue = useMemo(
    () => ({
      user: authState.user,
      isProfileComplete: authState.isProfileComplete,
      teamId: authState.teamId,
      currentEventId: authState.currentEventId,
      startGame: async (eventId: string) => {
        if (authState.user) {
          try {
            // Chiama la funzione che aggiorna entrambi i documenti
            await startGameForUser(authState.user.uid, eventId);

            // Aggiorna lo stato locale per riflettere i cambiamenti e triggerare la navigazione
            setAuthState((prev) => ({
              ...prev,
              isGameStarted: true,
              currentEventId: eventId,
            }));
          } catch (error) {
            console.error("Errore durante l'avvio del gioco:", error);
            // Qui puoi mostrare un errore all'utente con il tuo modal
          }
        }
      },
      completeProfile: () =>
        setAuthState((prev) => ({ ...prev, isProfileComplete: true })),
      refreshAuthState: async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.reload(); // Prima ricarica i dati utente da Firebase
        }
        await checkUserStatus(currentUser); // Poi esegui il nostro controllo completo
      },
    }),

    [authState] // Assicurati che authState sia nelle dipendenze
  );

  // Nascondi la splash screen quando il caricamento è terminato
  useEffect(() => {
    const hideSplashScreen = async () => {
      if (!authState.isLoading) {
        await SplashScreen.hideAsync();
      }
    };
    hideSplashScreen();
  }, [authState.isLoading]);

  // Mostra una schermata di avvio durante il controllo iniziale
  if (authState.isLoading) {
    // return (
    //   <View
    //     style={[
    //       styles.centeredContainer,
    //       { backgroundColor: theme.colors.backgroundStart },
    //     ]}
    //   >
    //     <Text style={styles.logoText}>ADT CUP</Text>
    //   </View>
    // );
    return null;
  }

  // --- Funzione per decidere quale stack di navigazione renderizzare ---
  const renderContent = () => {
    const user = authState.user;

    // 1. Utente non loggato: mostra lo stack di autenticazione.
    if (!user) {
      return <AuthStack />;
    }

    // 2. Utente loggato, ma email non verificata: mostra la schermata di verifica.
    // user.emailVerified è una proprietà di Firebase User che indica lo stato di verifica.
    if (!user.emailVerified) {
      return (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </Stack.Navigator>
      );
    }

    // 3. Utente loggato e email verificata, ma profilo non completo: mostra la schermata di completamento.
    if (!authState.isProfileComplete) {
      return (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen
            name="CompleteProfile"
            component={CompleteProfileScreen}
          />
        </Stack.Navigator>
      );
    }

    // 4. Utente pronto per l'esperienza di gioco.
    if (!authState.isGameStarted) {
      return <PreGameStack />;
    }

    return <MainStack />;
  };

  return (
    <LinearGradient
      colors={[theme.colors.backgroundStart, theme.colors.backgroundEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <AuthContext.Provider value={authContextValue}>
          <ModalProvider>
            <NavigationContainer theme={navigationTheme}>
              {renderContent()}
            </NavigationContainer>
          </ModalProvider>
        </AuthContext.Provider>
      </SafeAreaView>
    </LinearGradient>
  );
}
