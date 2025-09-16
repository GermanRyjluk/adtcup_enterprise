import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Feather as Icon } from "@expo/vector-icons";
import { MainStackParamList } from "../navigation/types";
import { styles } from "../styles/styles";
import { theme } from "../theme/theme";

type GameHeaderProps = {
  title: string;
  styles_override?: object;
};

// Tipizziamo la navigazione per avere l'autocompletamento e la sicurezza dei tipi
type NavigationProps = StackNavigationProp<MainStackParamList>;

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  styles_override,
}) => {
  const navigation = useNavigation<NavigationProps>();

  return (
    <View style={[styles.header, styles_override]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
        <Icon name="user" size={28} color={theme.colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
};
