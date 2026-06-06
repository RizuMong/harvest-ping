import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";

interface DBNotification {
  id: string;
  title: string;
  message: string;
  priority: string;
  is_acknowledged: boolean;
  created_at: string;
  updated_at: string;
  receiver_id: number;
  master_user?: {
    full_name: string;
    nrp: string;
  } | {
    full_name: string;
    nrp: string;
  }[];
}

export default function NotificationHistoryScreen() {
  const [reminders, setReminders] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"All" | "Confirmed" | "Pending">("All");

  const fetchHistory = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // 1. Fetch user mapping
      const { data: usersData, error: usersError } = await supabase
        .from("master_user")
        .select("id, full_name, nrp");

      if (usersError) {
        console.error("Error fetching users:", usersError);
      }

      // 2. Fetch reminders with explicit working columns
      const { data: remindersData, error: remindersError } = await supabase
        .from("t_ping_reminder")
        .select("id, title, message, priority, is_acknowledged, created_at, receiver_id")
        .order("created_at", { ascending: false });

      if (remindersError) {
        console.error("Error fetching reminders raw data:", remindersError);
        throw remindersError;
      }

      // Console logging for verification
      console.log("remindersData returned:", remindersData);
      if (Array.isArray(remindersData) && remindersData.length > 0) {
        console.log("First reminder record keys:", Object.keys(remindersData[0]));
        console.log("First reminder record:", remindersData[0]);
      }

      if (Array.isArray(remindersData)) {
        // Map user data in-memory
        const userMap = new Map((usersData || []).map((u: any) => [String(u?.id), u]));
        const mapped = remindersData.map((row: any) => {
          if (!row) return null;

          // Check if updated_at or acknowledged_at or any confirmation field is present
          const hasUpdatedAt = "updated_at" in row;
          const confirmationTime = hasUpdatedAt ? row.updated_at : (row.acknowledged_at || row.confirmed_at || null);

          return {
            id: String(row.id),
            title: row.title || "-",
            message: row.message || "-",
            priority: row.priority || "Normal",
            is_acknowledged: !!row.is_acknowledged,
            created_at: row.created_at || null,
            updated_at: confirmationTime,
            receiver_id: row.receiver_id ? Number(row.receiver_id) : 0,
            master_user: userMap.get(String(row.receiver_id)) || undefined,
          };
        }).filter(Boolean) as DBNotification[];
        setReminders(mapped);
      } else {
        setReminders([]);
      }
    } catch (err) {
      console.error("Error fetching notification history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter list based on selection
  const filteredReminders = reminders.filter((item) => {
    if (activeFilter === "Confirmed") return item.is_acknowledged;
    if (activeFilter === "Pending") return !item.is_acknowledged;
    return true;
  });

  // Calculate stats
  const totalCount = reminders.length;
  const confirmedCount = reminders.filter((r) => r.is_acknowledged).length;
  const pendingCount = totalCount - confirmedCount;

  // Formatting date/time helper
  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return `${date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} ${date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  // Styling helper for priorities
  const getPriorityStyle = (priority: string) => {
    const p = priority?.toLowerCase();
    if (p === "tinggi" || p === "high") {
      return {
        bg: "#FCE8E6",
        text: "#D93025",
        border: "#FAD2CF",
        label: "Tinggi",
      };
    }
    if (p === "rendah" || p === "low") {
      return {
        bg: "#E8F0FE",
        text: "#1A73E8",
        border: "#D2E3FC",
        label: "Rendah",
      };
    }
    return {
      bg: "#FEF7E0",
      text: "#B06000",
      border: "#FEEFC3",
      label: "Normal",
    };
  };

  const renderItem = ({ item }: { item: DBNotification }) => {
    const pStyle = getPriorityStyle(item.priority);
    const mu = Array.isArray(item.master_user) ? item.master_user[0] : item.master_user;
    const receiverName = mu?.full_name || "Unknown";
    const receiverNrp = mu?.nrp || "-";

    return (
      <View style={styles.card}>
        {/* Header line: receiver & priority */}
        <View style={styles.cardHeader}>
          <View style={styles.receiverInfo}>
            <Ionicons name="person-circle-outline" size={20} color="#5F6368" style={{ marginRight: 6 }} />
            <View>
              <Text style={styles.receiverNameText}>{receiverName}</Text>
              <Text style={styles.receiverNrpText}>NRP: {receiverNrp}</Text>
            </View>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: pStyle.bg, borderColor: pStyle.border }]}>
            <Text style={[styles.priorityText, { color: pStyle.text }]}>{pStyle.label}</Text>
          </View>
        </View>

        {/* Title & Message */}
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifMessage}>{item.message}</Text>

        {/* Footer info: dates & status badge */}
        <View style={styles.cardFooter}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Dikirim:</Text>
            <Text style={styles.dateValue}>{formatDateTime(item.created_at)}</Text>
          </View>

          {item.is_acknowledged ? (
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Dikonfirmasi:</Text>
              <Text style={styles.dateValue}>{formatDateTime(item.updated_at)}</Text>
            </View>
          ) : (
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Dikonfirmasi:</Text>
              <Text style={[styles.dateValue, { color: "#EA8635" }]}>Menunggu...</Text>
            </View>
          )}
        </View>

        <View style={styles.statusRow}>
          {item.is_acknowledged ? (
            <View style={[styles.statusBadge, styles.statusConfirmed]}>
              <Ionicons name="checkmark-circle" size={14} color="#137333" style={{ marginRight: 4 }} />
              <Text style={styles.statusConfirmedText}>Diterima / Dibaca</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.statusPending]}>
              <Ionicons name="time" size={14} color="#B06000" style={{ marginRight: 4 }} />
              <Text style={styles.statusPendingText}>Pending</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </Pressable>
          <Text style={styles.headerTitle}>Rekap Riwayat Pengingat</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { borderColor: "#D2E3FC", backgroundColor: "#F8FAFD" }]}>
            <Text style={[styles.summaryValue, { color: "#1A73E8" }]}>{totalCount}</Text>
            <Text style={styles.summaryLabel}>Total Kirim</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: "#CEEAD6", backgroundColor: "#F4FAF5" }]}>
            <Text style={[styles.summaryValue, { color: "#137333" }]}>{confirmedCount}</Text>
            <Text style={styles.summaryLabel}>Diterima</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: "#FFE0B2", backgroundColor: "#FFFBF2" }]}>
            <Text style={[styles.summaryValue, { color: "#E65100" }]}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <Pressable
            style={[styles.filterTab, activeFilter === "All" && styles.filterTabActive]}
            onPress={() => setActiveFilter("All")}
          >
            <Text style={[styles.filterTabText, activeFilter === "All" && styles.filterTabTextActive]}>Semua</Text>
          </Pressable>
          <Pressable
            style={[styles.filterTab, activeFilter === "Confirmed" && styles.filterTabActive]}
            onPress={() => setActiveFilter("Confirmed")}
          >
            <Text style={[styles.filterTabText, activeFilter === "Confirmed" && styles.filterTabTextActive]}>
              Diterima
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterTab, activeFilter === "Pending" && styles.filterTabActive]}
            onPress={() => setActiveFilter("Pending")}
          >
            <Text style={[styles.filterTabText, activeFilter === "Pending" && styles.filterTabTextActive]}>
              Pending
            </Text>
          </Pressable>
        </View>

        {/* List Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : filteredReminders.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Tidak ada riwayat ditemukan</Text>
            <Text style={styles.emptySubtext}>Daftar riwayat pengingat Anda akan muncul di sini.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredReminders}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchHistory(true)}
                colors={["#2E7D32"]}
                tintColor="#2E7D32"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerBackBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  summaryContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 3,
    borderColor: "transparent",
  },
  filterTabActive: {
    borderColor: "#2E7D32",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterTabTextActive: {
    color: "#2E7D32",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 10,
  },
  receiverInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  receiverNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  receiverNrpText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 1,
  },
  priorityBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  notifMessage: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusConfirmed: {
    backgroundColor: "#E6F4EA",
  },
  statusConfirmedText: {
    color: "#137333",
    fontSize: 11,
    fontWeight: "700",
  },
  statusPending: {
    backgroundColor: "#FEF7E0",
  },
  statusPendingText: {
    color: "#B06000",
    fontSize: 11,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
