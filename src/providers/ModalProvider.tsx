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
    persistent: false,
  });

  // Funzione per nascondere il modal, da chiamare manualmente
  const hideModal = useCallback(() => {
    setModalState((prevState) => ({ ...prevState, visible: false }));
  }, []);

  const showModal = useCallback(
    (options: ModalOptions) => {
      setModalState({ ...options, visible: true });

      // Se il modal NON è persistente, si chiude da solo dopo 2.5 secondi
      if (!options.persistent) {
        setTimeout(() => {
          hideModal();
        }, 2500);
      }
    },
    [hideModal]
  );

  // Il valore da passare al provider del contesto, ottimizzato con useMemo
  const contextValue = useMemo(
    () => ({
      showModal,
      hideModal,
    }),
    [showModal]
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      <CustomModal
        visible={modalState.visible}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        persistent={modalState.persistent} // Passiamo la nuova prop
        onClose={hideModal} // Passiamo la funzione per chiudere
      />
    </ModalContext.Provider>
  );
};
