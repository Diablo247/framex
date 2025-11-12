import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import defaultAvatar from "../../assets/default-img.png";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import { supabase } from "../supabaseClient";

export default function EditProfile({ navigation }: any) {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [loading, setLoading] = useState(false);

  // ✅ Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        await uploadAvatar(localUri);
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Image selection failed",
        text2: err.message,
      });
    }
  };

  // ✅ Upload image to Cloudinary
  const uploadAvatar = async (uri: string) => {
    try {
      setLoading(true);
      const uploadedUrl = await uploadToCloudinary(uri);
      setAvatarUrl(uploadedUrl);

      // Update user context immediately
      setUser((prev: any) => ({
        ...prev,
        avatar: uploadedUrl,
      }));

      Toast.show({ type: "success", text1: "Avatar updated!" });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Upload failed",
        text2: err.message || "Could not upload image.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save profile (auth + profiles table)
  const handleSave = async () => {
    try {
      if (!user?.id) {
        Toast.show({ type: "error", text1: "No user logged in." });
        return;
      }

      setLoading(true);

      // 1️⃣ Update Supabase Auth metadata (optional, good for future sync)
      const { error: authError } = await supabase.auth.updateUser({
        data: { username, avatar_url: avatarUrl },
      });
      if (authError) throw authError;

      // 2️⃣ Update the profiles table (this ensures Feed works properly)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username, avatar_url: avatarUrl })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 3️⃣ Update user context locally
      setUser((prev: any) => ({
        ...prev,
        username,
        avatar: avatarUrl,
      }));

      Toast.show({ type: "success", text1: "Profile updated successfully!" });
      navigation.goBack();
    } catch (err: any) {
      console.error("Profile update error:", err);
      Toast.show({
        type: "error",
        text1: "Update failed",
        text2: err.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={avatarUrl ? { uri: avatarUrl } : defaultAvatar}
          style={styles.avatar}
        />
      </TouchableOpacity>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
  },
  title: {
    marginTop: 50,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111",
    textAlign: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    width: "100%",
    maxWidth: 650,
  },
  button: {
    backgroundColor: "#008cff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
    maxWidth: 650,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
