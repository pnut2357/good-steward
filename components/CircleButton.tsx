import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
    onPress: () => void;
    icon: keyof typeof MaterialIcons.glyphMap;
    theme?: "primary";
}

export default function CircleButton({ onPress, icon, theme }: Props) {
    if (theme === "primary") {
        return (
            <View style={[styles.circleButtonContainer, { borderWidth: 4, borderColor: "#ffd33d", borderRadius: 18 }]}>
                <Pressable style={[styles.circleButton, { backgroundColor: "#fff" }]} onPress={onPress}>
                    <MaterialIcons name={icon} size={24} color="#25292e" />
                </Pressable>
            </View>
        );
    } else {
        return (
            <View style={styles.circleButtonContainer}>
                <Pressable style={styles.circleButton} onPress={onPress}>
                    <MaterialIcons name={icon} size={24} color="#25292e" />
                </Pressable>
            </View>
        );
    }
}
const styles = StyleSheet.create({
    circleButtonContainer: {
        width: 84,
        height: 84,
        marginHorizontal: 20,
        borderWidth: 4,
        borderColor: "#ffd33d",
        borderRadius: 42,
        padding: 3,
    },
    circleButton: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 42,
    },
});