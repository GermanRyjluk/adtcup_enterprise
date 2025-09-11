import Constants from "expo-constants";

/**
 * @file environment.ts
 * Fornisce delle utility per controllare l'ambiente di esecuzione dell'app.
 */

/**
 * Determina se l'app sta girando all'interno dell'ambiente standard di Expo Go.
 *
 * @returns {boolean} True se l'app è in esecuzione su Expo Go, altrimenti false.
 */
export const isExpoGo = Constants.appOwnership === "expo";
