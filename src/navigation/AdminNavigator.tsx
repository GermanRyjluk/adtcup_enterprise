import { Feather as Icon } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";

// Importa le schermate admin che andremo a creare
import AdminDashboardScreen from "../screens/Admin/AdminDashboardScreen";
import AdminEventSettingsScreen from "../screens/Admin/AdminEventSettingsScreen";
import AdminLeaderboardScreen from "../screens/Admin/AdminLeaderboardScreen";
import AdminRiddlesScreen from "../screens/Admin/AdminRiddlesScreen";
import AdminTeamsScreen from "../screens/Admin/AdminTeamsScreen";

import QuizLeaderboardScreen from "../screens/Admin/QuizLeaderboardScreen";
import ProfileScreen from "../screens/PreGame/ProfileScreen";
import { styles } from "../styles/styles";
import { theme } from "../theme/theme";
import { AdminStackParamList, AdminTabParamList } from "./types";

const AdminStackNav = createStackNavigator<AdminStackParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();

// --- Componente Helper per le Icone della Tab Bar ---
const AdminTabBarIcon: React.FC<{
  routeName: keyof AdminTabParamList;
  color: string;
  size: number;
}> = ({ routeName, color, size }) => {
  const icons: {
    [key in keyof AdminTabParamList]?: keyof typeof Icon.glyphMap;
  } = {
    AdminDashboard: "activity",
    AdminTeams: "users",
    AdminRiddles: "edit-3",
    AdminLeaderboard: "bar-chart-2",
    AdminEventSettings: "settings",
  };
  const iconName = icons[routeName] || "alert-circle";
  return <Icon name={iconName} size={size} color={color} />;
};

// --- Navigatore a Schede per l'Admin ---
const AdminTabs = () => (
  <AdminTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: styles.tabBar,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      tabBarActiveTintColor: theme.colors.accentPrimary,
      tabBarIcon: ({ color, size }) => (
        <AdminTabBarIcon routeName={route.name} color={color} size={size} />
      ),
    })}
  >
    <AdminTab.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <AdminTab.Screen name="AdminTeams" component={AdminTeamsScreen} />
    <AdminTab.Screen name="AdminRiddles" component={AdminRiddlesScreen} />
    <AdminTab.Screen
      name="AdminLeaderboard"
      component={AdminLeaderboardScreen}
    />
    <AdminTab.Screen
      name="AdminEventSettings"
      component={AdminEventSettingsScreen}
    />
  </AdminTab.Navigator>
);

// --- Stack Principale Admin (che contiene le tabs) ---
// Questo permette di avere modali o altre schermate sopra la tab bar
export const AdminStack = () => (
  <AdminStackNav.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: "transparent" },
    }}
  >
    <AdminStackNav.Screen name="AdminTabs" component={AdminTabs} />
    <AdminStackNav.Screen name="Profile" component={ProfileScreen} />
    <AdminStackNav.Screen
      name="QuizLeaderboard"
      component={QuizLeaderboardScreen}
      options={{ headerShown: false }} // Usiamo l'header custom
    />
    {/* Esempio di come aggiungere una schermata di modifica in futuro */}
    {/* <AdminStackNav.Screen name="EditTeam" component={EditTeamScreen} options={{ presentation: "modal" }} /> */}
  </AdminStackNav.Navigator>
);
