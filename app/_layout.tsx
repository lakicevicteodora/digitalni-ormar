import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";

import {
  OnboardingProvider,
  useOnboarding,
} from "@/contexts/OnboardingContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/useAuth";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <RootLayoutNav />
    </OnboardingProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { loading: authLoading, isLoggedIn } = useAuth();
  const { hasSeenOnboarding } = useOnboarding();

  if (authLoading || hasSeenOnboarding === null) {
    return (
      <View style={styles.splash}>
        <Image
          source={require("../assets/images/splash-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.splashTitle}>Digitalni Orman</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Protected guard={!hasSeenOnboarding}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={hasSeenOnboarding && isLoggedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
          <Stack.Screen name="add-item" options={{ headerShown: false }} />
          <Stack.Screen name="create-outfit" options={{ headerShown: false }} />
          <Stack.Screen name="item-detail" options={{ headerShown: false }} />
          <Stack.Screen name="outfit-detail" options={{ headerShown: false }} />
          <Stack.Screen name="liked-items" options={{ headerShown: false }} />
          <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
          <Stack.Screen
            name="change-password"
            options={{ headerShown: false }}
          />
        </Stack.Protected>

        <Stack.Protected guard={hasSeenOnboarding && !isLoggedIn}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFDBDB",
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3a2a25",
  },
});
