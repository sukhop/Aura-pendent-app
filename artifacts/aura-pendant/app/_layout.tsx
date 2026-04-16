import "../global.css";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, TextInput, StyleSheet } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Apply Inter Tight globally to every Text and TextInput
// by patching the default style. This avoids touching every StyleSheet.
const patchDefaultFonts = () => {
  const oldTextRender = (Text as any).render;
  // Use defaultProps for a clean, non-invasive override
  if (!(Text as any).__fontPatched) {
    const originalDefaultProps = (Text as any).defaultProps ?? {};
    (Text as any).defaultProps = {
      ...originalDefaultProps,
      style: [{ fontFamily: "InterTight-Regular" }, originalDefaultProps.style],
    };
    (Text as any).__fontPatched = true;
  }
  if (!(TextInput as any).__fontPatched) {
    const originalDefaultProps = (TextInput as any).defaultProps ?? {};
    (TextInput as any).defaultProps = {
      ...originalDefaultProps,
      style: [{ fontFamily: "InterTight-Regular" }, originalDefaultProps.style],
    };
    (TextInput as any).__fontPatched = true;
  }
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back", headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    "InterTight-Regular": require("../assets/fonts/InterTight-Regular.ttf"),
    "InterTight-Italic": require("../assets/fonts/InterTight-Italic.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      patchDefaultFonts();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
