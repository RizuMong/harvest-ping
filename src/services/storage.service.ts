import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "harvestping_user";

export const saveSession = async (user: any) => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify(user));
    }
    return;
  }
  await SecureStore.setItemAsync(
    KEY,
    JSON.stringify(user)
  );
};

export const getSession = async () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem(KEY);
      return session ? JSON.parse(session) : null;
    }
    return null;
  }
  const session = await SecureStore.getItemAsync(KEY);

  return session ? JSON.parse(session) : null;
};

export const clearSession = async () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      localStorage.removeItem(KEY);
    }
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
};