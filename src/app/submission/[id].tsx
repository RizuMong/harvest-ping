import { APPROVAL_LINE_META, REQUEST_STATUS_BADGES } from "@/config/app.config";
import { useHarvestStore } from "@/store/harvest.store";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SubmissionDetailScreen() {
  const { id } = useLocalSearchParams();
  const requests = useHarvestStore((state) => state.requests);
  const fetchRequests = useHarvestStore((state) => state.fetchRequests);
  const loading = useHarvestStore((state) => state.loading);

  useEffect(() => {
    fetchRequests();
  }, []);

  const request = requests.find((r) => r.id === id);

  if (loading && !request) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Memuat detail pengajuan...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#D93025" />
        <Text style={styles.errorText}>Pengajuan tidak ditemukan</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const statusInfo =
    REQUEST_STATUS_BADGES[request.status] || REQUEST_STATUS_BADGES.submitted;

  // Generate dynamic timeline / activity log
  const timelineEvents = [
    {
      title: "Pengajuan Dikirim",
      subtitle: `Oleh ${request.userName || "Mandor Panen"}`,
      date: request.submissionDate,
      icon: "send",
      iconBg: "#E8F0FE",
      iconColor: "#1A73E8",
    },
    ...request.approvalLines
      .filter((l) => l.status !== "Waiting")
      .map((l) => {
        const lineMeta = APPROVAL_LINE_META[l.status];
        return {
          title: l.status === "Approved" ? "Disetujui" : "Ditolak",
          subtitle: `Oleh ${l.approverName}${l.remarks ? ` - "${l.remarks}"` : ""}`,
          date: l.actionDate || "—",
          icon: lineMeta.icon,
          iconBg: lineMeta.iconBg,
          iconColor: lineMeta.iconColor,
        };
      }),
  ];

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Detail Pengajuan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.schedulerTitle}>{request.schedulerTitle}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Details Grid */}
          <View style={styles.detailRow}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Tanggal Panen</Text>
              <Text style={styles.detailValue}>{request.harvestDate}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Tanggal Diajukan</Text>
              <Text style={styles.detailValue}>{request.submissionDate}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.detailLabel}>Catatan Panen (Note)</Text>
            <Text style={styles.noteText}>{request.note}</Text>
          </View>
        </View>

        {/* Approvals Section */}
        <Text style={styles.sectionTitle}>Status Persetujuan</Text>
        <View style={styles.card}>
          {request.approvalLines.length === 0 ? (
            <Text style={styles.emptyText}>Tidak ada alur persetujuan terkonfigurasi.</Text>
          ) : (
            request.approvalLines.map((line, index) => {
              const lineMeta = APPROVAL_LINE_META[line.status];
              return (
                <View
                  key={line.userId || line.approverId || `line-${index}`}
                  style={[
                    styles.approverRow,
                    index === request.approvalLines.length - 1 && styles.lastApproverRow,
                  ]}
                >
                  <View style={styles.approverLeft}>
                    <View style={[styles.lineIcon, { backgroundColor: lineMeta.iconBg }]}> 
                      <Ionicons name={lineMeta.icon as any} size={20} color={lineMeta.iconColor} />
                    </View>
                    <View style={styles.approverInfo}>
                      <Text style={styles.approverName}>{line.approverName}</Text>
                      {line.actionDate && (
                        <Text style={styles.actionDate}>Pada: {line.actionDate}</Text>
                      )}
                      {line.remarks && (
                        <Text style={styles.remarksText}>Catatan: "{line.remarks}"</Text>
                      )}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.lineStatusText,
                      line.status === "Approved" && { color: "#137333" },
                      line.status === "Rejected" && { color: "#C5221F" },
                      line.status === "Waiting" && { color: "#1A73E8" },
                    ]}
                  >
                    {line.status}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Timeline Section */}
        <Text style={styles.sectionTitle}>Aktivitas & Timeline</Text>
        <View style={styles.card}>
          {timelineEvents.map((event, index) => (
            <View key={index} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineIconBg, { backgroundColor: event.iconBg }]}>
                  <Ionicons name={event.icon as any} size={14} color={event.iconColor} />
                </View>
                {index < timelineEvents.length - 1 && <View style={styles.timelineConnector} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{event.title}</Text>
                <Text style={styles.timelineSubtitle}>{event.subtitle}</Text>
                <Text style={styles.timelineDate}>{event.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#5F6368",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  schedulerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    paddingRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  inputGroup: {
    marginTop: 4,
  },
  noteText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  approverRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  lastApproverRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  approverLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    paddingRight: 10,
  },
  lineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  approverInfo: {
    marginLeft: 10,
    flex: 1,
  },
  approverName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  actionDate: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  remarksText: {
    fontSize: 12,
    color: "#C5221F",
    marginTop: 4,
    fontStyle: "italic",
    fontWeight: "500",
  },
  lineStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 12,
    width: 24,
  },
  timelineIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  timelineConnector: {
    width: 2,
    backgroundColor: "#E5E7EB",
    position: "absolute",
    top: 24,
    bottom: -24,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  timelineSubtitle: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 2,
  },
  timelineDate: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginVertical: 12,
  },
});
