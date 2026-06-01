import React, { useState, useEffect } from "react";
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useHarvestStore } from "@/store/harvest.store";
import { supabase } from "@/services/supabase";

interface DBUser {
  id: string;
  full_name: string;
  nrp: string;
}

export default function ApprovalConfigScreen() {
  const approverConfigs = useHarvestStore((state) => state.approverConfigs);
  const reorderApproverConfig = useHarvestStore((state) => state.reorderApproverConfig);
  const addApproverConfig = useHarvestStore((state) => state.addApproverConfig);
  const removeApproverConfig = useHarvestStore((state) => state.removeApproverConfig);

  const [dbUsers, setDbUsers] = useState<DBUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Fetch users from master_user to add
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const { data, error } = await supabase
          .from("master_user")
          .select("id, full_name, nrp");
        if (!error && data) {
          setDbUsers(data.map((u: any) => ({
            id: String(u.id),
            full_name: u.full_name,
            nrp: u.nrp,
          })));
        }
      } catch (err) {
        console.error("fetchUsers error:", err);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filter users not already added
  const availableUsers = dbUsers.filter(
    (u) =>
      !approverConfigs.some((a) => String(a.userId) === String(u.id)) &&
      (u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.nrp.includes(searchQuery))
  );

  const handleAddApprover = async (user: DBUser) => {
    await addApproverConfig(user.id, user.full_name);
    setAddModalVisible(false);
    setSearchQuery("");
    Alert.alert("Sukses", `Approver ${user.full_name} berhasil ditambahkan.`);
  };

  const handleRemoveApprover = (id: string, name: string) => {
    Alert.alert(
      "Hapus Approver",
      `Apakah Anda yakin ingin menghapus ${name} dari daftar approver?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await removeApproverConfig(id);
          },
        },
      ]
    );
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newConfigs = [...approverConfigs];
    const temp = newConfigs[index];
    newConfigs[index] = newConfigs[index - 1];
    newConfigs[index - 1] = temp;

    // Re-index sequences
    const reindexed = newConfigs.map((c, i) => ({
      ...c,
      sequence: i + 1,
    }));
    await reorderApproverConfig(reindexed);
  };

  const handleMoveDown = async (index: number) => {
    if (index === approverConfigs.length - 1) return;
    const newConfigs = [...approverConfigs];
    const temp = newConfigs[index];
    newConfigs[index] = newConfigs[index + 1];
    newConfigs[index + 1] = temp;

    // Re-index sequences
    const reindexed = newConfigs.map((c, i) => ({
      ...c,
      sequence: i + 1,
    }));
    await reorderApproverConfig(reindexed);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Alur Persetujuan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Kelola urutan dan daftar pengguna yang berwenang memberikan persetujuan (approval) pengajuan selesai panen.
        </Text>

        {/* Approver List */}
        <View style={styles.listCard}>
          {approverConfigs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Belum ada approver terdaftar</Text>
              <Text style={styles.emptySubtext}>
                Gunakan tombol di bawah untuk menambahkan approver pertama Anda.
              </Text>
            </View>
          ) : (
            approverConfigs
              .sort((a, b) => a.sequence - b.sequence)
              .map((app, index) => (
                <View
                  key={app.id}
                  style={[
                    styles.approverItem,
                    index === approverConfigs.length - 1 && styles.lastItem,
                  ]}
                >
                  <View style={styles.sequenceBadge}>
                    <Text style={styles.sequenceText}>{app.sequence}</Text>
                  </View>

                  <View style={styles.approverInfo}>
                    <Text style={styles.approverName}>{app.userName}</Text>
                    <Text style={styles.approverRole}>Langkah {app.sequence}</Text>
                  </View>

                  {/* Reorder and Delete Actions */}
                  <View style={styles.actionsWrapper}>
                    <Pressable
                      style={[styles.arrowBtn, index === 0 && styles.disabledBtn]}
                      disabled={index === 0}
                      onPress={() => handleMoveUp(index)}
                    >
                      <Ionicons name="arrow-up" size={16} color={index === 0 ? "#D1D5DB" : "#5F6368"} />
                    </Pressable>

                    <Pressable
                      style={[
                        styles.arrowBtn,
                        index === approverConfigs.length - 1 && styles.disabledBtn,
                      ]}
                      disabled={index === approverConfigs.length - 1}
                      onPress={() => handleMoveDown(index)}
                    >
                      <Ionicons
                        name="arrow-down"
                        size={16}
                        color={index === approverConfigs.length - 1 ? "#D1D5DB" : "#5F6368"}
                      />
                    </Pressable>

                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => handleRemoveApprover(app.id, app.userName)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#D93025" />
                    </Pressable>
                  </View>
                </View>
              ))
          )}
        </View>

        {/* Add Approver Button */}
        <Pressable style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Tambah Approver</Text>
        </Pressable>
      </ScrollView>

      {/* Add Approver Modal */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Approver Baru</Text>
              <Pressable onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#5F6368" />
              </Pressable>
            </View>

            <View style={styles.searchBarWrapper}>
              <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari user (Nama atau NRP)..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={true}>
              {usersLoading ? (
                <ActivityIndicator size="small" color="#2E7D32" style={{ marginVertical: 20 }} />
              ) : availableUsers.length === 0 ? (
                <Text style={styles.noResultsText}>Tidak ada user yang tersedia.</Text>
              ) : (
                availableUsers.map((user) => (
                  <Pressable
                    key={user.id}
                    style={styles.dropdownItem}
                    onPress={() => handleAddApprover(user)}
                  >
                    <Ionicons name="person-outline" size={18} color="#2E7D32" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownItemText}>{user.full_name}</Text>
                      <Text style={styles.dropdownItemSub}>{user.nrp}</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
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
  description: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
    overflow: "hidden",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
  },
  approverItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  sequenceBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sequenceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32",
  },
  approverInfo: {
    flex: 1,
  },
  approverName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  approverRole: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  actionsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  disabledBtn: {
    opacity: 0.5,
    backgroundColor: "#F3F4F6",
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FCE8E6",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
  },
  addBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
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
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#202124",
    fontWeight: "600",
  },
  dropdownItemSub: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  noResultsText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginVertical: 20,
  },
});
