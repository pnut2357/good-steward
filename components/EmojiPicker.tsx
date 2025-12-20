import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
    isVisible: boolean;
    children: React.ReactNode;
    onClose: () => void;
}

export default function EmojiPicker({ isVisible, children, onClose }: Props) {
    return (
        <Modal animationType="slide" transparent={true} visible={isVisible}>
            <View style={styles.modalContent}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Choose a sticker</Text>
                    <Pressable onPress={onClose}>
                        <MaterialIcons name="close" size={22} color="#fff" />
                    </Pressable>
                </View>
                {children}
            </View>
        </Modal>
    );
}
const styles = StyleSheet.create({  
    modalContent: {
        height: "25%",
        width: "100%",
        backgroundColor: "#25292e",
        borderTopRightRadius: 18,
        borderTopLeftRadius: 18,
        padding: 20,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        justifyContent: "center",
        borderTopRightRadius: 18,
        borderTopLeftRadius: 18,
        padding: 20,
        position: "absolute",
    },
    titleContainer: {
        height: "16%",
        backgroundColor: "transparent",
        borderBottomWidth: 1,
        boarderTopRightRadius: 10,
        boarderTopLeftRadius: 10,
        borderBottomColor: "#868686",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});