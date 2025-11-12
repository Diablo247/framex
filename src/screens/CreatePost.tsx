import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import defaultAvatar from "../../assets/default-img.png";

const CLOUD_NAME = "dhkjho8pc";
const UPLOAD_PRESET = "framez";

// Upload helper
const uploadToCloudinary = async (uri: string) => {
  try {
    const formData = new FormData();
    if (Platform.OS === "web") {
      formData.append("file", uri);
    } else {
      const fileParts = uri.split("/");
      const fileName = fileParts[fileParts.length - 1];
      formData.append("file", {
        uri,
        type: "image/jpeg",
        name: fileName,
      } as any);
    }
    formData.append("upload_preset", UPLOAD_PRESET);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url;
  } catch (err: any) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
};

export default function CreatePost({ navigation, route }: any) {
  const { user } = useAuth();

  const [caption, setCaption] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCaption("");
    setImageUri(null);
    // Clear any post param to prevent accidental editing
    if (route.params?.post) route.params.post = undefined;
  };

  // Handle focus/blur to populate edit or reset form
  useEffect(() => {
    const focusListener = navigation.addListener("focus", () => {
      const postToEdit = route.params?.post;
      if (postToEdit) {
        setCaption(postToEdit.caption || "");
        setImageUri(postToEdit.image_url || null);
      } else {
        resetForm();
      }
    });

    const blurListener = navigation.addListener("blur", () => {
      resetForm();
    });

    return () => {
      focusListener();
      blurListener();
    };
  }, [navigation, route.params]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Image selection failed",
        text2: error.message,
      });
    }
  };

  const handlePost = async () => {
    if (!caption && !imageUri) {
      Toast.show({ type: "error", text1: "Add text or an image" });
      return;
    }

    try {
      setLoading(true);
      let uploadedUrl: string | null = imageUri;

      if (imageUri && !imageUri.startsWith("http")) {
        uploadedUrl = await uploadToCloudinary(imageUri);
      }

      const postToEdit = route.params?.post;

      if (postToEdit) {
        const { error } = await supabase
          .from("posts")
          .update({ caption, image_url: uploadedUrl })
          .eq("id", postToEdit.id);
        if (error) throw error;
        Toast.show({ type: "success", text1: "Post updated!" });
      } else {
        const { error } = await supabase.from("posts").insert([
          {
            user_id: user.id,
            caption,
            image_url: uploadedUrl,
            likes: 0,
          },
        ]);
        if (error) throw error;
        Toast.show({ type: "success", text1: "Post created!" });
      }

      resetForm(); // Reset after every submit
      navigation.goBack();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: route.params?.post ? "Update failed" : "Post failed",
        text2: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>
        {route.params?.post ? "Edit Post" : "Create Post"}
      </Text>
      <View style={styles.authorContainer}>
        <Image
          source={user?.avatar ? { uri: user.avatar } : defaultAvatar}
          style={styles.authorAvatar}
        />
        <Text style={styles.authorName}>{user?.username || "User"}</Text>
      </View>
      <TextInput
        placeholder="What's on your mind?"
        value={caption}
        onChangeText={setCaption}
        multiline
        style={styles.input}
      />

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      <TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
        <Text style={styles.pickText}>Choose Image</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.postBtn}
        onPress={handlePost}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.postText}>
            {route.params?.post ? "Update" : "Post"}
          </Text>
        )}
      </TouchableOpacity>

      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    width: "100%",
    maxWidth: 650,
    marginHorizontal: "auto",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
    maxWidth: 650,
    marginHorizontal: "auto",
  },
  authorAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  authorName: { fontSize: 16, fontWeight: "600", color: "#111" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    textAlignVertical: "top",
    width: "100%",
    maxWidth: 650,
    marginHorizontal: "auto",
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginBottom: 15,

    maxWidth: 650,
    marginHorizontal: "auto",
  },
  pickBtn: {
    borderWidth: 1,
    borderColor: "#007bff",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
    maxWidth: 650,
    marginHorizontal: "auto",
  },
  pickText: {
    color: "#007bff",
    fontWeight: "600",
  },
  postBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    maxWidth: 650,
    marginHorizontal: "auto",
  },
  postText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
