import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAuthStore } from "@/store/auth.store";
import { verifyAndUpdatePin } from "@/services/auth.service";
import { clearSession } from "@/services/storage.service";

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [modalVisible, setModalVisible] = useState(false);
  
  // PIN states
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  
  // Visibility toggle states
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(true); // Default open to show explanation right there

  // Dynamic user data
  const displayName = user?.name || "";
  const displayNrp = user?.nrp || "";

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

  const handleUpdatePin = async () => {
    if (!currentPin || !newPin || !confirmPin) {
      Alert.alert("Error", "Semua kolom PIN harus diisi");
      return;
    }

    if (newPin.length < 4) {
      Alert.alert("Error", "PIN minimal harus 4 digit");
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert("Error", "PIN Baru dan Konfirmasi PIN tidak cocok");
      return;
    }

    // Check if pins are valid numbers
    if (!/^\d+$/.test(currentPin) || !/^\d+$/.test(newPin) || !/^\d+$/.test(confirmPin)) {
      Alert.alert("Error", "PIN harus berupa angka saja");
      return;
    }

    setLoading(true);
    try {
      // Hit Supabase database directly to verify current PIN and update to new PIN
      await verifyAndUpdatePin(displayNrp, currentPin, newPin);
      
      Alert.alert("Sukses", "PIN Anda berhasil diperbarui di database!");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setShowCurrentPin(false);
      setShowNewPin(false);
      setShowConfirmPin(false);
      setModalVisible(false);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Gagal", error.message || "Terjadi kesalahan saat memperbarui PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setShowCurrentPin(false);
    setShowNewPin(false);
    setShowConfirmPin(false);
    setModalVisible(false);
  };

  const handleLogoutPress = () => {
    Alert.alert(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar dari akun Anda?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Keluar",
          style: "destructive",
          onPress: async () => {
            await clearSession();
            logout();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Section - Styled matching Home page header avatar/text but in a premium colored banner without shadow */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {/* Display user initials inside custom avatar circle */}
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileNrp}>NRP: {displayNrp}</Text>
          </View>
        </View>

        {/* Settings Section */}
        <Text style={styles.sectionHeader}>Settings</Text>
        <View style={styles.card}>
          {/* Approval Configuration (Admin Only) */}
          {(user?.role?.toLowerCase() === "admin" || user?.nrp === "001") && (
            <Pressable
              style={({ pressed }) => [
                styles.itemRow,
                pressed && styles.itemRowPressed,
              ]}
              onPress={() => router.push("/settings/approval-config")}
            >
              <View style={styles.itemLeft}>
                <Ionicons name="options-outline" size={22} color="#5F6368" style={styles.itemIcon} />
                <Text style={styles.itemLabel}>Konfigurasi Approver</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
            </Pressable>
          )}

          {/* Ubah PIN */}
          <Pressable
            style={({ pressed }) => [
              styles.itemRow,
              pressed && styles.itemRowPressed,
            ]}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="lock-closed-outline" size={22} color="#5F6368" style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Ubah PIN Keamanan</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
          </Pressable>

          {/* Tentang Aplikasi */}
          <View style={[styles.itemRow, styles.aboutContainer]}>
            <Pressable
              style={styles.aboutHeader}
              onPress={() => setAboutExpanded(!aboutExpanded)}
            >
              <View style={styles.itemLeft}>
                <Ionicons name="information-circle-outline" size={22} color="#5F6368" style={styles.itemIcon} />
                <Text style={styles.itemLabel}>Tentang Aplikasi</Text>
              </View>
              <Ionicons
                name={aboutExpanded ? "chevron-down" : "chevron-forward"}
                size={18}
                color="#C4C4C4"
              />
            </Pressable>
            
            {aboutExpanded && (
              <View style={styles.aboutContent}>
                <Text style={styles.aboutText}>
                  <Text style={{ fontWeight: "700", color: "#2E7D32" }}>HarvestPing </Text>
                  adalah sistem pemantauan hasil panen kelapa sawit digital. Aplikasi ini dirancang untuk mencatat aktivitas panen di lapangan secara langsung, memastikan transparansi data, dan menyinkronkan data tim dengan aman ke database pusat.
                </Text>
                <Text style={styles.versionText}>Versi Aplikasi 1.0.0 (SDK 54)</Text>
              </View>
            )}
          </View>

          {/* Keluar Akun (Logout Button at the bottom of Settings card) */}
          <Pressable
            style={({ pressed }) => [
              styles.itemRow,
              styles.itemRowLast,
              pressed && styles.logoutRowPressed,
            ]}
            onPress={handleLogoutPress}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="log-out-outline" size={22} color="#D93025" style={styles.itemIcon} />
              <Text style={[styles.itemLabel, styles.logoutLabel]}>Keluar Akun</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D93025" style={{ opacity: 0.8 }} />
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Change PIN Modal with eye icons toggles */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ubah PIN Keamanan</Text>
              <Pressable onPress={handleCloseModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#5F6368" />
              </Pressable>
            </View>

            <Text style={styles.modalDescription}>
              Ubah PIN Anda secara berkala demi keamanan akun. PIN harus berupa kombinasi angka.
            </Text>

            {/* Current PIN Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PIN Lama</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#2D6A4F" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan PIN lama"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  secureTextEntry={!showCurrentPin}
                  maxLength={6}
                  value={currentPin}
                  onChangeText={(text) => setCurrentPin(text.replace(/[^0-9]/g, ""))}
                />
                <Pressable onPress={() => setShowCurrentPin(!showCurrentPin)} style={styles.showPinBtn}>
                  <Ionicons
                    name={showCurrentPin ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* New PIN Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PIN Baru</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#2D6A4F" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan PIN baru"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  secureTextEntry={!showNewPin}
                  maxLength={6}
                  value={newPin}
                  onChangeText={(text) => setNewPin(text.replace(/[^0-9]/g, ""))}
                />
                <Pressable onPress={() => setShowNewPin(!showNewPin)} style={styles.showPinBtn}>
                  <Ionicons
                    name={showNewPin ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm New PIN Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Konfirmasi PIN Baru</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#2D6A4F" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Konfirmasi PIN baru"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  secureTextEntry={!showConfirmPin}
                  maxLength={6}
                  value={confirmPin}
                  onChangeText={(text) => setConfirmPin(text.replace(/[^0-9]/g, ""))}
                />
                <Pressable onPress={() => setShowConfirmPin(!showConfirmPin)} style={styles.showPinBtn}>
                  <Ionicons
                    name={showConfirmPin ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.buttonCancel]}
                onPress={handleCloseModal}
                disabled={loading}
              >
                <Text style={styles.buttonCancelText}>Batal</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.buttonSubmit]}
                onPress={handleUpdatePin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonSubmitText}>Simpan PIN</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6", // matches exactly the Home page's elegant gray background
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9", // premium colored pastel green background matches home page themes
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#C8E6C9", // clear border - no shadow at all
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF", // white background to stand out beautifully on the colored card
    borderWidth: 1.5,
    borderColor: "#A3D9A5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#2E7D32",
    fontSize: 18,
    fontWeight: "700",
  },
  profileTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B5E20", // rich matching deep green
    marginBottom: 2,
  },
  profileNrp: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E7D32",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#202124",
    marginBottom: 10,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB", // clear border - no shadow
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  itemRowPressed: {
    backgroundColor: "#F9FAFB",
  },
  logoutRowPressed: {
    backgroundColor: "#FCE8E6", // soft pastel red press color
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    marginRight: 14,
    width: 24,
    textAlign: "center",
  },
  itemLabel: {
    fontSize: 15,
    color: "#202124",
    fontWeight: "500",
  },
  logoutLabel: {
    color: "#D93025",
    fontWeight: "600",
  },
  aboutContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  aboutHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  aboutContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  aboutText: {
    fontSize: 13,
    color: "#5F6368",
    lineHeight: 19,
    textAlign: "justify",
  },
  versionText: {
    fontSize: 11,
    color: "#9AA0A6",
    marginTop: 8,
    fontWeight: "500",
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
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#202124",
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 13,
    color: "#5F6368",
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#202124",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 8,
    height: 48,
  },
  textInput: {
    flex: 1,
    color: "#202124",
    fontSize: 14,
    height: "100%",
    paddingLeft: 8,
    paddingVertical: 0,
  },
  inputIcon: {
    marginRight: 4,
  },
  showPinBtn: {
    padding: 4,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  buttonCancel: {
    backgroundColor: "#F1F3F4",
  },
  buttonCancelText: {
    color: "#5F6368",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonSubmit: {
    backgroundColor: "#2E7D32",
  },
  buttonSubmitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});