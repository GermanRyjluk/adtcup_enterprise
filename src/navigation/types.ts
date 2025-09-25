import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import type { StackScreenProps } from "@react-navigation/stack";

/**
 * @file types.ts
 * Questo file centralizza tutte le definizioni di tipo per React Navigation,
 * garantendo la sicurezza dei tipi in tutta l'applicazione.
 */

// --- Tipi per i Parametri delle Route ---
// Qui definiamo quali parametri ogni schermata può ricevere.
// `undefined` significa che la schermata non riceve parametri.

export type AuthStackParamList = {
  Login: undefined;
  VerifyEmail: undefined;
  RestorePassword: undefined;
  CompleteProfile: undefined;
};

export type PreGameStackParamList = {
  Countdown: undefined;
  EventDetails: { eventId: string }; // Esempio: passiamo l'ID dell'evento
  Profile: undefined;
};

export type GameTabParamList = {
  GameTab: undefined;
  TeamTab: undefined;
  Scanner: undefined; // Schermata segnaposto per il pulsante
  LeaderboardTab: undefined;
  ManualTab: undefined;
};

// Questo unisce tutti i parametri degli stack principali.
// Utile per i tipi compositi.
export type MainStackParamList = {
  GameTabs: { screen: keyof GameTabParamList }; // Permette di navigare a una tab specifica
  ScannerModal: undefined;
  Clues: { riddleId: string }; // Passiamo l'ID dell'indovinello corrente
  TeamDetail: { teamId: string };
  Profile: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  AdminTeams: undefined;
  AdminRiddles: undefined;
  AdminLeaderboard: undefined;
  AdminEventSettings: undefined;
};

export type AdminStackParamList = {
  AdminTabs: NavigatorScreenParams<AdminTabParamList>;
  Profile: undefined;
  QuizLeaderboard: { riddleId: string; riddleTitle: string };
};

// --- Tipi per le Props delle Schermate ---
// Questi tipi combinano le definizioni sopra con i tipi di React Navigation
// per fornire `navigation` e `route` props completamente tipizzate.

// Props per le schermate dello Stack di Autenticazione
export type AuthNavigationProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

// Props per le schermate dello Stack Pre-Partita
export type PreGameNavigationProps<T extends keyof PreGameStackParamList> =
  StackScreenProps<PreGameStackParamList, T>;

// Props per le schermate dello Stack Principale del Gioco
export type MainStackNavigationProps<T extends keyof MainStackParamList> =
  StackScreenProps<MainStackParamList, T>;

// Tipo composito per le schermate all'interno del Tab Navigator
// Questo dice a TypeScript che una schermata della tab bar
// fa anche parte dello stack principale.
export type GameTabScreenProps<T extends keyof GameTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<GameTabParamList, T>,
    StackScreenProps<MainStackParamList>
  >;

export type AdminStackNavigationProps<T extends keyof AdminStackParamList> =
  StackScreenProps<AdminStackParamList, T>;

export type AdminTabScreenProps<T extends keyof AdminTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<AdminTabParamList, T>,
    StackScreenProps<AdminStackParamList>
  >;

export type QuizLeaderboardScreenProps = StackScreenProps<
  AdminStackParamList,
  "QuizLeaderboard"
>;
