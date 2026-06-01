export type NotificationPriority = "Tinggi" | "Normal" | "Rendah";
export type NotificationType = "reminder" | "announcement" | "approval";
export type RequestStatus = "submitted" | "approved" | "rejected";
export type ApprovalLineStatus = "Waiting" | "Approved" | "Rejected";

export interface StatusBadgeConfig {
  label: string;
  bg: string;
  text: string;
}

export interface ApprovalLineConfig {
  icon: string;
  iconBg: string;
  iconColor: string;
}

export interface HomeQuickAction {
  id: string;
  label: string;
  icon: string;
  bgColor: string;
  iconColor: string;
  route: string;
}

export const REQUEST_STATUS_BADGES: Record<RequestStatus, StatusBadgeConfig> = {
  submitted: {
    label: "Submitted",
    bg: "#E8F0FE",
    text: "#1A73E8",
  },
  approved: {
    label: "Approved",
    bg: "#E6F4EA",
    text: "#137333",
  },
  rejected: {
    label: "Rejected",
    bg: "#FCE8E6",
    text: "#C5221F",
  },
};

export const APPROVAL_LINE_META: Record<ApprovalLineStatus, ApprovalLineConfig> = {
  Waiting: {
    icon: "time",
    iconBg: "#E8F0FE",
    iconColor: "#1A73E8",
  },
  Approved: {
    icon: "checkmark-circle",
    iconBg: "#E6F4EA",
    iconColor: "#137333",
  },
  Rejected: {
    icon: "close-circle",
    iconBg: "#FCE8E6",
    iconColor: "#C5221F",
  },
};

export const PRIORITY_BADGE_STYLES = {
  Tinggi: {
    bg: "#FCE8E6",
    text: "#D93025",
    border: "#FAD2CF",
  },
  Normal: {
    bg: "#FEF7E0",
    text: "#B06000",
    border: "#FEEFC3",
  },
  Rendah: {
    bg: "#E8F0FE",
    text: "#1A73E8",
    border: "#D2E3FC",
  },
} as const;

export const DEFAULT_SCHEDULERS = [
  { id: "1", title: "Jadwal Panen Pagi - Blok A (06:00 - 10:00)" },
  { id: "2", title: "Jadwal Panen Siang - Blok B (10:00 - 14:00)" },
  { id: "3", title: "Jadwal Panen Sore - Blok C (14:00 - 18:00)" },
];

export const DEFAULT_APPROVERS = [
  { id: "1", userId: "2", userName: "Cindy Yolanda Octavia", sequence: 1 },
  { id: "2", userId: "3", userName: "Dian Wahyu Pratama", sequence: 2 },
];

export const INITIAL_NOTIFICATIONS = [
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
    priority: "Tinggi" as NotificationPriority,
    type: "reminder" as NotificationType,
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
    priority: "Normal" as NotificationPriority,
    type: "announcement" as NotificationType,
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
    priority: "Rendah" as NotificationPriority,
    type: "announcement" as NotificationType,
  },
] as const;

export const HOME_QUICK_ACTIONS: HomeQuickAction[] = [
  {
    id: "instant-reminder",
    label: "Pengingat Instant",
    icon: "notifications-outline",
    bgColor: "#E8F0FE",
    iconColor: "#1A73E8",
    route: "/reminder/create",
  },
  {
    id: "inbox",
    label: "Kotak Masuk",
    icon: "mail-outline",
    bgColor: "#FCE8E6",
    iconColor: "#D93025",
    route: "/(tabs)/inbox",
  },
  {
    id: "selesai-panen",
    label: "Selesai Panen",
    icon: "leaf-outline",
    bgColor: "#E6F4EA",
    iconColor: "#137333",
    route: "/(tabs)/request",
  },
  {
    id: "approval",
    label: "Persetujuan",
    icon: "checkbox-outline",
    bgColor: "#F3E5F5",
    iconColor: "#6A1B9A",
    route: "/approval",
  },
];
