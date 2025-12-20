import { StyleSheet, Text, View } from "react-native";

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={textStyles.text}>About Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#B6FFBB",
  },
});

const textStyles = StyleSheet.create({
  text: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
  },
});

const buttonStyles = StyleSheet.create({
  button: {
    backgroundColor: "#000000",
    padding: 10,
    borderRadius: 5,
  },
});