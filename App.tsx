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

const Stack = createStackNavigator();

// --- Componente Principale App ---
export default function App() {
  // Stato unificato per gestire l'autenticazione
  const [authState, setAuthState] = useState<{
    isLoading: boolean;
    user: User | null;
    isProfileComplete: boolean;
    isGameStarted: boolean;
  }>({
    isLoading: true,
    user: null,
    isProfileComplete: false,
    isGameStarted: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // --- UTENTE LOGGATO ---
        // Controlliamo se il profilo utente esiste nel nostro database Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // Il profilo è completo, l'utente può accedere all'app
          setAuthState({
            user: firebaseUser,
            isProfileComplete: true,
            isLoading: false,
            isGameStarted: false,
          });
        } else {
          // L'utente è autenticato ma non ha un profilo nel database.
          // Deve completare la registrazione.
          setAuthState({
            user: firebaseUser,
            isProfileComplete: false,
            isLoading: false,
            isGameStarted: false,
          });
        }
      } else {
        // --- UTENTE NON LOGGATO ---
        // Resettiamo lo stato
        setAuthState({
          user: null,
          isProfileComplete: false,
          isLoading: false,
          isGameStarted: false,
        });
      }
    });

    // Ritorna la funzione di cleanup per annullare l'iscrizione al listener
    return () => unsubscribe();
  }, []);

  // Creiamo il valore per il contesto, ottimizzato con useMemo
  const authContextValue = useMemo(
    () => ({
      user: authState.user,
      isProfileComplete: authState.isProfileComplete,
      // Aggiungiamo le funzioni per modificare lo stato globale
      startGame: () =>
        setAuthState((prev) => ({ ...prev, isGameStarted: true })),
      completeProfile: () =>
        setAuthState((prev) => ({ ...prev, isProfileComplete: true })),
    }),
    [authState.user, authState.isProfileComplete]
  );

  // Mostra una schermata di avvio durante il controllo iniziale
  if (authState.isLoading) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.colors.backgroundStart },
        ]}
      >
        <Text style={styles.logoText}>ADT CUP</Text>
      </View>
    );
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
            <NavigationContainer>{renderContent()}</NavigationContainer>
          </ModalProvider>
        </AuthContext.Provider>
      </SafeAreaView>
    </LinearGradient>
  );
}
