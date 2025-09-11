import React, { useState, useCallback, useMemo } from "react";
import { ModalContext, ModalOptions } from "../contexts/ModalContext";
import { CustomModal } from "../components/CustomModal";

/**
 * @interface ModalProviderProps
 * Definisce le props per il ModalProvider. Accetta `children` per poter
 * avvolgere altri componenti.
 */
interface ModalProviderProps {
  children: React.ReactNode;
}

/**
 * @component ModalProvider
 * Un provider di contesto che gestisce lo stato e la logica per visualizzare
 * un modale globale in tutta l'applicazione.
 */
export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  // Stato per memorizzare la configurazione del modale corrente
  const [modalState, setModalState] = useState<
    ModalOptions & { visible: boolean }
  >({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  // La funzione per mostrare il modale, ottimizzata con useCallback
  const showModal = useCallback((options: ModalOptions) => {
    // Mostra il modale con le opzioni fornite
    setModalState({ ...options, visible: true });

    // Imposta un timer per nascondere automaticamente il modale dopo un breve periodo
    setTimeout(() => {
      setModalState((prevState) => ({ ...prevState, visible: false }));
    }, 2500); // Nasconde dopo 2.5 secondi
  }, []);

  // Il valore da passare al provider del contesto, ottimizzato con useMemo
  const contextValue = useMemo(
    () => ({
      showModal,
    }),
    [showModal]
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {/* Renderizza i componenti figli dell'app */}
      {children}

      {/* Renderizza il componente modale, passandogli lo stato corrente */}
      <CustomModal
        visible={modalState.visible}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </ModalContext.Provider>
  );
};
