import notificationService from "@/services/notificationService";
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";
import { AppState, Platform } from 'react-native';
import "react-native-reanimated";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync(); // hides immediately on load

    // Initialize Facebook SDK
    const initFacebookSDK = async () => {
      try {
        const { Settings, AppEventsLogger } =
          await import("react-native-fbsdk-next");

        if (Platform.OS === "ios") {
          try {
            const { requestTrackingPermissionsAsync } =
              await import("expo-tracking-transparency");
            const { status } = await requestTrackingPermissionsAsync();
            Settings.setAdvertiserTrackingEnabled(status === "granted");
          } catch (attError) {
            console.warn("⚠️ ATT permission error:", attError.message);
            Settings.setAdvertiserTrackingEnabled(false);
          }
        }

        if (Platform.OS === "android") {
          Settings.setAdvertiserIDCollectionEnabled(true);
        }

        // Explicitly set App ID and related settings
        Settings.setAppID("713059678427310");
        Settings.setAutoLogAppEventsEnabled(true);
        Settings.initializeSDK();

        // 🎯 Test event
        setTimeout(() => {
          AppEventsLogger.logEvent("init_ios");
          AppEventsLogger.flush();
          if (__DEV__) {
            console.log("✅ Sent 'init_ios' to Meta and flushed!");
          }
        }, 2000);

        if (__DEV__) {
          console.log("✅ Meta SDK initialized and activated");
        }
      } catch (error) {
        console.warn("⚠️ Meta SDK init failed (non-fatal):", error.message);
      }
    };

    initFacebookSDK();

    // Setup online manager for React Native
    const unsubscribe = NetInfo.addEventListener((state) => {
      onlineManager.setOnline(!!state.isConnected);
    });

    // Setup focus manager for React Native
    const subscription = AppState.addEventListener('change', (status) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
      }
    });

    // Initialize push notifications
    const initNotifications = async () => {
      try {
        // Register for push notifications and get device token
        await notificationService.registerForPushNotifications();
        // Set up notification listeners
        notificationService.setupNotificationListeners();
        // Handle notification if app was opened from quit state
        await notificationService.handleInitialNotification();
        if (__DEV__) {
          console.log('✅ Notification service initialized');
        }
      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
      }
    };

    initNotifications();

    // Cleanup on unmount
    return () => {
      notificationService.removeNotificationListeners();
      unsubscribe();
      subscription.remove();
    };
  }, []);

  const [loaded] = useFonts({
    "Outfit-Thin": require("../assets/fonts/Outfit-Thin.ttf"),
    "Outfit-ExtraLight": require("../assets/fonts/Outfit-ExtraLight.ttf"),
    "Outfit-Light": require("../assets/fonts/Outfit-Light.ttf"),
    "Outfit-Regular": require("../assets/fonts/Outfit-Regular.ttf"),
    "Outfit-Medium": require("../assets/fonts/Outfit-Medium.ttf"),
    "Outfit-SemiBold": require("../assets/fonts/Outfit-SemiBold.ttf"),
    "Outfit-Bold": require("../assets/fonts/Outfit-Bold.ttf"),
    "Outfit-ExtraBold": require("../assets/fonts/Outfit-ExtraBold.ttf"),
    "Outfit-Black": require("../assets/fonts/Outfit-Black.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </QueryClientProvider>
  );
}