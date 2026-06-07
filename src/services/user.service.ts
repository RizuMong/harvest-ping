import { supabase } from "./supabase";
import { getSession } from "./storage.service";

export interface User {
  id: string;
  full_name: string;
  nrp: string;
}

export const fetchUsers = async (): Promise<User[]> => {
  const session = await getSession();
  if (!session) {
    throw new Error("Sesi tidak ditemukan. Harap masuk kembali.");
  }

  const { data, error } = await supabase
    .from("master_user")
    .select("id, full_name, nrp")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching users:", error);
    throw new Error(error.message || "Gagal memuat data pengguna.");
  }

  return (data || []).map((u: any) => ({
    id: String(u.id),
    full_name: u.full_name || "",
    nrp: u.nrp || "",
  }));
};
