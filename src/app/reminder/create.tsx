import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import InstantReminderForm from "@/components/InstantReminderForm";

export default function CreateReminderScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F7F5" }} edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderColor: "#E5E7EB" }}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#2D312E" />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#2D312E" }}>Buat Pengingat Instant</Text>
        <View style={{ width: 40 }} />
      </View>
      <InstantReminderForm
        onSuccess={() => router.replace("/reminder")}
        submitLabel="Kirim Pengingat Sekarang"
        titleText="Buat Pengingat Instant"
        subtitleText="Kirimkan pengingat langsung ke seluruh anggota tim yang terdaftar."
        closeIcon={false}
      />
    </SafeAreaView>
  );
}

