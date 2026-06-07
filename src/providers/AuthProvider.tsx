import { useEffect, useState } from "react";
import { router, useSegments } from "expo-router";

import { getSession } from "@/services/storage.service";
import { useAuthStore } from "@/store/auth.store";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await getSession();

        if (session) {
          // Normalise stale sessions that stored full_name instead of name
          const normalised = {
            ...session,
            name: session.name || session.full_name || session.nrp || "",
            id: String(session.id),
            role_id: session.role_id !== undefined ? Number(session.role_id) : (session.role === "admin" ? 1 : 2),
          };
          setUser(normalised);
        } else {
          const inAuthGroup = segments[0] === "(auth)";
          if (!inAuthGroup) {
            setTimeout(() => {
              router.replace("/(auth)/login");
            }, 100);
          }
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
  }, [setUser, segments]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user) {
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    } else {
      if (inAuthGroup) {
        router.replace("/(tabs)/home");
      } else {
        const path = segments.join("/");

        if (user.role_id === 2) {
          // Mandor cannot access PGS screens
          const isPgsOnly =
            path.includes("(tabs)/reminder") ||
            path.includes("reminder/create") ||
            path.includes("(tabs)/scheduler") ||
            path.includes("(tabs)/approval") ||
            path.startsWith("approval") ||
            path.includes("settings/employee-list") ||
            path.includes("settings/approval-config") ||
            path.includes("reminder/history");

          if (isPgsOnly) {
            router.replace("/(tabs)/home");
          }
        } else if (user.role_id === 1) {
          // PGS cannot access Mandor only screens
          const isMandorOnly =
            path.includes("(tabs)/request") ||
            path.includes("submission/create") ||
            path.includes("(tabs)/inbox");

          if (isMandorOnly) {
            router.replace("/(tabs)/home");
          }
        }
      }
    }
  }, [user, segments, loading]);

  if (loading) return null;

  return children;
}