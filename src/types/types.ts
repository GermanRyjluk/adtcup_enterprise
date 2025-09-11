import type { StackScreenProps } from "@react-navigation/stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";

/**
 * @file types.ts
 * Questo file centralizza tutte le definizioni di tipo per React Navigation,
 * garantendo la sicurezza dei tipi in tutta l'applicazione.
 */

// --- Tipi per i Parametri delle Route ---

export type AuthStackParamList = {
  Login: undefined;
  VerifyEmail: undefined;
};

export type PreGameStackParamList = {
  Countdown: undefined;
  EventDetails: { eventId: string };
  Profile: undefined;
};

export type GameTabParamList = {
  GameTab: undefined;
  TeamTab: undefined;
  Scanner: undefined;
  LeaderboardTab: undefined;
  ManualTab: undefined;
};

export type MainStackParamList = {
  GameTabs: { screen: keyof GameTabParamList };
  ScannerModal: undefined;
  Clues: { riddleId: string };
};

// --- Tipi per le Props delle Schermate ---

export type AuthNavigationProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

export type PreGameNavigationProps<T extends keyof PreGameStackParamList> =
  StackScreenProps<PreGameStackParamList, T>;

export type MainStackNavigationProps<T extends keyof MainStackParamList> =
  StackScreenProps<MainStackParamList, T>;

export type GameTabScreenProps<T extends keyof GameTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<GameTabParamList, T>,
    StackScreenProps<MainStackParamList>
  >;
