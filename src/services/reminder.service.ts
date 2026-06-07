import { supabase } from "./supabase";
import { getSession } from "./storage.service";

export interface ReminderItem {
  id: string;
  title: string;
  message: string;
  priority: string | null;
  isAcknowledged: boolean;
  createdAt: string | null;
  receiverId: string | null;
}

export const fetchReminders = async (): Promise<ReminderItem[]> => {
  const session = await getSession();
  if (!session || Number(session.role_id) !== 1) {
    throw new Error("Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.");
  }

  const { data, error } = await supabase
    .from("t_ping_reminder")
    .select("id, title, message, priority, is_acknowledged, created_at, receiver_id")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchReminders error:", error);
    throw new Error(error.message || "Gagal memuat daftar pengingat.");
  }

  return (data || []).map((row: any) => ({
    id: String(row.id),
    title: row.title || "-",
    message: row.message || "-",
    priority: row.priority || "Normal",
    isAcknowledged: !!row.is_acknowledged,
    createdAt: row.created_at || null,
    receiverId: row.receiver_id ? String(row.receiver_id) : null,
  }));
};

export const fetchRemindersForUser = async (userId: string) => {
  const receiverIdNumber = parseInt(userId, 10);
  if (isNaN(receiverIdNumber)) {
    throw new Error("Invalid User ID");
  }

  const { data, error } = await supabase
    .from("t_ping_reminder")
    .select("*")
    .eq("receiver_id", receiverIdNumber)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchRemindersForUser error:", error);
    throw new Error(error.message || "Gagal memuat kotak masuk.");
  }

  return data || [];
};

export const acknowledgeReminder = async (reminderId: string): Promise<void> => {
  const idNumber = parseInt(reminderId, 10);
  if (isNaN(idNumber)) {
    throw new Error("Invalid Reminder ID");
  }

  const { error } = await supabase
    .from("t_ping_reminder")
    .update({ is_acknowledged: true })
    .eq("id", idNumber);

  if (error) {
    console.error("acknowledgeReminder error:", error);
    throw new Error(error.message || "Gagal mengonfirmasi laporan.");
  }
};

export const acknowledgeAllReminders = async (userId: string): Promise<void> => {
  const receiverIdNumber = parseInt(userId, 10);
  if (isNaN(receiverIdNumber)) {
    throw new Error("Invalid User ID");
  }

  const { error } = await supabase
    .from("t_ping_reminder")
    .update({ is_acknowledged: true })
    .eq("receiver_id", receiverIdNumber)
    .eq("is_acknowledged", false);

  if (error) {
    console.error("acknowledgeAllReminders error:", error);
    throw new Error(error.message || "Gagal mengonfirmasi semua laporan.");
  }
};

export interface CreateReminderInput {
  receiver_id: number;
  title: string;
  message: string;
  priority: string;
  is_acknowledged: boolean;
}

async function sendPushNotificationsForReminders(rows: CreateReminderInput[]): Promise<void> {
  for (const row of rows) {
    try {
      const receiverId = row.receiver_id;
      if (!receiverId) continue;

      // 1. Query public.user_devices where user_id = receiverId
      const { data: devices, error } = await supabase
        .from("user_devices")
        .select("push_token")
        .eq("user_id", receiverId);

      if (error) {
        console.error(`Error querying user_devices for user ${receiverId}:`, error);
        continue;
      }

      if (!devices || devices.length === 0) {
        console.log(`No devices found for user ${receiverId}.`);
        continue;
      }

      // 2. Extract push tokens
      const pushTokens = devices
        .map((d: any) => d.push_token)
        .filter((token: any) => typeof token === "string" && token.trim().length > 0);

      if (pushTokens.length === 0) {
        console.log(`No valid push tokens found for user ${receiverId}.`);
        continue;
      }

      // 3. Set 'to' as string if single token, or array if multiple tokens
      const toValue = pushTokens.length === 1 ? pushTokens[0] : pushTokens;

      const payload = {
        to: toValue,
        title: row.title,
        body: row.message,
        sound: "pager.wav",
        channelId: "pager",
      };

      console.log(`Sending push notification to user ${receiverId} with payload:`, JSON.stringify(payload));

      // 4. Send POST request to Expo Push API
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Expo Push API response:", JSON.stringify(result));
    } catch (err) {
      console.error("Failed to process push notification for row:", row, err);
    }
  }
}

export const createReminders = async (rows: CreateReminderInput[]): Promise<void> => {
  const session = await getSession();
  if (!session || Number(session.role_id) !== 1) {
    throw new Error("Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.");
  }

  const { error } = await supabase.from("t_ping_reminder").insert(rows);
  if (error) {
    console.error("createReminders error:", error);
    throw new Error(error.message || "Tidak dapat menyimpan pengingat.");
  }

  // Trigger push notifications asynchronously
  sendPushNotificationsForReminders(rows).catch((err) => {
    console.error("Failed to send push notifications:", err);
  });
};
