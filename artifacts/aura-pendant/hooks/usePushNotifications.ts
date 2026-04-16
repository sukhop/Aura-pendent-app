import { useEffect } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useAppStore } from "@/store/appStore";

type NotificationsModule = {
  AndroidImportance: { MAX: number };
  setNotificationChannelAsync: (
    channelId: string,
    channel: {
      name: string;
      importance: number;
      vibrationPattern: number[];
      lightColor: string;
      sound: string;
    }
  ) => Promise<void>;
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getExpoPushTokenAsync: (input: { projectId: string }) => Promise<{ data: string }>;
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowBanner: boolean;
      shouldShowList: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }) => void;
  addNotificationReceivedListener: (
    listener: (notification: {
      request: { content: { title?: string | null; body?: string | null } };
    }) => void
  ) => { remove: () => void };
};

function isExpoGo() {
  return (
    Constants.appOwnership === "expo" ||
    Constants.executionEnvironment === "storeClient"
  );
}

function loadNotificationsModule(): NotificationsModule | null {
  if (Platform.OS === "web" || isExpoGo()) {
    return null;
  }

  try {
    const req = (0, eval)("require") as (id: string) => NotificationsModule;
    return req("expo-notifications");
  } catch (error) {
    console.warn("[push] expo-notifications module could not be loaded", error);
    return null;
  }
}

async function registerForPushNotificationsAsync(
  Notifications: NotificationsModule
) {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("sos-alerts", {
      name: "SOS Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 100, 300],
      lightColor: "#FF3B4E",
      sound: "default",
    });
  }

  if (!Device.isDevice) {
    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;

  if (finalStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn(
      "[push] Expo projectId is missing. Configure EAS projectId before requesting Expo push tokens."
    );
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResponse.data;
}

export function usePushNotifications() {
  const updateProfile = useAppStore((state) => state.updateProfile);
  const addAlert = useAppStore((state) => state.addAlert);

  useEffect(() => {
    let mounted = true;
    let subscription: { remove: () => void } | null = null;

    const setup = async () => {
      const Notifications = loadNotificationsModule();

      if (!Notifications) {
        if (isExpoGo()) {
          console.warn(
            "[push] Expo Go does not support remote push notifications on Android/iOS SDK 53+. Use a development build to test push."
          );
        }
        return;
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      try {
        const token = await registerForPushNotificationsAsync(Notifications);
        if (mounted && token) {
          updateProfile({ pushToken: token });
        }
      } catch (error) {
        console.warn("[push] registration failed", error);
      }

      subscription = Notifications.addNotificationReceivedListener(
        (notification) => {
          const title = notification.request.content.title ?? "Aura Alert";
          const message =
            notification.request.content.body ?? "A notification was received.";

          addAlert({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: "SOS",
            title,
            message,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      );
    };

    void setup();

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [addAlert, updateProfile]);
}
