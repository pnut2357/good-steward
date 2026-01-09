import { Stack } from "expo-router";
import { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LocalVisionWebView } from "../components/LocalVisionWebView";

export default function RootLayout() {
  const [localBlipReady, setLocalBlipReady] = useState(false);
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerTitle: "Oops! Not Found" }} />
      </Stack>
      {/* Local BLIP WebView - visible while loading, hidden when ready */}
      <LocalVisionWebView 
        visible={!localBlipReady}
        onReady={() => {
          console.log('✅ Local BLIP model ready');
          setLocalBlipReady(true);
        }}
        onError={(err) => {
          // Silently handle BLIP errors in development (expected in Expo Go)
          // This prevents error toasts from appearing on Android
          console.log('ℹ️ Local BLIP not available (requires dev/production build)');
          setLocalBlipReady(true); // Mark as ready to hide the WebView
        }}
      />
    </GestureHandlerRootView>
  );
}
