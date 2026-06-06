import { PRIORITY_BADGE_STYLES } from "@/config/app.config";
import { useAuthStore } from "@/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { fetchUsers } from "@/services/user.service";
import { fetchSchedules, createSchedules, deleteSchedules, ScheduleRow } from "@/services/scheduler.service";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ScheduleRow and formatting helpers now imported from scheduler.service.ts

interface DBUser {
  id: string;
  full_name: string;
  nrp: string;
}

const scheduleTypes = ["Panen", "Perawatan"] as const;
const priorityOptions = ["Rendah", "Normal", "Tinggi"] as const;

const parseScheduleType = (title: string | null) => {
  if (!title) return "-";
  if (title.startsWith("Panen - ")) return "Panen";
  if (title.startsWith("Perawatan - ")) return "Perawatan";
  if (title.toLowerCase().includes("panen")) return "Panen";
  if (title.toLowerCase().includes("perawatan")) return "Perawatan";
  return "-";
};

const stripTypeFromTitle = (title: string | null) => {
  if (!title) return "";
  if (title.startsWith("Panen - ")) return title.substring(8);
  if (title.startsWith("Perawatan - ")) return title.substring(13);
  return title;
};

export default function SchedulerScreen() {
  const user = useAuthStore((state) => state.user);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);

  const [scheduleType, setScheduleType] = useState<typeof scheduleTypes[number]>("Panen");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pingTime, setPingTime] = useState("07:00");
  const [priority, setPriority] = useState<typeof priorityOptions[number]>("Normal");
  const [selectedReceiverIds, setSelectedReceiverIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [activeDateField, setActiveDateField] = useState<"start" | "end">("start");
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentViewMonth, setCurrentViewMonth] = useState(new Date().getMonth() + 1);
  const [currentViewYear, setCurrentViewYear] = useState(new Date().getFullYear());

  const handleConfirmDate = () => {
    const formattedDay = String(selectedDay).padStart(2, "0");
    const formattedMonth = String(selectedMonth).padStart(2, "0");
    const dateStr = `${selectedYear}-${formattedMonth}-${formattedDay}`;
    if (activeDateField === "start") {
      setStartDate(dateStr);
    } else {
      setEndDate(dateStr);
    }
    setDateModalVisible(false);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentViewMonth === 1) {
      setCurrentViewMonth(12);
      setCurrentViewYear((y) => y - 1);
    } else {
      setCurrentViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentViewMonth === 12) {
      setCurrentViewMonth(1);
      setCurrentViewYear((y) => y + 1);
    } else {
      setCurrentViewMonth((m) => m + 1);
    }
  };

