// File: src/components/AdminHeader.tsx

import { Feather as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import {
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { styles } from "../styles/styles";
import { theme } from "../theme/theme";

type AdminHeaderProps = {
  title: string;
  children?: React.ReactNode; // Per pulsanti extra come "+"
  style?: StyleProp<ViewStyle>;
};

// Definiamo un tipo generico per la navigazione
type NavigationProps = StackNavigationProp<{ Profile: undefined }>;

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  children,
  style,
}) => {
  const navigation = useNavigation<NavigationProps>();

  return (
    <View style={[styles.header, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {children}
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          style={{ marginLeft: children ? theme.spacing.md : 0 }}
        >
          <Icon name="user" size={28} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
