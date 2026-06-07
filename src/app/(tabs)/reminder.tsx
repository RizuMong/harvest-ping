import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import InstantReminderForm from "@/components/InstantReminderForm";
import { fetchReminders, ReminderItem } from "@/services/reminder.service";

export default function ReminderScreen() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const data = await fetchReminders();
      setReminders(data);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Terjadi kesalahan saat memuat pengingat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const reminderNotifications = useMemo(() => reminders, [reminders]);

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return `${date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}> 
        <View style={styles.listCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daftar Pengingat</Text>
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={[styles.emptyText, { marginTop: 16 }]}>Memuat pengingat...</Text>
            </View>
          ) : reminderNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Belum ada pengingat instant yang dibuat.</Text>
              <Text style={styles.emptySubtext}>
                Klik tombol tambah untuk membuat pengingat baru.
              </Text>
            </View>
          ) : (
            reminderNotifications.map((item) => (
              <View key={item.id} style={styles.reminderCard}>
                <View style={styles.reminderHeader}>
                  <Text style={styles.reminderTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.reminderBadgeRow}>
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityBadgeText}>{item.priority}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reminderMessage} numberOfLines={3}>
                  {item.message}
                </Text>
                <View style={styles.reminderFooter}>
                  <Text style={styles.metaText}>{formatTimestamp(item.createdAt)}</Text>
                  <Text style={styles.metaText}>
                    {item.receiverId ? "1 penerima" : "Penerima belum dipilih"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InstantReminderForm
              onClose={() => setModalVisible(false)}
              onSuccess={() => {
                setModalVisible(false);
                loadReminders();
              }}
              submitLabel="Kirim Pengingat Sekarang"
              titleText="Buat Pengingat Instant"
              subtitleText="Kirimkan pengingat langsung ke seluruh anggota tim yang terdaftar."
              closeIcon
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7F5",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    maxWidth: "70%",
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginTop: 14,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    maxWidth: 240,
  },
  reminderCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reminderTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginRight: 10,
  },
  reminderBadgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  reminderMessage: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 14,
    lineHeight: 20,
  },
  reminderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1F7A1F",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#F4F7F5",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 28,
    minHeight: "80%",
  },
});
