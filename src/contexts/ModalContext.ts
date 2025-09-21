import { createContext } from "react";

/**
 * @interface ModalOptions
 * Definisce i parametri che si possono passare alla funzione showModal.
 */
export interface ModalOptions {
  title: string;
  message: string;
  type: "success" | "error" | "info" | "confirmation";
  persistent?: boolean;
  actions?: {
    text: string;
    style?: "default" | "destructive";
    onPress: () => void;
  }[];
}

/**
 * @interface ModalContextType
 * Definisce la "forma" del nostro ModalContext.
 * L'unica cosa che espone è una funzione per mostrare il modale.
 */
export interface ModalContextType {
  /**
   * Funzione per mostrare un modale a schermo intero.
   * @param options - Un oggetto contenente titolo, messaggio e tipo del modale.
   */
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

/**
 * Creazione del Context per la gestione dei modali.
 * Lo inizializziamo con `null`. Il valore reale verrà fornito dal
 * ModalProvider nel file App.tsx (o in un file provider dedicato).
 */
export const ModalContext = createContext<ModalContextType | null>(null);
