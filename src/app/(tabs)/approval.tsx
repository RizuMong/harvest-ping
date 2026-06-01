import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { useHarvestStore } from "@/store/harvest.store";

export default function ApprovalTabScreen() {
  const user = useAuthStore((state) => state.user);
  const requests = useHarvestStore((state) => state.requests);
  const fetchRequests = useHarvestStore((state) => state.fetchRequests);
  const loading = useHarvestStore((state) => state.loading);

  useEffect(() => {
    fetchRequests();
  }, []);

  const currentUserId = user?.id || "";

  // Filter requests that are:
  // 1. Status is 'submitted'
  // 2. Contains current user in approvalLines with status 'Waiting'
  const pendingApprovals = requests.filter((req) => {
    if (req.status !== "submitted") return false;
    
    // Find the current user's approval line
    const userLineIndex = req.approvalLines.findIndex(
      (line) => String(line.approverId) === String(currentUserId)
    );
    
    if (userLineIndex === -1) return false;
    
    // Ensure current user's line status is 'Waiting'
    const userLine = req.approvalLines[userLineIndex];
    if (userLine.status !== "Waiting") return false;

    // Optional: Sequential Approval Check
    // A user can only approve if all previous approvers in sequence have already 'Approved'
    const allPreviousApproved = req.approvalLines
      .slice(0, userLineIndex)
      .every((line) => line.status === "Approved");

    return allPreviousApproved;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Persetujuan Panen</Text>
      </View>

      {loading && pendingApprovals.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Memuat persetujuan...</Text>
        </View>
      ) : pendingApprovals.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBg}>
            <Ionicons name="checkbox-outline" size={36} color="#2E7D32" />
          </View>
          <Text style={styles.emptyTitle}>Semua Pengajuan Selesai</Text>
          <Text style={styles.emptySubtitle}>
            Tidak ada pengajuan selesai panen yang memerlukan tindakan persetujuan Anda saat ini.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionSubtitle}>
            Berikut adalah daftar pengajuan selesai panen dari mandor yang memerlukan persetujuan Anda.
          </Text>

          {pendingApprovals.map((req) => (
            <Pressable
              key={req.id}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push(`/approval/${req.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.schedulerTitle} numberOfLines={1}>
                  {req.schedulerTitle}
                </Text>
                <View style={styles.submittedBadge}>
                  <Text style={styles.submittedBadgeText}>Pending</Text>
                </View>
              </View>

              <Text style={styles.noteText} numberOfLines={2}>
                {req.note}
              </Text>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Diajukan Oleh</Text>
                  <Text style={styles.metaValue}>{req.userName}</Text>
                </View>

                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Tanggal Panen</Text>
                  <Text style={styles.metaValue}>{req.harvestDate}</Text>
                </View>

                <View style={styles.actionArrow}>
                  <Ionicons name="chevron-forward-circle" size={24} color="#2E7D32" />
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "#FFFFFF",
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#5F6368",
    fontWeight: "600",
  },
  emptyIconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  cardPressed: {
    backgroundColor: "#F9FAFB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  schedulerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    paddingRight: 10,
  },
  submittedBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#FFE0B2",
  },
  submittedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#E65100",
    textTransform: "uppercase",
  },
  noteText: {
    fontSize: 13,
    color: "#5F6368",
    lineHeight: 18,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaCol: {
    flexDirection: "column",
  },
  metaLabel: {
    fontSize: 9,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  actionArrow: {
    paddingLeft: 10,
  },
});
