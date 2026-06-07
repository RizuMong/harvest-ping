import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
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

  const displayName = user?.name || "";

  // Calculate unread notifications count for badge
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [allAppsVisible, setAllAppsVisible] = useState(false);

  const rawActions = HOME_QUICK_ACTIONS.map((item) => ({
    ...item,
    badge:
      item.id === "inbox"
        ? unreadCount || undefined
        : item.id === "approval"
        ? pendingApprovals.length || undefined
        : undefined,
    onPress: () => router.push(item.route),
  }));

  const limitExceeded = rawActions.length > 6;
  const displayedActions = limitExceeded
    ? [
        ...rawActions.slice(0, 5),
        {
          id: "all-apps",
          label: "Semua Fitur",
          icon: "grid-outline",
          bgColor: "#E8F5E9",
          iconColor: "#2E7D32",
          badge: undefined,
          onPress: () => setAllAppsVisible(true),
        },
      ]
    : rawActions;

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
            {displayedActions.map((action) => (
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
      </ScrollView>

      {/* All Apps Modal */}
      <Modal
        visible={allAppsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAllAppsVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAllAppsVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Semua Fitur</Text>
              <Pressable onPress={() => setAllAppsVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#5F6368" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Pressable style={styles.modalGrid}>
                {rawActions.map((action) => (
                  <Pressable
                    key={action.id}
                    style={({ pressed }) => [
                      styles.modalGridItem,
                      pressed && styles.gridItemPressed,
                    ]}
                    onPress={() => {
                      setAllAppsVisible(false);
                      action.onPress();
                    }}
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
              </Pressable>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  closeBtn: {
    padding: 4,
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingBottom: 24,
  },
  modalGridItem: {
    width: "33.33%",
    alignItems: "center",
    marginVertical: 14,
  },
});
