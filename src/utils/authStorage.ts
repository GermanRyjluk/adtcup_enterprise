import AsyncStorage from "@react-native-async-storage/async-storage";

// Usiamo una chiave costante per evitare errori di battitura
const USER_TOKEN_KEY = "user_token";

/**
 * Salva il token dell'utente nella memoria persistente del dispositivo.
 * @param token Il token da salvare.
 */
export const saveUserToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to save user token to storage", error);
  }
};

/**
 * Carica il token dell'utente dalla memoria persistente.
 * @returns Il token salvato, o null se non esiste.
 */
export const loadUserToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(USER_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to load user token from storage", error);
    return null;
  }
};

/**
 * Rimuove il token dell'utente dalla memoria persistente (al logout).
 */
export const removeUserToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to remove user token from storage", error);
  }
};
