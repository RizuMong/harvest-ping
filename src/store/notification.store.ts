import {
  INITIAL_NOTIFICATIONS,
  NotificationPriority,
  NotificationType,
} from "@/config/app.config";
import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  time?: string;
  sender: string;
  senderInitials: string;
  read: boolean;
  is_acknowledged: boolean;
  priority: NotificationPriority;
  type: NotificationType;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (
    title: string,
    message: string,
    sender: string,
    priority?: NotificationPriority
  ) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  acknowledgeNotification: (id: string) => void;
}

const initialNotifications: Notification[] = INITIAL_NOTIFICATIONS.map((item) => ({
  ...item,
}));

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initialNotifications,
  addNotification: (title, message, sender, priority = "Normal") => {
    const initials = sender
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const newNotif: Notification = {
      id: Date.now().toString(),
      title,
      message,
      date: "Hari Ini",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      sender,
      senderInitials: initials || "AW",
      read: false,
      is_acknowledged: false,
      priority,
      type: "reminder",
    };

    set((state) => ({
      notifications: [newNotif, ...state.notifications],
    }));
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },
  acknowledgeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true, is_acknowledged: true } : n
      ),
    }));
  },
}));
