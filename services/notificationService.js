import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
    this.deviceToken = null;
  }

  // Register for push notifications and get device token
  async registerForPushNotifications() {
    try {
      if (!Device.isDevice) {
        console.log("⚠️ Push notifications only work on physical devices");
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("⚠️ Failed to get push notification permissions");
        return null;
      }

      // Get the token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "f6c8a356-5c81-4791-9d41-f8aff710d075", // Your project ID from app.json
      });

      this.deviceToken = tokenData.data;

      // Store token in SecureStore for later use
      await SecureStore.setItemAsync("device_push_token", this.deviceToken);

      if (__DEV__) {
        console.log("📱 Device Push Token:", this.deviceToken);
      }

      // Configure Android notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#1BA3A3",
          sound: "default",
        });

        // Create additional channels for different notification types
        await Notifications.setNotificationChannelAsync("messages", {
          name: "Messages",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#1BA3A3",
          sound: "default",
        });

        await Notifications.setNotificationChannelAsync("matches", {
          name: "Matches",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF8A3D",
          sound: "default",
        });

        await Notifications.setNotificationChannelAsync("interviews", {
          name: "Interviews",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#1E4A72",
          sound: "default",
        });
      }

      return this.deviceToken;
    } catch (error) {
      console.error("❌ Error registering for push notifications:", error);
      return null;
    }
  }

  // Get stored device token
  async getDeviceToken() {
    try {
      if (this.deviceToken) {
        return this.deviceToken;
      }

      // Try to get from SecureStore
      const storedToken = await SecureStore.getItemAsync("device_push_token");
      if (storedToken) {
        this.deviceToken = storedToken;
        return storedToken;
      }

      // If no token, register for push notifications
      return await this.registerForPushNotifications();
    } catch (error) {
      console.error("❌ Error getting device token:", error);
      return null;
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    // Listener for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (__DEV__) {
          console.log("📬 Notification received (foreground):", notification);
        }

        const { title, body, data } = notification.request.content;

        if (__DEV__) {
          console.log("📬 Title:", title);
          console.log("📬 Body:", body);
          console.log("📬 Data:", data);
        }
      },
    );

    // Listener for when user taps on notification
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        if (__DEV__) {
          console.log("👆 Notification tapped:", response);
        }

        const { data } = response.notification.request.content;
        this.handleNotificationNavigation(data);
      });

    if (__DEV__) {
      console.log("✅ Notification listeners set up");
    }
  }

  // Handle navigation based on notification data
  handleNotificationNavigation(data) {
    try {
      if (!data || !data.route) {
        console.log("⚠️ No navigation data in notification");
        return;
      }

      const { route, params } = data;

      if (__DEV__) {
        console.log("🧭 Navigating to:", route, "with params:", params);
      }

      // Use setTimeout to ensure navigation happens after app is ready
      setTimeout(() => {
        try {
          if (params) {
            // If route includes dynamic parameters like [id]
            if (route.includes("[id]") && params.id) {
              const finalRoute = route.replace("[id]", params.id);
              router.push(finalRoute);
            } else {
              router.push({ pathname: route, params });
            }
          } else {
            router.push(route);
          }
        } catch (navError) {
          console.error("❌ Navigation error:", navError);
        }
      }, 500);
    } catch (error) {
      console.error("❌ Error handling notification navigation:", error);
    }
  }

  // Handle notification when app is opened from quit state
  async handleInitialNotification() {
    try {
      const response = await Notifications.getLastNotificationResponseAsync();

      if (response) {
        const { data } = response.notification.request.content;

        if (__DEV__) {
          console.log("🚀 App opened from notification:", data);
        }

        this.handleNotificationNavigation(data);
      }
    } catch (error) {
      console.error("❌ Error handling initial notification:", error);
    }
  }

  // Schedule a local notification (for testing)
  async scheduleLocalNotification(title, body, data = {}, seconds = 1) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
        },
        trigger: {
          seconds,
        },
      });

      if (__DEV__) {
        console.log("✅ Local notification scheduled");
      }
    } catch (error) {
      console.error("❌ Error scheduling local notification:", error);
    }
  }

  // Send immediate local notification (for testing)
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
        },
        trigger: null, // Trigger immediately
      });

      if (__DEV__) {
        console.log("✅ Local notification sent");
      }
    } catch (error) {
      console.error("❌ Error sending local notification:", error);
    }
  }

  // Get notification badge count
  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error("❌ Error getting badge count:", error);
      return 0;
    }
  }

  // Set notification badge count
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error("❌ Error setting badge count:", error);
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);

      if (__DEV__) {
        console.log("✅ All notifications cleared");
      }
    } catch (error) {
      console.error("❌ Error clearing notifications:", error);
    }
  }

  // Remove notification listeners
  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }

    if (__DEV__) {
      console.log("✅ Notification listeners removed");
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
