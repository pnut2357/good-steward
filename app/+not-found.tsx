import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerTitle: "Oops! Not Found" }} />
      <View style={styles.container}>
        <Link href="/" style={buttonStyles.button}>Go back to Home Screen</Link>
      </View>
    </>
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
    backgroundColor: "#FF0000",
    color: "#000000",
    padding: 10,
    borderRadius: 5,
  },
});