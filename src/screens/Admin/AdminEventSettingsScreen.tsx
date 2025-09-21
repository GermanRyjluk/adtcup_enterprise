import React from "react";
import { Text, View } from "react-native";
import { styles } from "../../styles/styles";

const AdminEventSettingsScreen = () => {
  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.sectionTitle}>Impostazioni Evento</Text>
      <Text style={styles.bodyText}>
        Qui potrai modificare i dettagli dell'evento attivo.
      </Text>
    </View>
  );
};

export default AdminEventSettingsScreen;
