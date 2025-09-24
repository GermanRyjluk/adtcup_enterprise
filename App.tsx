import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// --- Importazioni Locali ---
import { startGameForUser } from "./src/api/userService";
import { auth, db } from "./src/config/firebaseConfig";
import { AuthContext } from "./src/contexts/AuthContext";
import {
  AdminStack,
  AuthStack,
  MainStack,
  PreGameStack,
} from "./src/navigation/AppNavigator";
import { ModalProvider } from "./src/providers/ModalProvider";
import CompleteProfileScreen from "./src/screens/Auth/CompleteProfileScreen";
import VerifyEmailScreen from "./src/screens/Auth/VerifyEmailScreen";
import { navigationTheme, theme } from "./src/theme/theme";

import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/montserrat";

import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

// --- Componente Principale App ---
export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  const [authState, setAuthState] = useState<{
    isLoading: boolean;
    user: User | null;
    isProfileComplete: boolean;
    isGameStarted: boolean;
    teamId: number;
    currentEventId: string | null;
    role: string | null;
  }>({
    isLoading: true,
    user: null,
    isProfileComplete: false,
    isGameStarted: false,
    teamId: 0,
    currentEventId: null,
    role: null,
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
          role: userData.role || "user",
        });
      } else {
        setAuthState({
          user: firebaseUser,
          isProfileComplete: false,
          isLoading: false,
          isGameStarted: false,
          teamId: 1,
          currentEventId: null,
          role: null,
        });
      }
    } else {
      setAuthState({
        user: null,
        isProfileComplete: false,
        isLoading: false,
        isGameStarted: false,
        teamId: 1,
        currentEventId: null,
        role: null,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, checkUserStatus);
    return () => unsubscribe();
  }, []);

  const authContextValue = useMemo(
    () => ({
      user: authState.user,
      isProfileComplete: authState.isProfileComplete,
      teamId: authState.teamId,
      currentEventId: authState.currentEventId,
      role: authState.role,
      startGame: async (eventId: string) => {
        if (authState.user) {
          try {
            await startGameForUser(
              authState.user.uid,
              eventId,
              authState.teamId
            );
            setAuthState((prev) => ({
              ...prev,
              isGameStarted: true,
              currentEventId: eventId,
            }));
          } catch (error) {
            console.error("Errore durante l'avvio del gioco:", error);
          }
        }
      },
      completeProfile: () =>
        setAuthState((prev) => ({ ...prev, isProfileComplete: true })),
      refreshAuthState: async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.reload();
        }
        await checkUserStatus(currentUser);
      },
    }),
    [authState]
  );

  useEffect(() => {
    const hideSplashScreen = async () => {
      if (!authState.isLoading && fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    };
    hideSplashScreen();
  }, [authState.isLoading, fontsLoaded]);

  if (authState.isLoading || !fontsLoaded) {
    return null;
  }

  const renderContent = () => {
    const user = authState.user;

    if (!user) {
      return <AuthStack />;
    }

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

    if (authContextValue.role === "admin") {
      return <AdminStack />;
    }

    if (!authState.isGameStarted) {
      return <PreGameStack />;
    }

    return <MainStack />;
  };

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
