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
        onError={(err) => console.warn('⚠️ Local BLIP error:', err)}
      />
    </GestureHandlerRootView>
  );
}
