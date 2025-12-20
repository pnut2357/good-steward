import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { LogBox } from "react-native";

LogBox.ignoreAllLogs();

export default function TabsLayout() {
  return (
    <Tabs
    screenOptions={{
        headerShown: false,
        headerStyle: {backgroundColor: "#B6FFBB"},
        headerTintColor: "#000000",
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#000000",
        tabBarStyle: {
            backgroundColor: "#B6FFBB",
        },
    }}
    >
        <Tabs.Screen name="index" options={{ headerTitle: "Home", tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "home" : "home-outline"} color={color} size={24} /> }} />
        <Tabs.Screen name="about" options={{ title: "About", tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "information-circle" : "information-circle-outline"} color={color} size={24} /> }} />
    </Tabs>
  );
}
