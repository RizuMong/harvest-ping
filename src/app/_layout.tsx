import { Slot } from "expo-router";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";

import AuthProvider from "@/providers/AuthProvider";
import { NotificationProvider } from "@/providers/NotificationContext";

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
  ({ data, error, executionInfo }) => {
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

export default function RootLayout() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </NotificationProvider>
  );
}