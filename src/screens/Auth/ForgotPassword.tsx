import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../../context/AuthContext";

export default function ForgotPassword({ navigation }: any) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required.";
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value)) return "Please enter a valid email address.";
    return null;
  };

  const handleReset = async () => {
    const emailValidation = validateEmail(email);
    setEmailError(emailValidation);

    if (emailValidation) return;

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Toast.show({
        type: "error",
        text1: "No Internet Connection",
        text2: "Please check your connection and try again.",
      });
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      Toast.show({
        type: "success",
        text1: "Check your inbox",
        text2: "A password reset link has been sent to your email.",
      });
      setEmail("");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Something went wrong. Try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Forgot Password</Text>

      <View style={{ marginBottom: 10 }}>
        <TextInput
          placeholder="Enter your email"
          value={email}
          onChangeText={handleEmailChange}
          style={[
            styles.input,
            emailError ? { borderColor: "#dc3545" } : {},
          ]}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {emailError && <Text style={styles.errorText}>{emailError}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.link}>Don’t have an account? Sign up</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
    color: "#111",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 13,
    marginTop: 5,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { textAlign: "center", color: "#007bff", marginTop: 20, fontSize: 15 },
});
