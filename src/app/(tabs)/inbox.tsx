import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PRIORITY_BADGE_STYLES } from "@/config/app.config";
import { Notification, useNotificationStore } from "@/store/notification.store";

export default function InboxScreen() {
  const notifications = useNotificationStore((state) => state.notifications);
  const acknowledgeNotification = useNotificationStore((state) => state.acknowledgeNotification);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  // UI Navigation Tabs: "unconfirmed" or "confirmed"
  const [activeTab, setActiveTab] = useState<"unconfirmed" | "confirmed">("unconfirmed");
  
  // Refresh Control
  const [refreshing, setRefreshing] = useState(false);
  
  // Detail Modal States
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  // Filter notifications based on acknowledgment state
  const unconfirmedNotifications = notifications.filter((n) => !n.is_acknowledged);
  const confirmedNotifications = notifications.filter((n) => n.is_acknowledged);

  // Badge count for unacknowledged notifications
  const unacknowledgedCount = unconfirmedNotifications.length;

  const handleCardPress = (notif: Notification) => {
    setSelectedNotif(notif);
    setModalVisible(true);
  };

  const handleConfirmReport = (notif: Notification) => {
    Alert.alert(
      "Konfirmasi Penerimaan",
      "Apakah Anda yakin laporan ini sudah diterima dan dipahami?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Ya, Konfirmasi",
          onPress: () => {
            acknowledgeNotification(notif.id);
            setModalVisible(false);
            
            // Show success toast/alert
            Alert.alert("Sukses", "Laporan berhasil dikonfirmasi.");
          },
        },
      ]
    );
  };

  const getPriorityStyle = (priority: string) =>
    PRIORITY_BADGE_STYLES[priority as keyof typeof PRIORITY_BADGE_STYLES] ||
    PRIORITY_BADGE_STYLES.Rendah;


  const activeNotifications =
    activeTab === "unconfirmed" ? unconfirmedNotifications : confirmedNotifications;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="mail" size={24} color="#2E7D32" style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>Kotak Masuk</Text>
        </View>
        
        {unacknowledgedCount > 0 && (
          <Pressable
            onPress={markAllAsRead}
            style={({ pressed }) => [
              styles.markAllBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.markAllText}>Tandai Semua Dibaca</Text>
          </Pressable>
        )}
      </View>

      {/* Tabs Layout */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabButton, activeTab === "unconfirmed" && styles.activeTabButton]}
          onPress={() => setActiveTab("unconfirmed")}
        >
          <Text style={[styles.tabText, activeTab === "unconfirmed" && styles.activeTabText]}>
            Belum Dikonfirmasi
          </Text>
          {unacknowledgedCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{unacknowledgedCount}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === "confirmed" && styles.activeTabButton]}
          onPress={() => setActiveTab("confirmed")}
        >
          <Text style={[styles.tabText, activeTab === "confirmed" && styles.activeTabText]}>
            Sudah Dikonfirmasi
          </Text>
        </Pressable>
      </View>

      {/* Main Notifications Scroll List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} />
        }
      >
        {activeNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons
                name={activeTab === "unconfirmed" ? "checkmark-done-circle-outline" : "mail-open-outline"}
                size={54}
                color="#81C784"
              />
            </View>
            <Text style={styles.emptyText}>
              {activeTab === "unconfirmed"
                ? "Hebat! Semua laporan sudah dikonfirmasi"
                : "Belum ada laporan yang dikonfirmasi"}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === "unconfirmed"
                ? "Tidak ada pengingat baru yang menunggu tindakan Anda saat ini."
                : "Laporan yang telah Anda konfirmasi akan terekam di tab ini."}
            </Text>
          </View>
        ) : (
          activeNotifications.map((notif) => {
            const pStyle = getPriorityStyle(notif.priority);
            return (
              <Pressable
                key={notif.id}
                style={({ pressed }) => [
                  styles.notificationCard,
                  !notif.read && activeTab === "unconfirmed" && styles.unreadCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => handleCardPress(notif)}
              >
                {/* Priority Badge at top */}
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.priorityBadge, { backgroundColor: pStyle.bg, borderColor: pStyle.border }]}>
                    <View style={[styles.priorityDot, { backgroundColor: pStyle.text }]} />
                    <Text style={[styles.priorityText, { color: pStyle.text }]}>
                      Prioritas {notif.priority}
                    </Text>
                  </View>
                  {!notif.read && activeTab === "unconfirmed" && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>BARU</Text>
                    </View>
                  )}
                </View>

                {/* Title */}
                <Text
                  style={[
                    styles.notificationTitle,
                    !notif.read && activeTab === "unconfirmed" && styles.unreadTitleText,
                  ]}
                  numberOfLines={2}
                >
                  {notif.title}
                </Text>

                {/* Message preview */}
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notif.message}
                </Text>

                {/* Footer block: Sender & Date-Time */}
                <View style={styles.cardFooter}>
                  <View style={styles.senderContainer}>
                    <View style={styles.senderAvatar}>
                      <Text style={styles.senderAvatarText}>{notif.senderInitials}</Text>
                    </View>
                    <Text style={styles.senderName}>{notif.sender}</Text>
                  </View>
                  <Text style={styles.notificationDate}>
                    {notif.date} • {notif.time || "12:00"}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {selectedNotif && (
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>Detail Laporan</Text>
                <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#5F6368" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Priority Badge */}
                <View style={styles.modalPriorityContainer}>
                  <View
                    style={[
                      styles.priorityBadge,
                      {
                        backgroundColor: getPriorityStyle(selectedNotif.priority).bg,
                        borderColor: getPriorityStyle(selectedNotif.priority).border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityStyle(selectedNotif.priority).text },
                      ]}
                    />
                    <Text style={[styles.priorityText, { color: getPriorityStyle(selectedNotif.priority).text }]}>
                      Prioritas {selectedNotif.priority}
                    </Text>
                  </View>
                  
                  <Text style={styles.modalTimeText}>
                    Dibuat: {selectedNotif.date} pada {selectedNotif.time || "12:00"}
                  </Text>
                </View>
                {selectedNotif.scheduleType && (
                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Tipe Jadwal</Text>
                    <Text style={styles.detailMetaValue}>{selectedNotif.scheduleType}</Text>
                  </View>
                )}
                {selectedNotif.receiverNames && selectedNotif.receiverNames.length > 0 && (
                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Penerima</Text>
                    <Text style={styles.detailMetaValue}>{selectedNotif.receiverNames.join(", ")}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalFooter}>
                <Pressable
                  style={[styles.modalButton, styles.buttonClose]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonCloseText}>Tutup</Text>
                </Pressable>

                {!selectedNotif.is_acknowledged && (
                  <Pressable
                    style={[styles.modalButton, styles.buttonConfirmDetail]}
                    onPress={() => handleConfirmReport(selectedNotif)}
                  >
                    <Ionicons name="checkbox-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.buttonConfirmDetailText}>Konfirmasi Laporan</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#E8F5E9",
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
  },
  btnPressed: {
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderColor: "transparent",
  },
  activeTabButton: {
    borderColor: "#2E7D32",
  },
  tabText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#2E7D32",
    fontWeight: "700",
  },
  tabBadge: {
    backgroundColor: "#D93025",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  unreadCard: {
    borderColor: "#A5D6A7",
    backgroundColor: "#F9FDFB",
  },
  cardPressed: {
    backgroundColor: "#F4F6F9",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  newBadge: {
    backgroundColor: "#D93025",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    lineHeight: 20,
    marginBottom: 6,
  },
  unreadTitleText: {
    color: "#111827",
    fontWeight: "700",
  },
  notificationMessage: {
    fontSize: 13,
    color: "#5F6368",
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  senderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  senderAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  senderAvatarText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6B7280",
  },
  senderName: {
    fontSize: 12,
    color: "#5F6368",
    fontWeight: "500",
  },
  notificationDate: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalPriorityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTimeText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  detailMetaRow: {
    marginBottom: 10,
  },
  detailMetaLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 4,
  },
  detailMetaValue: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  modalNotificationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 24,
    marginBottom: 16,
  },
  messageBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  modalMessageText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  infoSectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  senderDetailCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 12,
  },
  senderAvatarLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  senderAvatarLargeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  senderDetailName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  senderDetailSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  buttonClose: {
    backgroundColor: "#F3F4F6",
  },
  buttonCloseText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonConfirmDetail: {
    backgroundColor: "#2E7D32",
  },
  buttonConfirmDetailText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
