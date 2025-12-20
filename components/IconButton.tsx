import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    onPress: () => void;
    theme?: "primary";
}

export default function IconButton({icon, label, onPress, theme }: Props) {
    return (
        <Pressable style={styles.iconButton} onPress={onPress}>
            <MaterialIcons name={icon} size={24} color="#25292e" />
            <Text style={styles.iconButtonLabel}>{label}</Text>
        </Pressable>
    );
}
const styles = StyleSheet.create({
    iconButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    iconButtonLabel: {
        color: "#25292e",
        fontSize: 16,
        fontWeight: "bold",
    },
});
