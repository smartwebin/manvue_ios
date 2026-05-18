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

  useEffect(() => {
    if (!loaded) return;

    SplashScreen.hideAsync(); // Hides splash screen now that fonts are loaded

    // Initialize Facebook SDK and App Tracking Transparency
    const initFacebookSDK = async () => {
      try {
        const { Settings, AppEventsLogger } =
          await import("react-native-fbsdk-next");

        // Helper to complete initialization once permissions are set
        const completeFacebookInitialization = (trackingGranted) => {
          try {
            Settings.setAppID("713059678427310");
            // Set advertiser tracking explicitly based on preference
            Settings.setAdvertiserTrackingEnabled(trackingGranted);
            Settings.setAutoLogAppEventsEnabled(trackingGranted); // Only auto-log if allowed!
            Settings.initializeSDK();

            // Send standard init event if allowed
            if (trackingGranted) {
              setTimeout(() => {
                AppEventsLogger.logEvent("init_ios");
                AppEventsLogger.flush();
                if (__DEV__) {
                  console.log("✅ Sent 'init_ios' to Meta and flushed!");
                }
              }, 2000);
            }

            if (__DEV__) {
              console.log(`✅ Meta SDK initialized. Advertiser tracking: ${trackingGranted}`);
            }
          } catch (initErr) {
            console.warn("⚠️ Meta SDK initialization error:", initErr.message);
          }
        };

        if (Platform.OS === "ios") {
          try {
            const requestPermissionWithDelay = async () => {
              // Wait 1.5 seconds to ensure the view hierarchy is fully loaded and key window is active
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              const { requestTrackingPermissionsAsync, getTrackingPermissionsAsync } =
                await import("expo-tracking-transparency");
              
              // Check current status first
              let { status } = await getTrackingPermissionsAsync();
              
              // Request permission if undetermined
              if (status === "undetermined") {
                const result = await requestTrackingPermissionsAsync();
                status = result.status;
              }
              
              const trackingGranted = status === "granted";
              completeFacebookInitialization(trackingGranted);
            };

            // Only request permission when the app state is active/foregrounded
            if (AppState.currentState === 'active') {
              await requestPermissionWithDelay();
            } else {
              const subscription = AppState.addEventListener('change', async (nextState) => {
                if (nextState === 'active') {
                  subscription.remove();
                  await requestPermissionWithDelay();
                }
              });
            }
          } catch (attError) {
            console.warn("⚠️ ATT permission error:", attError.message);
            completeFacebookInitialization(false);
          }
        } else {
          // Android initialization (always active)
          Settings.setAdvertiserIDCollectionEnabled(true);
          Settings.setAppID("713059678427310");
          Settings.setAutoLogAppEventsEnabled(true);
          Settings.initializeSDK();
          if (__DEV__) {
            console.log("✅ Meta SDK initialized on Android");
          }
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
  }, [loaded]);

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