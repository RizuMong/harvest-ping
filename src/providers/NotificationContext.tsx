import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type * as NotificationsType from "expo-notifications";
import Constants from "expo-constants";

interface NotificationContextType {
  expoPushToken: string | null;
  devicePushToken: string | null;
  notification: NotificationsType.Notification | null;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [devicePushToken, setDevicePushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<NotificationsType.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (Constants.appOwnership === "expo") {
      console.log("Push notifications are disabled in Expo Go. Skipping registration.");
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Notifications = require("expo-notifications");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { registerForPushNotificationsAsync } = require("@/shared/utils/register.for.push.notifications.async");

      registerForPushNotificationsAsync().then(
        (token: string) => setExpoPushToken(token),
        (error: Error) => setError(error),
      );

      Notifications.getDevicePushTokenAsync().then(
        (devicePushToken: any) => {
          console.log({ devicePushToken });
          setDevicePushToken(devicePushToken.data);
        },
        (error: Error) => {
          setError(error);
        },
      );

      const notificationListener = Notifications.addNotificationReceivedListener(
        (notification: any) => {
          console.log("Notification Received: ", notification);
          setNotification(notification);
        },
      );

      const responseListener =
        Notifications.addNotificationResponseReceivedListener((response: any) => {
          console.log("Notification Response: ", response);
        });

      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    } catch (e: any) {
      console.warn("Failed to register notifications:", e);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, devicePushToken, notification, error }}
    >
      {children}
    </NotificationContext.Provider>
  );
};