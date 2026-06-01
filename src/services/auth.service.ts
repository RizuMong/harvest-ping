import { supabase } from "./supabase";

export const login = async (
  nrp: string,
  pin: string
) => {
  // Parse pin as an integer because the pin column in master_user is stored as a bigint
  const pinNumber = parseInt(pin, 10);

  const { data, error } = await supabase
    .from("master_user")
    .select("*")
    .eq("nrp", nrp.trim())
    .eq("pin", isNaN(pinNumber) ? pin : pinNumber)
    .single();

  if (error || !data) {
    if (error && error.code !== "PGRST116") {
      console.error("Login attempt failed:", error);
    }
    throw new Error("NRP atau PIN salah");
  }

  return data;
};

export const verifyAndUpdatePin = async (nrp: string, currentPin: string, newPin: string) => {
  const currentPinNumber = parseInt(currentPin, 10);
  const newPinNumber = parseInt(newPin, 10);

  if (isNaN(currentPinNumber) || isNaN(newPinNumber)) {
    throw new Error("PIN harus berupa angka");
  }

  // 1. Verify Current PIN
  const { data: user, error: fetchError } = await supabase
    .from("master_user")
    .select("pin")
    .eq("nrp", nrp.trim())
    .eq("pin", currentPinNumber)
    .single();

  if (fetchError || !user) {
    throw new Error("PIN Lama salah");
  }

  // 2. Update to New PIN
  const { data, error: updateError } = await supabase
    .from("master_user")
    .update({ pin: newPinNumber })
    .eq("nrp", nrp.trim())
    .select("*")
    .single();

  if (updateError) {
    console.error("Update PIN failed:", updateError);
    throw new Error(updateError.message || "Gagal mengubah PIN");
  }

  return data;
};