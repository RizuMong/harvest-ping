import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useHarvestStore } from "@/store/harvest.store";
import { useAuthStore } from "@/store/auth.store";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ApprovalDetailScreen() {
  const { id } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  const requests = useHarvestStore((state) => state.requests);
  const fetchRequests = useHarvestStore((state) => state.fetchRequests);
  const approveRequest = useHarvestStore((state) => state.approveRequest);
  const rejectRequest = useHarvestStore((state) => state.rejectRequest);
  const loading = useHarvestStore((state) => state.loading);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const request = requests.find((r) => r.id === id);

  if (loading && !request) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Memuat detail persetujuan...</Text>
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

  const handleApprove = () => {
    Alert.alert(
      "Setujui Pengajuan",
      "Apakah Anda yakin ingin menyetujui pengajuan selesai panen ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Setujui",
          onPress: async () => {
            setActionInProgress(true);
            try {
              await approveRequest(request.id, user?.id || "");
              Alert.alert("Sukses", "Pengajuan berhasil disetujui.");
              router.back();
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Gagal menyetujui pengajuan.");
            } finally {
              setActionInProgress(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectSubmit = async () => {
    if (!remarks.trim()) {
      Alert.alert("Catatan Wajib", "Harap masukkan alasan penolakan.");
      return;
    }

    setRejectModalVisible(false);
    setActionInProgress(true);
    try {
      await rejectRequest(request.id, user?.id || "", remarks.trim());
      Alert.alert("Sukses", "Pengajuan telah ditolak.");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Gagal menolak pengajuan.");
    } finally {
      setActionInProgress(false);
      setRemarks("");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </Pressable>
          <Text style={styles.headerTitle}>Konfirmasi Persetujuan</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Mandor Information Header */}
          <View style={styles.requesterCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {request.userName ? request.userName.substring(0, 2).toUpperCase() : "MP"}
              </Text>
            </View>
            <View style={styles.requesterInfo}>
              <Text style={styles.requesterName}>{request.userName}</Text>
              <Text style={styles.requesterRole}>Mandor Panen</Text>
            </View>
          </View>

          {/* Request Details */}
          <Text style={styles.sectionTitle}>Detail Panen</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Jadwal Panen</Text>
              <Text style={styles.detailValue}>{request.schedulerTitle}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tanggal Panen</Text>
              <Text style={styles.detailValue}>{request.harvestDate}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tanggal Diajukan</Text>
              <Text style={styles.detailValue}>{request.submissionDate}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.commentLabel}>Catatan Pengajuan (Note)</Text>
            <Text style={styles.noteText}>{request.note}</Text>
          </View>

          {/* Current Approval Sequence Status */}
          <Text style={styles.sectionTitle}>Alur Urutan Persetujuan</Text>
          <View style={styles.card}>
            {request.approvalLines.map((line, index) => (
              <View key={line.userId || line.approverId || `line-${index}`} style={styles.flowRow}>
                <View style={styles.flowLeft}>
                  <View
                    style={[
                      styles.flowStep,
                      line.status === "Approved" && styles.stepApproved,
                      line.status === "Rejected" && styles.stepRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.flowStepText,
                        line.status !== "Waiting" && { color: "#FFFFFF" },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={styles.flowApproverName}>{line.approverName}</Text>
                </View>
                <Text
                  style={[
                    styles.flowStatus,
                    line.status === "Approved" && { color: "#137333" },
                    line.status === "Rejected" && { color: "#C5221F" },
                  ]}
                >
                  {line.status}
                </Text>
              </View>
            ))}
          </View>

          {/* Action Button Row */}
          {actionInProgress ? (
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.btnReject,
                  pressed && styles.btnRejectPressed,
                ]}
                onPress={() => setRejectModalVisible(true)}
              >
                <Ionicons name="close-circle-outline" size={20} color="#C5221F" style={{ marginRight: 6 }} />
                <Text style={styles.btnRejectText}>Tolak Pengajuan</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.btnApprove,
                  pressed && styles.btnApprovePressed,
                ]}
                onPress={handleApprove}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnApproveText}>Setujui</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Reject Remarks Modal */}
        <Modal
          visible={rejectModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRejectModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Alasan Penolakan</Text>
                <Pressable onPress={() => setRejectModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#5F6368" />
                </Pressable>
              </View>

              <Text style={styles.modalDescription}>
                Tuliskan alasan atau catatan penolakan pengajuan selesai panen ini (wajib diisi).
              </Text>

              <TextInput
                style={styles.modalTextarea}
                placeholder="Catatan penolakan..."
                placeholderTextColor="#9CA3AF"
                multiline={true}
                numberOfLines={4}
                value={remarks}
                onChangeText={setRemarks}
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setRejectModalVisible(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Batal</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalBtn, styles.modalBtnSubmit]}
                  onPress={handleRejectSubmit}
                >
                  <Text style={styles.modalBtnSubmitText}>Kirim Penolakan</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  requesterCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E7D32",
  },
  requesterInfo: {
    justifyContent: "center",
  },
  requesterName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  requesterRole: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  commentLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 6,
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
  flowRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  flowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  flowStep: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepApproved: {
    backgroundColor: "#E6F4EA",
  },
  stepRejected: {
    backgroundColor: "#FCE8E6",
  },
  flowStepText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1A73E8",
  },
  flowApproverName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  flowStatus: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  btnReject: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCE8E6",
    backgroundColor: "#FFF5F5",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnRejectPressed: {
    backgroundColor: "#FCE8E6",
  },
  btnRejectText: {
    color: "#C5221F",
    fontSize: 14,
    fontWeight: "700",
  },
  btnApprove: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnApprovePressed: {
    backgroundColor: "#1B5E20",
  },
  btnApproveText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 340,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#202124",
  },
  modalDescription: {
    fontSize: 13,
    color: "#5F6368",
    lineHeight: 18,
    marginBottom: 16,
  },
  modalTextarea: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#DADCE0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#202124",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  modalBtnCancel: {
    backgroundColor: "#F1F3F4",
  },
  modalBtnCancelText: {
    color: "#5F6368",
    fontSize: 14,
    fontWeight: "600",
  },
  modalBtnSubmit: {
    backgroundColor: "#D93025",
  },
  modalBtnSubmitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
