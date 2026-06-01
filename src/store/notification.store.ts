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
  priority: "Tinggi" | "Normal" | "Rendah";
  type: "reminder" | "announcement" | "approval";
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (
    title: string,
    message: string,
    sender: string,
    priority?: "Tinggi" | "Normal" | "Rendah"
  ) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  acknowledgeNotification: (id: string) => void;
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "Pengingat: Waktunya Input Laporan Panen",
    message: "Harap segera menginput data hasil panen hari ini untuk Blok A.",
    date: "01 Jun 2026",
    time: "14:30",
    sender: "Cindy Yolanda Octavia",
    senderInitials: "CY",
    read: false,
    is_acknowledged: false,
    priority: "Tinggi",
    type: "reminder",
  },
  {
    id: "2",
    title: "Standard Operational Procedure Pemupukan Blok A & B",
    message: "Berikut adalah panduan terbaru pemupukan Kelapa Sawit untuk Blok A dan Blok B.",
    date: "25 May 2026",
    time: "09:00",
    sender: "Dian Wahyu Pratama",
    senderInitials: "DP",
    read: true,
    is_acknowledged: true,
    priority: "Normal",
    type: "announcement",
  },
  {
    id: "3",
    title: "Jadwal Kerja Bergilir Periode Juni 2026",
    message: "Silakan periksa jadwal kerja bergilir untuk bulan Juni 2026 pada lampiran berikut.",
    date: "18 May 2026",
    time: "11:15",
    sender: "Cindy Yolanda Octavia",
    senderInitials: "CY",
    read: true,
    is_acknowledged: true,
    priority: "Rendah",
    type: "announcement",
  },
];

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
