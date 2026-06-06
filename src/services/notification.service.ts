import { supabase } from "./supabase";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { registerForPushNotificationsAsync } from "@/shared/utils/register.for.push.notifications.async";
import Constants from "expo-constants";

async function getOrCreateDeviceId(): Promise<string> {
  try {
    let deviceId = await SecureStore.getItemAsync("device_id");
    if (!deviceId) {
      // Generate a unique device identifier
      deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await SecureStore.setItemAsync("device_id", deviceId);
    }
    return deviceId;
  } catch (e) {
    console.error("Failed to read/write device_id in SecureStore:", e);
    return "generic-device-" + Platform.OS + "-" + (Device.modelName || "unknown").replace(/\s+/g, "-").toLowerCase();
  }
}

export const registerDevice = async (userId: string | number) => {
  try {
    // 1. Get or generate device_id
    const deviceId = await getOrCreateDeviceId();

    // 2. Get the latest Expo Push Token
    let pushToken: string | null = null;
    if (Constants.appOwnership !== "expo") {
      try {
        pushToken = await registerForPushNotificationsAsync();
      } catch (err) {
        console.warn("Failed to get push token during device registration:", err);
      }
    } else {
      console.log("Skipping push token retrieval on Expo Go.");
    }

    // 3. Get device details
    const deviceName = Device.modelName || "Generic Device";
    const platform = Platform.OS;
    const now = new Date().toISOString();

    // 4. Parse user_id
    const parsedUserId = typeof userId === "string" ? parseInt(userId, 10) : userId;

    // 5. Perform UPSERT based on (user_id, device_id)
    const { data, error } = await supabase
      .from("user_devices")
      .upsert(
        {
          user_id: parsedUserId,
          device_id: deviceId,
          device_name: deviceName,
          platform: platform,
          push_token: pushToken,
          last_active_at: now,
          updated_at: now,
        },
        {
          onConflict: "user_id,device_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error registering user device in database:", error);
      throw error;
    }

    console.log("Device registered successfully in Supabase:", data);
    return data;
  } catch (err) {
    console.error("registerDevice flow failed:", err);
    throw err;
  }
};
