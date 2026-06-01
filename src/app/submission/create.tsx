import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { REQUEST_STATUS_BADGES } from "@/config/app.config";
import { useAuthStore } from "@/store/auth.store";
import { FinishHarvestRequest, useHarvestStore } from "@/store/harvest.store";

export default function CreateSubmissionScreen() {
  const user = useAuthStore((state) => state.user);
  const schedulers = useHarvestStore((state) => state.schedulers);
  const requests = useHarvestStore((state) => state.requests);
  const fetchSchedulers = useHarvestStore((state) => state.fetchSchedulers);
  const fetchRequests = useHarvestStore((state) => state.fetchRequests);
  const createRequest = useHarvestStore((state) => state.createRequest);

  // Form states
  const [selectedSchedulerId, setSelectedSchedulerId] = useState("");
  const [selectedSchedulerTitle, setSelectedSchedulerTitle] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Searchable Dropdown state
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Custom Date Picker Modal state
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Segment Tab State: "create" or "history"
  const [activeSegment, setActiveSegment] = useState<"create" | "history">("create");

  // Fetch data on mount
  useEffect(() => {
    fetchSchedulers();
    fetchRequests();
  }, []);

  const handleSelectScheduler = (id: string, title: string) => {
    setSelectedSchedulerId(id);
    setSelectedSchedulerTitle(title);
    setDropdownVisible(false);
  };

  const filteredSchedulers = schedulers.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Custom Date Picker confirmation
  const handleConfirmDate = () => {
    const formattedDay = String(selectedDay).padStart(2, "0");
    const formattedMonth = String(selectedMonth).padStart(2, "0");
    const dateStr = `${selectedYear}-${formattedMonth}-${formattedDay}`;
    setHarvestDate(dateStr);
    setDateModalVisible(false);
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!selectedSchedulerId) {
      Alert.alert("Error", "Harap pilih Jadwal Panen (Scheduler)");
      return;
    }
    if (!harvestDate) {
      Alert.alert("Error", "Harap tentukan Tanggal Panen");
      return;
    }
    if (!note.trim()) {
      Alert.alert("Error", "Catatan panen wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const uId = user?.id || "1";
      const uName = user?.name || "Mandor Panen";

      await createRequest(selectedSchedulerId, harvestDate, note.trim(), uId, uName);

      Alert.alert("Sukses", "Pengajuan selesai panen berhasil dikirim!");

      // Reset form
      setSelectedSchedulerId("");
      setSelectedSchedulerTitle("");
      setHarvestDate("");
      setNote("");

      // Redirect to history tab
      setActiveSegment("history");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", "Gagal mengirim pengajuan");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) =>
    REQUEST_STATUS_BADGES[status as keyof typeof REQUEST_STATUS_BADGES] ||
    REQUEST_STATUS_BADGES.submitted;

  // Get approval sequence progress text
  const getApprovalProgress = (req: FinishHarvestRequest) => {
    const total = req.approvalLines.length;
    const approved = req.approvalLines.filter((l) => l.status === "Approved").length;
    return `${approved}/${total} Approved`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Segmented Top Header */}
        <View style={styles.segmentContainer}>
          <Pressable
            style={[styles.segmentButton, activeSegment === "create" && styles.activeSegmentButton]}
            onPress={() => setActiveSegment("create")}
          >
            <Ionicons
              name="add-circle-outline"
              size={18}
              color={activeSegment === "create" ? "#2E7D32" : "#5F6368"}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.segmentText, activeSegment === "create" && styles.activeSegmentText]}>
              Buat Pengajuan
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentButton, activeSegment === "history" && styles.activeSegmentButton]}
            onPress={() => setActiveSegment("history")}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={activeSegment === "history" ? "#2E7D32" : "#5F6368"}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.segmentText, activeSegment === "history" && styles.activeSegmentText]}>
              Riwayat
            </Text>
          </Pressable>
        </View>

        {activeSegment === "create" ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.screenSubtitle}>
              Lengkapi detail panen di bawah ini untuk mengajukan selesai panen ke sistem persetujuan.
            </Text>

            {/* Schedulers Searchable Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Jadwal Panen<Text style={{ color: "#D93025" }}>*</Text></Text>
              <Pressable
                style={styles.dropdownTrigger}
                onPress={() => setDropdownVisible(true)}
              >
                <Text
                  style={[
                    styles.dropdownTriggerText,
                    !selectedSchedulerTitle && { color: "#9CA3AF" },
                  ]}
                  numberOfLines={1}
                >
                  {selectedSchedulerTitle || "Pilih Jadwal Panen..."}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#5F6368" />
              </Pressable>
            </View>

            {/* Harvest Date Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tanggal Panen <Text style={{ color: "#D93025" }}>*</Text></Text>
              <Pressable
                style={styles.dropdownTrigger}
                onPress={() => setDateModalVisible(true)}
              >
                <Text
                  style={[
                    styles.dropdownTriggerText,
                    !harvestDate && { color: "#9CA3AF" },
                  ]}
                >
                  {harvestDate || "Pilih Tanggal Panen..."}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#5F6368" />
              </Pressable>
            </View>

            {/* Note Area */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Catatan Panen<Text style={{ color: "#D93025" }}>*</Text></Text>
              <TextInput
                style={styles.textarea}
                placeholder="Tuliskan catatan detail panen (contoh: Hasil blok A, jumlah janjang sawit)..."
                placeholderTextColor="#9CA3AF"
                multiline={true}
                numberOfLines={4}
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Submit Action */}
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.submitBtnPressed,
                submitting && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Kirim Pengajuan</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        ) : (
          /* Submission History list */
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {requests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="newspaper-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Belum ada riwayat pengajuan</Text>
                <Text style={styles.emptySubtext}>
                  Pengajuan selesai panen yang Anda kirim akan terekam di sini.
                </Text>
              </View>
            ) : (
              requests.map((req) => {
                const statusInfo = getStatusBadge(req.status);
                return (
                  <Pressable
                    key={req.id}
                    style={({ pressed }) => [
                      styles.historyCard,
                      pressed && styles.historyCardPressed,
                    ]}
                    onPress={() => router.push(`/submission/${req.id}`)}
                  >
                    <View style={styles.historyCardHeader}>
                      <Text style={styles.historySchedulerTitle} numberOfLines={1}>
                        {req.schedulerTitle}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.historyNote} numberOfLines={2}>
                      {req.note}
                    </Text>

                    <View style={styles.historyFooter}>
                      <View style={styles.footerCol}>
                        <Text style={styles.historyLabel}>Tgl Panen</Text>
                        <Text style={styles.historyValue}>{req.harvestDate}</Text>
                      </View>

                      <View style={styles.footerCol}>
                        <Text style={styles.historyLabel}>Diajukan</Text>
                        <Text style={styles.historyValue}>{req.submissionDate}</Text>
                      </View>

                      <View style={[styles.progressBadge]}>
                        <Ionicons name="people-outline" size={12} color="#5F6368" style={{ marginRight: 4 }} />
                        <Text style={styles.progressText}>{getApprovalProgress(req)}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Schedulers Searchable Dropdown Modal */}
        <Modal
          visible={dropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pilih Jadwal Panen</Text>
                <Pressable onPress={() => setDropdownVisible(false)}>
                  <Ionicons name="close" size={24} color="#5F6368" />
                </Pressable>
              </View>

              <View style={styles.searchBarWrapper}>
                <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari jadwal panen..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={true}>
                {filteredSchedulers.length === 0 ? (
                  <Text style={styles.noResultsText}>Tidak ada jadwal panen ditemukan.</Text>
                ) : (
                  filteredSchedulers.map((s) => (
                    <Pressable
                      key={s.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectScheduler(s.id, s.title)}
                    >
                      <Ionicons name="time-outline" size={16} color="#2E7D32" style={{ marginRight: 10 }} />
                      <Text style={styles.dropdownItemText}>{s.title}</Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Custom Premium Date Picker Modal */}
        <Modal
          visible={dateModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dateModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tentukan Tanggal Panen</Text>
                <Pressable onPress={() => setDateModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#5F6368" />
                </Pressable>
              </View>

              <View style={styles.datePickersRow}>
                {/* Day Input */}
                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>Hari</Text>
                  <TextInput
                    style={styles.dateInput}
                    keyboardType="numeric"
                    maxLength={2}
                    value={String(selectedDay)}
                    onChangeText={(text) => {
                      const val = parseInt(text, 10);
                      if (!isNaN(val) && val >= 1 && val <= 31) setSelectedDay(val);
                      else if (text === "") setSelectedDay(1);
                    }}
                  />
                </View>

                {/* Month Input */}
                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>Bulan (1-12)</Text>
                  <TextInput
                    style={styles.dateInput}
                    keyboardType="numeric"
                    maxLength={2}
                    value={String(selectedMonth)}
                    onChangeText={(text) => {
                      const val = parseInt(text, 10);
                      if (!isNaN(val) && val >= 1 && val <= 12) setSelectedMonth(val);
                      else if (text === "") setSelectedMonth(1);
                    }}
                  />
                </View>

                {/* Year Input */}
                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>Tahun</Text>
                  <TextInput
                    style={styles.dateInput}
                    keyboardType="numeric"
                    maxLength={4}
                    value={String(selectedYear)}
                    onChangeText={(text) => {
                      const val = parseInt(text, 10);
                      if (!isNaN(val)) setSelectedYear(val);
                      else if (text === "") setSelectedYear(new Date().getFullYear());
                    }}
                  />
                </View>
              </View>

              <Pressable style={styles.dateConfirmBtn} onPress={handleConfirmDate}>
                <Text style={styles.dateConfirmBtnText}>Konfirmasi Tanggal</Text>
              </Pressable>
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
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 4,
  },
  activeSegmentButton: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  segmentText: {
    fontSize: 13,
    color: "#5F6368",
    fontWeight: "600",
  },
  activeSegmentText: {
    color: "#2E7D32",
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  screenSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADCE0",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: "#202124",
    flex: 1,
    paddingRight: 10,
  },
  textarea: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADCE0",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#202124",
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#1B5E20",
  },
  submitBtnPressed: {
    backgroundColor: "#1B5E20",
    opacity: 0.9,
  },
  submitBtnDisabled: {
    backgroundColor: "#9CA3AF",
    borderColor: "#9CA3AF",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
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
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  historyCardPressed: {
    backgroundColor: "#F9FAFB",
  },
  historyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  historySchedulerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    paddingRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  historyNote: {
    fontSize: 13,
    color: "#5F6368",
    lineHeight: 18,
    marginBottom: 14,
  },
  historyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  footerCol: {
    flexDirection: "column",
  },
  historyLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  historyValue: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  progressBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 380,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#202124",
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#202124",
    padding: 0,
  },
  dropdownList: {
    marginVertical: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#202124",
    fontWeight: "500",
  },
  noResultsText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginVertical: 20,
  },
  dateModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 340,
  },
  datePickersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  dateCol: {
    flex: 1,
    flexDirection: "column",
  },
  dateColLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5F6368",
    marginBottom: 6,
    textAlign: "center",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#DADCE0",
    borderRadius: 8,
    height: 44,
    fontSize: 16,
    color: "#202124",
    textAlign: "center",
    backgroundColor: "#F9FAFB",
    fontWeight: "700",
  },
  dateConfirmBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  dateConfirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