// Formatting helpers now imported from scheduler.service.ts

  const translateError = (msg: string | null | undefined) => {
    if (!msg) return "Terjadi kesalahan yang tidak diketahui.";
    const lower = msg.toLowerCase();
    if (lower.includes("violates foreign key constraint")) {
      return "Jadwal tidak dapat dihapus karena masih digunakan dalam riwayat atau pengajuan selesai panen.";
    }
    if (lower.includes("duplicate key")) {
      return "Data sudah terdaftar di sistem.";
    }
    if (lower.includes("invalid input syntax") || lower.includes("invalid syntax")) {
      return "Format input data tidak valid.";
    }
    if (lower.includes("permission denied")) {
      return "Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.";
    }
    if (lower.includes("network")) {
      return "Masalah jaringan. Harap periksa koneksi internet Anda.";
    }
    return msg;
  };

  const handlePingTimeChange = (text: string) => {
    const numOnly = text.replace(/\D/g, "");
    if (numOnly.length === 0) {
      setPingTime("");
      return;
    }

    let hours = numOnly.slice(0, 2);
    let minutes = numOnly.slice(2, 4);

    if (hours.length === 2) {
      const hr = parseInt(hours, 10);
      if (hr > 23) {
        hours = "23";
      }
    }
    if (minutes.length >= 1) {
      const firstDigit = parseInt(minutes[0], 10);
      if (firstDigit > 5) {
        minutes = "5" + (minutes[1] || "");
      }
    }

    let formatted = hours;
    if (numOnly.length > 2) {
      formatted += ":" + minutes;
    }
    setPingTime(formatted);
  };

  useEffect(() => {
    loadSchedules();
    loadUsers();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const data = await fetchSchedules();
      setSchedules(data);
    } catch (err: any) {
      console.error("fetchSchedules error:", err);
      Alert.alert("Error", err.message || "Gagal memuat jadwal.");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error("loadUsers catch:", err);
    }
  };

  const userMap = useMemo(() => {
    return users.reduce<Record<string, string>>((acc, user) => {
      acc[user.id] = user.full_name;
      return acc;
    }, {});
  }, [users]);

  const availableUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(query) ||
        u.nrp.toLowerCase().includes(query)
    );
  }, [userSearch, users]);

  const toggleReceiverSelection = (id: string) => {
    setSelectedReceiverIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleScheduleSelection = (id: string) => {
    setSelectedScheduleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setScheduleType("Panen");
    setTitle("");
    setMessage("");
    setStartDate("");
    setEndDate("");
    setPingTime("07:00");
    setPriority("Normal");
    setSelectedReceiverIds([]);
    setUserSearch("");
  };

  const handleSaveSchedule = async () => {
    if (!title.trim() || !message.trim() || !startDate.trim() || !endDate.trim() || !pingTime.trim()) {
      Alert.alert("Gagal", "Semua kolom harus diisi.");
      return;
    }
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(pingTime.trim())) {
      Alert.alert("Gagal", "Format waktu tidak valid. Gunakan HH:mm (contoh: 07:00)");
      return;
    }
    if (selectedReceiverIds.length === 0) {
      Alert.alert("Gagal", "Pilih minimal satu penerima.");
      return;
    }

    setSaveLoading(true);
    const creatorId = user?.id ? parseInt(user.id, 10) : 1;
    
    // Format to ISO string for timestamptz and append :00+07 for timetz
    const isoStartDate = new Date(`${startDate.trim()}T00:00:00`).toISOString();
    const isoEndDate = new Date(`${endDate.trim()}T00:00:00`).toISOString();
    const formattedPingTime = `${pingTime.trim()}:00+07`;

    const rows = selectedReceiverIds.map((receiver_id) => ({
      receiver_id: parseInt(receiver_id, 10),
      title: `${scheduleType} - ${title.trim()}`,
      message: message.trim(),
      start_date: isoStartDate,
      end_date: isoEndDate,
      ping_time: formattedPingTime,
      priority,
      status: "active",
      created_by: creatorId,
      created_at: new Date().toISOString(),
      updated_by: creatorId,
    }));

    try {
      await createSchedules(rows);
      setModalVisible(false);
      Alert.alert("Sukses", "Jadwal berhasil ditambahkan.");
      resetForm();
      loadSchedules();
    } catch (err: any) {
      console.error("save schedule catch:", err);
      showToast(`Terjadi kesalahan: ${translateError(err.message || err)}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const performDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteSchedules(selectedScheduleIds);
      setDeleteModalVisible(false);
      Alert.alert("Sukses", "Jadwal berhasil dihapus.");
      setSelectedScheduleIds([]);
      loadSchedules();
    } catch (err: any) {
      console.error("delete schedule catch:", err);
      showToast(`Terjadi kesalahan: ${translateError(err.message || err)}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteSchedules = () => {
    if (selectedScheduleIds.length === 0) {
      Alert.alert("Perhatian", "Pilih minimal satu jadwal untuk dihapus.");
      return;
    }
    setDeleteModalVisible(true);
  };

  const selectedReceiversLabel = selectedReceiverIds.length
    ? `${selectedReceiverIds.length} penerima dipilih`
    : "Pilih penerima...";

  const renderScheduleItem = ({ item }: { item: ScheduleRow }) => {
    const selected = selectedScheduleIds.includes(item.id);
    const scheduleTypeValue = parseScheduleType(item.title);
    const titleValue = stripTypeFromTitle(item.title);
    const priorityStyle = PRIORITY_BADGE_STYLES[item.priority as keyof typeof PRIORITY_BADGE_STYLES] || PRIORITY_BADGE_STYLES.Normal;

    return (
      <Pressable
        key={item.id}
        style={[styles.scheduleItem, selected && styles.scheduleItemSelected]}
        onPress={() => toggleScheduleSelection(item.id)}
      >
        <View style={styles.scheduleRowTop}>
          <View>
            <Text style={styles.scheduleType}>{scheduleTypeValue}</Text>
            <Text style={styles.scheduleTitle}>{titleValue}</Text>
          </View>
          <Ionicons
            name={selected ? "checkbox" : "square-outline"}
            size={22}
            color={selected ? "#1F7A1F" : "#9CA3AF"}
          />
        </View>

        <Text style={styles.scheduleMeta}>{item.message || "-"}</Text>

        <View style={styles.detailRow}>
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>Penerima</Text>
            <Text style={styles.detailValue}>{item.receiver_id ? userMap[item.receiver_id] || "-" : "-"}</Text>
          </View>
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>Waktu Pengingat</Text>
            <Text style={styles.detailValue}>{item.ping_time || "-"}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>Tanggal Mulai</Text>
            <Text style={styles.detailValue}>{item.start_date || "-"}</Text>
          </View>
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>Tanggal Selesai</Text>
            <Text style={styles.detailValue}>{item.end_date || "-"}</Text>
          </View>
        </View>

        <View style={styles.detailRow}> 
          <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg, borderColor: priorityStyle.border }]}> 
            <Text style={[styles.priorityText, { color: priorityStyle.text }]}>{item.priority || "Normal"}</Text>
          </View>
          <View style={styles.statusBadge}> 
            <Text style={styles.statusText}>{item.status || "active"}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>Daftar Jadwal</Text>
            <Text style={styles.headerSubtitle}>Kelola jadwal reminder berdasarkan penerima dan prioritas.</Text>
            <View style={styles.actionRow}>
              <Pressable style={styles.primaryBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Tambah Jadwal</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryBtn, selectedScheduleIds.length === 0 && styles.secondaryBtnDisabled]}
                onPress={handleDeleteSchedules}
                disabled={selectedScheduleIds.length === 0 || deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.secondaryBtnText}>Hapus Jadwal</Text>
                )}
              </Pressable>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
          ) : schedules.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Belum ada jadwal tersedia.</Text>
              <Text style={styles.emptySubtext}>Tambahkan jadwal baru untuk mulai mengirim pengingat.</Text>
            </View>
          ) : (
            <View style={styles.scheduleList}>
              {schedules.map((item) => renderScheduleItem({ item }))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Jadwal</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#5F6368" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Tipe Jadwal</Text>
              <View style={styles.toggleRow}>
                {scheduleTypes.map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.toggleOption,
                      scheduleType === type && styles.toggleOptionActive,
                    ]}
                    onPress={() => setScheduleType(type)}
                  >
                    <Text
                      style={[
                        styles.toggleOptionText,
                        scheduleType === type && styles.toggleOptionTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Judul</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan judul jadwal"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Pesan</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Tulis pesan pengingat"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={message}
                  onChangeText={setMessage}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Penerima</Text>
                <Text style={styles.selectedInfo}>{selectedReceiversLabel}</Text>
                <View style={styles.searchBarWrapper}>
                  <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Cari user..."
                    placeholderTextColor="#9CA3AF"
                    value={userSearch}
                    onChangeText={setUserSearch}
                  />
                </View>
                <View style={styles.receiverList}>
                  {availableUsers.map((receiver) => {
                    const selected = selectedReceiverIds.includes(receiver.id);
                    return (
                      <Pressable
                        key={receiver.id}
                        style={[styles.receiverItem, selected && styles.receiverItemSelected]}
                        onPress={() => toggleReceiverSelection(receiver.id)}
                      >
                        <View>
                          <Text style={styles.receiverName}>{receiver.full_name}</Text>
                          <Text style={styles.receiverNrp}>{receiver.nrp}</Text>
                        </View>
                        <Ionicons
                          name={selected ? "checkmark-circle" : "ellipse-outline"}
                          size={20}
                          color={selected ? "#1F7A1F" : "#9CA3AF"}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Tanggal Mulai */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Tanggal Mulai <Text style={{ color: "#D93025" }}>*</Text></Text>
                <Pressable
                  style={styles.dropdownTrigger}
                  onPress={() => {
                    setActiveDateField("start");
                    setDateModalVisible(true);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownTriggerText,
                      !startDate && { color: "#9CA3AF" },
                    ]}
                  >
                    {startDate || "Pilih Tanggal Mulai..."}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#5F6368" />
                </Pressable>
              </View>

              {/* Tanggal Selesai */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Tanggal Selesai <Text style={{ color: "#D93025" }}>*</Text></Text>
                <Pressable
                  style={styles.dropdownTrigger}
                  onPress={() => {
                    setActiveDateField("end");
                    setDateModalVisible(true);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownTriggerText,
                      !endDate && { color: "#9CA3AF" },
                    ]}
                  >
                    {endDate || "Pilih Tanggal Selesai..."}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#5F6368" />
                </Pressable>
              </View>

              {/* Waktu Pengingat */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Waktu Pengingat <Text style={{ color: "#D93025" }}>*</Text></Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: 07:00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={5}
                  value={pingTime}
                  onChangeText={handlePingTimeChange}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Prioritas</Text>
                <View style={styles.toggleRow}>
                  {priorityOptions.map((option) => (
                    <Pressable
                      key={option}
                      style={[
                        styles.toggleOption,
                        priority === option && styles.toggleOptionActive,
                      ]}
                      onPress={() => setPriority(option)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          priority === option && styles.toggleOptionTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <Pressable
              style={[styles.submitBtn, saveLoading && styles.submitBtnDisabled]}
              onPress={handleSaveSchedule}
              disabled={saveLoading}
            >
              {saveLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Simpan</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={dateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeDateField === "start" ? "Tentukan Tanggal Mulai" : "Tentukan Tanggal Selesai"}
              </Text>
              <Pressable onPress={() => setDateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#5F6368" />
              </Pressable>
            </View>

            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Pressable onPress={handlePrevMonth} style={styles.calendarNavBtn}>
                  <Ionicons name="chevron-back" size={20} color="#1F7A1F" />
                </Pressable>
                <Text style={styles.calendarMonthText}>
                  {new Date(currentViewYear, currentViewMonth - 1).toLocaleDateString("id-ID", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <Pressable onPress={handleNextMonth} style={styles.calendarNavBtn}>
                  <Ionicons name="chevron-forward" size={20} color="#1F7A1F" />
                </Pressable>
              </View>

              <View style={styles.weekDaysRow}>
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((name) => (
                  <Text key={name} style={styles.weekDayText}>
                    {name}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {(() => {
                  const daysInMonth = getDaysInMonth(currentViewMonth, currentViewYear);
                  const firstDayIndex = getFirstDayOfMonth(currentViewMonth, currentViewYear);
                  const cells = [];

                  for (let i = 0; i < firstDayIndex; i++) {
                    cells.push({ id: `pad-${i}`, val: null });
                  }
                  for (let i = 1; i <= daysInMonth; i++) {
                    cells.push({ id: `day-${i}`, val: i });
                  }

                  return cells.map((cell) => {
                    if (cell.val === null) {
                      return <View key={cell.id} style={styles.calendarCellEmpty} />;
                    }
                    const isSelected =
                      selectedDay === cell.val &&
                      selectedMonth === currentViewMonth &&
                      selectedYear === currentViewYear;
                    return (
                      <Pressable
                        key={cell.id}
                        style={[styles.calendarCell, isSelected && styles.calendarCellSelected]}
                        onPress={() => {
                          setSelectedDay(cell.val);
                          setSelectedMonth(currentViewMonth);
                          setSelectedYear(currentViewYear);
                        }}
                      >
                        <Text style={[styles.calendarCellText, isSelected && styles.calendarCellTextSelected]}>
                          {cell.val}
                        </Text>
                      </Pressable>
                    );
                  });
                })()}
              </View>
            </View>

            <Pressable style={styles.dateConfirmBtn} onPress={handleConfirmDate}>
              <Text style={styles.dateConfirmBtnText}>Konfirmasi Tanggal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hapus Jadwal</Text>
              <Pressable onPress={() => setDeleteModalVisible(false)}>
                <Ionicons name="close" size={24} color="#5F6368" />
              </Pressable>
            </View>

            <View style={styles.modalBodyConfirm}>
              <Ionicons name="trash-outline" size={48} color="#D93025" style={{ alignSelf: "center", marginBottom: 16 }} />
              <Text style={styles.confirmText}>
                Apakah Anda yakin ingin menghapus {selectedScheduleIds.length} jadwal yang terpilih?
              </Text>
              <Text style={styles.confirmSubtext}>
                Tindakan ini tidak dapat dibatalkan dan data jadwal akan dihapus secara permanen dari sistem.
              </Text>
            </View>

            <View style={styles.confirmFooterRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </Pressable>
              <Pressable
                style={[styles.deleteConfirmBtn, deleteLoading && styles.deleteConfirmBtnDisabled]}
                onPress={performDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>Hapus</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {toastMessage ? (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7F5",
  },
  container: {
    padding: 16,
    paddingBottom: 24,
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  headerSubtitle: {
    color: "#4B5563",
    fontSize: 13,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#1F7A1F",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#D93025",
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnDisabled: {
    backgroundColor: "#FCA5A5",
  },
  secondaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    marginTop: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  emptySubtext: {
    marginTop: 6,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 260,
  },
  scheduleList: {
    paddingBottom: 24,
  },
  scheduleItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scheduleItemSelected: {
    borderColor: "#1F7A1F",
    backgroundColor: "#ECFDF3",
  },
  scheduleRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  scheduleType: {
    color: "#1E293B",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  scheduleTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  scheduleMeta: {
    color: "#475569",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  detailGroup: {
    flex: 1,
    minWidth: "48%",
    marginBottom: 10,
  },
  detailLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  priorityBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadge: {
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "capitalize",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    maxHeight: "90%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  modalBody: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  toggleOption: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  toggleOptionActive: {
    backgroundColor: "#1F7A1F",
    borderColor: "#1F7A1F",
  },
  toggleOptionText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  toggleOptionTextActive: {
    color: "#FFFFFF",
  },
  selectedInfo: {
    color: "#4B5563",
    marginBottom: 10,
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  receiverList: {
    maxHeight: 220,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  receiverItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  receiverItemSelected: {
    backgroundColor: "#ECFDF3",
  },
  receiverName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  receiverNrp: {
    color: "#6B7280",
    marginTop: 2,
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: "#1F7A1F",
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  dateModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    alignSelf: "center",
  },
  calendarContainer: {
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  calendarNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ECFDF3",
  },
  calendarMonthText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 4,
  },
  calendarCell: {
    width: "13.2%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  calendarCellSelected: {
    backgroundColor: "#1F7A1F",
  },
  calendarCellEmpty: {
    width: "13.2%",
    aspectRatio: 1,
  },
  calendarCellText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  calendarCellTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dateConfirmBtn: {
    backgroundColor: "#1F7A1F",
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
  toastBanner: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 9999,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  modalBodyConfirm: {
    padding: 24,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 22,
  },
  confirmSubtext: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
  confirmFooterRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "700",
  },
  deleteConfirmBtn: {
    flex: 1,
    backgroundColor: "#D93025",
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteConfirmBtnDisabled: {
    backgroundColor: "#FCA5A5",
  },
  deleteConfirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
