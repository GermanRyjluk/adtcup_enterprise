import React from "react";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import {
  createBottomTabNavigator,
  BottomTabBarButtonProps,
} from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity } from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// --- Importazione Tipi di Navigazione ---
import {
  AuthStackParamList,
  PreGameStackParamList,
  MainStackParamList,
  GameTabParamList,
} from "./types";

// --- Importazione Schermate ---
// Auth
import LoginScreen from "../screens/Auth/LoginScreen";
import RestorePasswordScreen from "../screens/Auth/RestorePasswordScreen";

// PreGame
import CountdownScreen from "../screens/PreGame/CountdownScreen";
import EventDetailsScreen from "../screens/PreGame/EventDetailsScreen";
import ProfileScreen from "../screens/PreGame/ProfileScreen";

// Game
import GameScreen from "../screens/Game/GameScreen";
import TeamScreen from "../screens/Game/TeamScreen";
import LeaderboardScreen from "../screens/Game/LeaderboardScreen";
import ManualScreen from "../screens/Game/ManualScreen";
import ScannerModal from "../screens/Game/ScannerModal";
import CluesScreen from "../screens/Game/CluesScreen"; // Da creare

// --- Importazioni Componenti e Tema ---
import { theme } from "../theme/theme";
import { styles } from "../styles/styles";

// --- Navigatori ---
const AuthStackNav = createStackNavigator<AuthStackParamList>();
const PreGameStackNav = createStackNavigator<PreGameStackParamList>();
const MainStackNav = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<GameTabParamList>();

// 1. STACK DI AUTENTICAZIONE
// ==========================
export const AuthStack = () => (
  <AuthStackNav.Navigator
    initialRouteName="Login"
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
      cardStyle: { backgroundColor: "transparent" },
    }}
  >
    <AuthStackNav.Screen name="Login" component={LoginScreen} />
    <AuthStackNav.Screen
      name="RestorePassword"
      component={RestorePasswordScreen}
    />
  </AuthStackNav.Navigator>
);

// 2. STACK PRE-PARTITA
// =====================
export const PreGameStack = () => (
  <PreGameStackNav.Navigator
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      cardStyle: { backgroundColor: "transparent" },
    }}
  >
    <PreGameStackNav.Screen name="Countdown" component={CountdownScreen} />
    <PreGameStackNav.Screen
      name="EventDetails"
      component={EventDetailsScreen}
    />
    <PreGameStackNav.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ presentation: "modal" }}
    />
  </PreGameStackNav.Navigator>
);

// 3. NAVIGAZIONE PRINCIPALE DEL GIOCO (CON TAB BAR)
// ================================================

// --- Componenti Helper per la Tab Bar ---

const TabBarIcon: React.FC<{
  routeName: keyof GameTabParamList;
  focused: boolean;
  color: string;
  size: number;
}> = ({ routeName, color, size }) => {
  const icons: {
    [key in keyof GameTabParamList]?: keyof typeof Icon.glyphMap;
  } = {
    GameTab: "award",
    TeamTab: "users",
    LeaderboardTab: "bar-chart-2",
    ManualTab: "book-open",
  };

  const iconName = icons[routeName] || "alert-circle";

  return <Icon name={iconName} size={size} color={color} />;
};

const CustomTabBarButton: React.FC<BottomTabBarButtonProps> = ({ onPress }) => (
  <TouchableOpacity
    style={{ top: -40, justifyContent: "center", alignItems: "center" }}
    onPress={onPress}
  >
    <LinearGradient
      colors={[theme.colors.accentPrimary, "#FFB300"]}
      style={styles.scannerTabButton}
    >
      <Icon name="grid" size={40} color="#000" />
    </LinearGradient>
  </TouchableOpacity>
);

// --- Navigatore a Schede ---
const GameTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      // tabBarShowLabel: false,
      tabBarStyle: styles.tabBar,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      tabBarActiveTintColor: theme.colors.accentPrimary,
      tabBarIcon: ({ focused, color, size }) => (
        <TabBarIcon
          routeName={route.name}
          focused={focused}
          color={color}
          size={size}
        />
      ),
    })}
  >
    <Tab.Screen name="GameTab" component={GameScreen} />
    <Tab.Screen name="TeamTab" component={TeamScreen} />
    <Tab.Screen
      name="Scanner"
      component={() => <View />} // Componente vuoto
      options={{
        tabBarButton: (props) => <CustomTabBarButton {...props} />,
      }}
    />
    <Tab.Screen name="LeaderboardTab" component={LeaderboardScreen} />
    <Tab.Screen name="ManualTab" component={ManualScreen} />
  </Tab.Navigator>
);

// 4. STACK PRINCIPALE (GIOCO)
// ===========================
export const MainStack = () => (
  <MainStackNav.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: "transparent" },
    }}
  >
    <MainStackNav.Screen name="GameTabs" component={GameTabs} />
    <MainStackNav.Screen
      name="ScannerModal"
      component={ScannerModal}
      options={{
        presentation: "modal",
        cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        cardStyle: { backgroundColor: "transparent" },
      }}
    />
    <MainStackNav.Screen
      name="Clues"
      component={CluesScreen}
      options={{
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    />
  </MainStackNav.Navigator>
);
