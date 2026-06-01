import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HOME_QUICK_ACTIONS } from "@/config/app.config";
import { getPendingApprovals } from "@/shared/utils/approval.utils";
import { useAuthStore } from "@/store/auth.store";
import { useHarvestStore } from "@/store/harvest.store";
import { useNotificationStore } from "@/store/notification.store";

function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.notifications);
  const requests = useHarvestStore((state) => state.requests);
  const fetchRequests = useHarvestStore((state) => state.fetchRequests);

  // Fetch requests on mount
  useEffect(() => {
    fetchRequests();
  }, []);

  const currentUserId = user?.id || "";
  const pendingApprovals = getPendingApprovals(requests, currentUserId);

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Good morning,";
    if (hour < 15) return "Good afternoon,";
    if (hour < 19) return "Good evening,";
    return "Good night,";
  };

  // Format today's date to match "Mon, 01 Jun 2026"
  const formattedDate = dayjs().format("ddd, DD MMM YYYY");

  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "RP";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const displayName = user?.name || "Rizki Haddi Prayoga";

  // Calculate unread notifications count for badge
  const unreadCount = notifications.filter((n) => !n.read).length;

  const quickActions = HOME_QUICK_ACTIONS.map((item) => ({
    ...item,
    badge:
      item.id === "inbox"
        ? unreadCount || undefined
        : item.id === "approval"
        ? pendingApprovals.length || undefined
        : undefined,
    onPress: () => router.push(item.route as any),
  }));

  // Show top 3 notifications in the home page
  const homeAnnouncements = notifications.slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
            <View style={styles.userTextContainer}>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.userNameText} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
          </View>
        </View>

        {/* Today's Date Banner */}
        <View style={styles.dateBanner}>
          <Ionicons name="calendar-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Quick Actions Card Grid */}
        <View style={styles.actionsCard}>
          <View style={styles.gridContainer}>
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                style={({ pressed }) => [
                  styles.gridItem,
                  pressed && styles.gridItemPressed,
                ]}
                onPress={action.onPress}
              >
                <View style={[styles.iconContainer, { backgroundColor: action.bgColor }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.iconColor} />
                  {action.badge && (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>{action.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.gridLabel} numberOfLines={2}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Announcements/Notifications Card */}
        <View style={styles.announcementsCard}>
          <View style={styles.announcementsHeader}>
            <Text style={styles.announcementsTitle}>Pengumuman & Pengingat</Text>
            <Pressable onPress={() => router.push("/(tabs)/inbox")}>
              <Text style={styles.viewAllText}>View all</Text>
            </Pressable>
          </View>

          <View style={styles.announcementsList}>
            {homeAnnouncements.length === 0 ? (
              <Text style={styles.emptyText}>Belum ada pengumuman masuk.</Text>
            ) : (
              homeAnnouncements.map((announcement, index) => (
                <View
                  key={announcement.id}
                  style={[
                    styles.announcementItem,
                    index === homeAnnouncements.length - 1 && styles.lastAnnouncementItem,
                  ]}
                >
                  <View style={styles.announcementHeaderRow}>
                    <Text style={styles.announcementItemTitle} numberOfLines={2}>
                      {announcement.title}
                    </Text>
                    <Text style={styles.announcementDate}>{announcement.date}</Text>
                  </View>
                  <View style={styles.announcementAuthorRow}>
                    <View style={styles.authorAvatar}>
                      <Text style={styles.authorAvatarText}>{announcement.senderInitials}</Text>
                    </View>
                    <Text style={styles.announcementAuthorName}>{announcement.sender}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6", // Slightly darker gray background
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#2E7D32",
    fontSize: 15,
    fontWeight: "700",
  },
  userTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  greetingText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 1,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: Platform.OS === "ios" ? "System" : "normal",
  },
  dateBanner: {
    backgroundColor: "#2E7D32", // Riper, rich green (no shadow)
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1B5E20",
  },
  dateText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  actionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB", // Clear border instead of shadow
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  gridItem: {
    width: "33.33%",
    alignItems: "center",
    marginVertical: 12,
  },
  gridItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  announcementsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB", // Clear border instead of shadow
  },
  announcementsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  announcementsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  viewAllText: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "600",
  },
  announcementsList: {
    width: "100%",
  },
  announcementItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  lastAnnouncementItem: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  announcementHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  announcementItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    paddingRight: 16,
    lineHeight: 20,
  },
  announcementDate: {
    fontSize: 11,
    color: "#6B7280",
  },
  announcementAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  authorAvatarText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6B7280",
  },
  announcementAuthorName: {
    fontSize: 12,
    color: "#6B7280",
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginVertical: 16,
  },
});
