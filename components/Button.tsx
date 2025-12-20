import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
    label: string;
    onPress?: () => void;
    theme?: "primary";
}

export default function Button({ label, onPress, theme }: Props) {
    if (theme === "primary") {
        return (
            <View style={[styles.buttonContainer, { borderWidth: 4, borderColor: "#ffd33d", borderRadius: 18 }]}>
                <Pressable style={[styles.button, { backgroundColor: "#fff" }]} onPress={onPress}>
                    <FontAwesome name="picture-o" size={18} color="black" style={styles.buttonIcon} />
                    <Text style={[styles.buttonLabel, { color: "#25292e" }]}>{label}</Text>
                </Pressable>
            </View>
        );
    } else {
        return (
            <View style={styles.buttonContainer}>
                <Pressable style={styles.button} onPress={onPress}>
                    <Text style={styles.buttonLabel}>{label}</Text>
                </Pressable>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    buttonContainer: {
        width: 320,
        height: 68,
        marginHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        backgroundColor: "#ecfffd",
        padding: 10,
        borderRadius: 5,
    },
    button: {
        borderRadius: 5,
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },
    buttonIcon: {
        paddingRight: 8,
    },
    buttonLabel: {
        color: "#000000",
        fontSize: 16,
        fontWeight: "bold",
    },
    footerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#B6FFBB",
    },
});

