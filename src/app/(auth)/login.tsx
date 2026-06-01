import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { login } from "@/services/auth.service";
import { saveSession } from "@/services/storage.service";
import { useAuthStore } from "@/store/auth.store";

export default function LoginScreen() {
  const [nrp, setNrp] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showPin, setShowPin] = useState(false);

  const nrpInputRef = useRef<TextInput>(null);
  const pinInputRef = useRef<TextInput>(null);

  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async () => {
    if (!nrp.trim() || !pin.trim()) {
      setErrorMsg("NRP dan PIN harus diisi");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const user = await login(nrp.trim(), pin.trim());
      await saveSession(user);
      setUser(user);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled={Platform.OS !== "web"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Header Section */}
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={28} color="#2D6A4F" />
            </View>
            <Text style={styles.appName}>Harvest Ping</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Masuk Akun</Text>
            <Text style={styles.cardSubtitle}>
              Gunakan NRP dan PIN yang terdaftar untuk melanjutkan
            </Text>

            {errorMsg && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#D90429" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* NRP Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NRP (Nomor Registrasi Pekerja)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#2D6A4F"
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={nrpInputRef}
                  style={styles.textInput}
                  placeholder="Contoh: 12345678"
                  placeholderTextColor="#9CA3AF"
                  value={nrp}
                  onChangeText={(text) => {
                    setNrp(text);
                    setErrorMsg(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={Platform.OS === "web"}
                />
                {nrp.length > 0 && (
                  <Pressable
                    onPress={() => {
                      setNrp("");
                      nrpInputRef.current?.focus();
                    }}
                    style={styles.clearBtn}
                  >
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* PIN Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PIN Keamanan</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#2D6A4F"
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={pinInputRef}
                  style={styles.textInput}
                  placeholder="Masukkan PIN Anda"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPin}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pin}
                  onChangeText={(text) => {
                    // Only allow digits
                    const digits = text.replace(/[^0-9]/g, "");
                    setPin(digits);
                    setErrorMsg(null);
                  }}
                />
                <Pressable
                  onPress={() => setShowPin(!showPin)}
                  style={styles.showPinBtn}
                >
                  <Ionicons
                    name={showPin ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.submitBtnPressed,
                loading && styles.submitBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Masuk</Text>
              )}
            </Pressable>
          </View>

          {/* Footer branding */}
          <Text style={styles.footerText}>Powered By AMA </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 24,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "normal",
  },
  appSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  clearBtn: {
    padding: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 18,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: "#D90429",
    marginLeft: 8,
    flex: 1,
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
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
  inputWrapperFocused: {
    borderColor: "#2D6A4F",
    backgroundColor: "#FFFFFF",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
    height: "100%",
    paddingLeft: 8,
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      } as any,
    }),
  },
  showPinBtn: {
    padding: 4,
  },
  submitBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#1B5E20",
  },
  submitBtnPressed: {
    backgroundColor: "#1E4634",
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
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: "auto",
    paddingTop: 32,
  },
});