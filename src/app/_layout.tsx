import { Slot } from "expo-router";
import AuthProvider from "@/providers/AuthProvider";
import { NotificationProvider } from "@/providers/NotificationContext";
import Constants from "expo-constants";

// Initialize notification task handler only when running in development build or native app
if (Constants.appOwnership !== "expo") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require("expo-notifications");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TaskManager = require("expo-task-manager");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

    TaskManager.defineTask(
      BACKGROUND_NOTIFICATION_TASK,
      ({ data, error, executionInfo }: any) => {
        console.log(
          "Received a notification in the background!",
          JSON.stringify(
            {
              data,
              error,
              executionInfo,
            },
            null,
            2,
          ),
        );
        return Promise.resolve();
      },
    );

    Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  } catch (e) {
    console.warn("Background notification task registration not supported in this environment:", e);
  }
}

export default function RootLayout() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </NotificationProvider>
  );
}