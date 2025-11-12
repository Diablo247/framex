import React, { useState } from "react";
import {
  View,
  Image,
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
import logoOne from "../../../assets/logo-one.png";
import logoTwo from "../../../assets/logo-two.png";

export default function Login({ navigation }: any) {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    let newErrors = { email: "", password: "" };
    let valid = true;

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required.";
      valid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
      valid = false;
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = "Password is required.";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    // Check network
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
      const { user, error } = await signIn(email, password);

      if (error || !user) {
        throw new Error(error?.message || "Invalid credentials. Try again.");
      }

      Toast.show({
        type: "success",
        text1: "Welcome back!",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      style={styles.container}
    >
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 40,
          gap: 10,
        }}
      >
        <Image
          source={logoOne}
          style={{
            width: 34,
            height: 33,
          }}
        />
        <Image
          source={logoTwo}
          style={{
            height: 31,
            width: 61,
          }}
        />
      </View>
      <Text style={styles.title}>Login</Text>

      {/* Email Input */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors({ ...errors, email: "" });
        }}
        style={[
          styles.input,
          errors.email && { borderColor: "red", maxWidth: 500 },
        ]}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.email ? (
        <Text style={styles.errorText}>{errors.email}</Text>
      ) : null}

      {/* Password Input */}
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors({ ...errors, password: "" });
        }}
        secureTextEntry
        style={[
          styles.input,
          errors.password && { borderColor: "red", maxWidth: 500 },
        ]}
      />
      {errors.password ? (
        <Text style={styles.errorText}>{errors.password}</Text>
      ) : null}

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6, maxWidth: 500 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={[styles.link, { marginTop: 14 }]}>
          Forgot your password?
        </Text>
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
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
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
    marginBottom: 6,
    fontSize: 16,
    width: "100%",
    maxWidth: 500,
  },
  errorText: {
    color: "red",
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
    maxWidth: 500,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { textAlign: "center", color: "#008cff", marginTop: 10, fontSize: 15 },
});
