import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

interface DBUser {
  id: string;
  full_name: string;
  nrp: string;
}

const scheduleTypes = ["Panen", "Perawatan"] as const;
const priorityOptions = ["Rendah", "Normal", "Tinggi"] as const;

type ScheduleType = typeof scheduleTypes[number];
type PriorityOption = typeof priorityOptions[number];

interface InstantReminderFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  submitLabel?: string;
  titleText?: string;
  subtitleText?: string;
  closeIcon?: boolean;
}

export default function InstantReminderForm({
  onClose,
  onSuccess,
  submitLabel = "Kirim Pengingat Sekarang",
  titleText = "Buat Pengingat Instant",
  subtitleText = "Kirimkan pengingat langsung ke seluruh anggota tim yang terdaftar.",
  closeIcon = false,
}: InstantReminderFormProps) {
  const user = useAuthStore((state) => state.user);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduleType, setScheduleType] = useState<ScheduleType>("Panen");
  const [priority, setPriority] = useState<PriorityOption>("Normal");
  const [users, setUsers] = useState<DBUser[]>([]);
  const [selectedReceiverIds, setSelectedReceiverIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("master_user")
          .select("id, full_name, nrp");

        if (!error && data) {
          setUsers(
            data.map((row: any) => ({
              id: String(row.id),
              full_name: row.full_name,
              nrp: row.nrp,
            }))
          );
        }
      } catch (err) {
        console.error("fetchUsers error:", err);
      }
    };

    fetchUsers();
  }, []);

  const userMap = useMemo(
    () =>
      users.reduce<Record<string, string>>((acc, currentUser) => {
        acc[currentUser.id] = currentUser.full_name;
        return acc;
      }, {}),
    [users]
  );

  const availableUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return users.filter(
      (receiver) =>
        receiver.full_name.toLowerCase().includes(query) ||
        receiver.nrp.toLowerCase().includes(query)
    );
  }, [userSearch, users]);

  const selectedReceiverNames = useMemo(
    () => selectedReceiverIds.map((id) => userMap[id]).filter(Boolean),
    [selectedReceiverIds, userMap]
  );

  const selectedReceiversLabel = selectedReceiverIds.length
    ? `${selectedReceiverIds.length} penerima dipilih`
    : "Pilih penerima...";

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setScheduleType("Panen");
    setPriority("Normal");
    setSelectedReceiverIds([]);
    setUserSearch("");
  };

  const handleCancel = () => {
    resetForm();
    onClose?.();
  };

  const handleSend = async () => {
    setLoading(true);

    if (!title.trim() || !message.trim()) {
      Alert.alert("Error", "Judul dan Pesan pengingat harus diisi");
      setLoading(false);
      return;
    }

    if (selectedReceiverIds.length === 0) {
      Alert.alert("Error", "Pilih minimal satu penerima.");
      setLoading(false);
      return;
    }

    const creatorId = user?.id ? parseInt(user.id, 10) : 1;
    const rows = selectedReceiverIds.map((receiver_id) => ({
      receiver_id: parseInt(receiver_id, 10),
      title: title.trim(),
      message: message.trim(),
      priority,
      is_acknowledged: false,
      created_by: creatorId,
      updated_by: creatorId,
      created_at: new Date().toISOString(),
    }));

    try {
      const { error } = await supabase.from("t_ping_reminder").insert(rows);
      if (error) {
        console.error("save reminder error:", error);
        Alert.alert("Gagal", "Tidak dapat menyimpan pengingat. Silakan coba lagi.");
        return;
      }

      resetForm();
      Alert.alert("Sukses", "Pengingat instant berhasil dibuat!", [
        {
          text: "OK",
          onPress: () => {
            onSuccess?.();
          },
        },
      ]);
    } catch (err: any) {
      console.error("save reminder catch:", err);
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan pengingat.");
    } finally {
      setLoading(false);
    }
  };

  const buttonDisabled = loading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.wrapper}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          {onClose && (
            <Pressable style={styles.backBtn} onPress={handleCancel}>
              <Ionicons
                name={closeIcon ? "close" : "arrow-back"}
                size={24}
                color="#2D312E"
              />
            </Pressable>
          )}
          <View style={styles.titleBlock}>
            <Text style={styles.headerTitle}>{titleText}</Text>
            <Text style={styles.headerSubtitle}>{subtitleText}</Text>
          </View>
          {onClose ? <View style={{ width: 40 }} /> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Judul Pengingat</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Input Laporan Hasil Panen"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
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
          </View>

          <View style={styles.inputGroup}>
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
                    onPress={() =>
                      setSelectedReceiverIds((prev) =>
                        prev.includes(receiver.id)
                          ? prev.filter((item) => item !== receiver.id)
                          : [...prev, receiver.id]
                      )
                    }
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

          <View style={styles.inputGroup}>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pesan Pengingat</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Tulis pesan pengingat Anda di sini..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.submitBtnPressed,
              buttonDisabled && styles.submitBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={buttonDisabled}
          >
            <Text style={styles.submitBtnText}>
              {loading ? "Mengirim..." : submitLabel}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 12,
    marginTop: 4,
  },
  titleBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#111827",
    fontSize: 14,
  },
  textArea: {
    minHeight: 120,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  toggleOption: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  toggleOptionActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#1B5E20",
  },
  toggleOptionText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  toggleOptionTextActive: {
    color: "#FFFFFF",
  },
  selectedInfo: {
    color: "#6B7280",
    marginBottom: 10,
    fontSize: 13,
  },
  searchBarWrapper: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
  },
  receiverList: {
    gap: 10,
  },
  receiverItem: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiverItemSelected: {
    borderColor: "#22C55E",
    backgroundColor: "#EEF9F1",
  },
  receiverName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  receiverNrp: {
    fontSize: 12,
    color: "#6B7280",
  },
  submitBtn: {
    backgroundColor: "#1F7A1F",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnPressed: {
    opacity: 0.85,
  },
  submitBtnDisabled: {
    backgroundColor: "#94A3B8",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
