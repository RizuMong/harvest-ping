import { supabase } from "./supabase";

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

export const createReminders = async (rows: CreateReminderInput[]): Promise<void> => {
  const { error } = await supabase.from("t_ping_reminder").insert(rows);
  if (error) {
    console.error("createReminders error:", error);
    throw new Error(error.message || "Tidak dapat menyimpan pengingat.");
  }
};
