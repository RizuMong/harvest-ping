import { supabase } from "./supabase";
import { getSession } from "./storage.service";

export interface ScheduleRow {
  id: string;
  receiver_id: string | null;
  title: string | null;
  message: string | null;
  start_date: string | null;
  end_date: string | null;
  ping_time: string | null;
  priority: string | null;
  status: string | null;
  created_at: string | null;
}

export const formatDateOnly = (dateStr: string | null) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
};

export const formatTimeOnly = (timeStr: string | null) => {
  if (!timeStr) return "-";
  return timeStr.slice(0, 5);
};

export const fetchSchedules = async (): Promise<ScheduleRow[]> => {
  const session = await getSession();
  if (!session || Number(session.role_id) !== 1) {
    throw new Error("Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.");
  }

  const { data, error } = await supabase
    .from("t_ping_scheduller")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchSchedules error:", error);
    throw new Error(error.message || "Gagal memuat jadwal.");
  }

  return (data || []).map((row: any) => ({
    id: String(row.id),
    receiver_id: row.receiver_id ? String(row.receiver_id) : null,
    title: row.title,
    message: row.message,
    start_date: formatDateOnly(row.start_date),
    end_date: formatDateOnly(row.end_date),
    ping_time: formatTimeOnly(row.ping_time),
    priority: row.priority,
    status: row.status,
    created_at: row.created_at,
  }));
};

export const createSchedules = async (rows: any[]): Promise<void> => {
  const session = await getSession();
  if (!session || Number(session.role_id) !== 1) {
    throw new Error("Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.");
  }

  const { error } = await supabase.from("t_ping_scheduller").insert(rows);
  if (error) {
    console.error("createSchedules error:", error);
    throw new Error(error.message || "Gagal menyimpan jadwal.");
  }
};

export const deleteSchedules = async (ids: string[]): Promise<void> => {
  const session = await getSession();
  if (!session || Number(session.role_id) !== 1) {
    throw new Error("Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.");
  }

  const numericIds = ids.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
  if (numericIds.length === 0) return;

  const { data: currentSchedules, error: fetchError } = await supabase
    .from("t_ping_scheduller")
    .select("status")
    .in("id", numericIds);

  if (fetchError) {
    console.error("Error fetching schedules for deletion validation:", fetchError);
    throw new Error(fetchError.message || "Gagal memvalidasi status jadwal.");
  }

  const hasNonPending = currentSchedules?.some(
    (s) => s.status !== "pending"
  );

  if (hasNonPending) {
    throw new Error("Active or completed reminder schedules cannot be deleted.");
  }

  const { error } = await supabase
    .from("t_ping_scheduller")
    .delete()
    .in("id", numericIds);

  if (error) {
    console.error("deleteSchedules error:", error);
    throw new Error(error.message || "Gagal menghapus jadwal.");
  }
};
