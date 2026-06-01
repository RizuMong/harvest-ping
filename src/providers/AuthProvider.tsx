import { useEffect, useState } from "react";
import { router } from "expo-router";

import { getSession } from "@/services/storage.service";
import { useAuthStore } from "@/store/auth.store";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  const setUser = useAuthStore(
    (state) => state.setUser
  );

  useEffect(() => {
    const init = async () => {
      try {
        const session = await getSession();

        if (session) {
          setUser(session);
          setTimeout(() => {
            router.replace("/(tabs)/home");
          }, 100);
        } else {
          setTimeout(() => {
            router.replace("/(auth)/login");
          }, 100);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 100);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [setUser]);

  if (loading) return null;

  return children;
}