// screens/Profile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import defaultAvatar from "../../assets/default-img.png";
import { supabase } from "../supabaseClient";

interface Post {
  id: string;
  caption: string | null;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  liked_by_user: boolean;
}

export default function Profile({ navigation }: any) {
  const { user, signOut, setUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `id, caption, image_url, created_at, profiles!inner(username, avatar_url)`
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = await Promise.all(
        data.map(async (p: any) => {
          // Likes count
          const { count } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", p.id);

          // Whether current user liked
          const { data: liked } = await supabase
            .from("likes")
            .select("id")
            .eq("post_id", p.id)
            .eq("user_id", user.id)
            .maybeSingle();

          return {
            id: p.id,
            caption: p.caption,
            image_url: p.image_url,
            created_at: p.created_at,
            likes_count: count || 0,
            liked_by_user: !!liked,
          };
        })
      );

      setPosts(mapped);
    } catch (err: any) {
      console.error("Fetch user posts error:", err.message);
    }
  };

  useEffect(() => {
    fetchUserPosts();

    // Realtime updates for posts and likes
    const channel = supabase
      .channel("realtime-profile-posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchUserPosts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes" },
        (payload: any) => {
          // Only refresh if affected post is in our current posts
          const affectedPostId = payload.new?.post_id || payload.old?.post_id;
          if (affectedPostId && posts.some((p) => p.id === affectedPostId)) {
            fetchUserPosts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [posts]);

  const toggleLike = async (postId: string, liked: boolean) => {
    try {
      if (liked) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("likes")
          .insert([{ post_id: postId, user_id: user.id }]);
      }

      // Optimistic UI
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked_by_user: !liked,
                likes_count: liked
                  ? post.likes_count - 1
                  : post.likes_count + 1,
              }
            : post
        )
      );
    } catch (err) {
      console.error("Toggle like error:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await supabase.from("posts").delete().eq("id", postId);
      Toast.show({ type: "success", text1: "Post deleted" });
      setMenuPostId(null);
      fetchUserPosts();
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Delete failed", text2: err.message });
    }
  };

  const handleEditPost = (post: Post) => {
    navigation.navigate("CreatePost", { post });
  };

  const handleLogout = async () => {
    setShowLogoutToast(false);
    await signOut();
    Toast.show({ type: "success", text1: "Logged out", visibilityTime: 1500 });
  };

  const username = user?.username || "User";
  const email = user?.email || "No email";
  const avatar = user?.avatar ? { uri: user.avatar } : defaultAvatar;

  return (
    <View
      style={{
        width: "100%",
        height: "auto",
        flex: 1,
        backgroundColor: "#ffffffff",
      }}
    >
      <View style={styles.container}>
        {/* Profile header */}
        <View style={styles.header}>
          <Image source={avatar} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.postCount}>Posts: {posts.length}</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditProfile", { user, onUpdate: setUser })
            }
            style={{ marginRight: 10 }}
          >
            <Ionicons name="create-outline" size={24} color="#007bff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowLogoutToast(true)}>
            <Ionicons name="log-out-outline" size={24} color="#ff4d4f" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Your Posts</Text>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image source={avatar} style={styles.postAvatar} />
                <Text style={styles.postUsername}>{username}</Text>
                <TouchableOpacity
                  onPress={() =>
                    setMenuPostId(menuPostId === item.id ? null : item.id)
                  }
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#555" />
                </TouchableOpacity>
              </View>

              {item.image_url && (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.postImage}
                />
              )}

              {item.caption && (
                <Text style={styles.postText}>{item.caption}</Text>
              )}

              <View style={styles.postFooter}>
                <Text style={styles.postDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <View style={styles.likes}>
                  <TouchableOpacity
                    onPress={() => toggleLike(item.id, item.liked_by_user)}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <Ionicons
                      name={item.liked_by_user ? "heart" : "heart-outline"}
                      size={18}
                      color="#ff4d4f"
                    />
                    <Text style={styles.likeText}>{item.likes_count}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Three-dot menu */}
              {menuPostId === item.id && (
                <View style={styles.menuModal}>
                  <TouchableOpacity
                    onPress={() => handleEditPost(item)}
                    style={styles.menuButton}
                  >
                    <Text>Edit Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeletePost(item.id)}
                    style={styles.menuButton}
                  >
                    <Text style={{ color: "#ff4d4f" }}>Delete Post</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />

        {/* Logout Toast */}
        {showLogoutToast && (
          <TouchableWithoutFeedback onPress={() => setShowLogoutToast(false)}>
            <View style={styles.toastOverlay}>
              <View style={styles.toastModal}>
                <Text style={styles.toastText}>
                  Are you sure you want to logout?
                </Text>
                <View style={styles.toastButtons}>
                  <TouchableOpacity
                    onPress={() => setShowLogoutToast(false)}
                    style={[styles.toastButton, { backgroundColor: "#ccc" }]}
                  >
                    <Text>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleLogout}
                    style={[styles.toastButton, { backgroundColor: "#ff4d4f" }]}
                  >
                    <Text style={{ color: "#fff" }}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}

        <Toast />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    width: "100%",
    marginHorizontal: "auto",
    maxWidth: 650,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
    maxWidth: 650,
  },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 15 },
  username: { fontSize: 20, fontWeight: "700", color: "#111" },
  email: { color: "#666", fontSize: 14 },
  postCount: { color: "#333", fontSize: 14, marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  postCard: {
    marginBottom: 16,
    borderColor: "#008CFF",
    borderWidth: 2,
    borderRadius: 24,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
  },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  postUsername: { fontWeight: "600", fontSize: 14, flex: 1, color: "#111" },
  postImage: { width: "100%", height: 250 },
  postText: { padding: 10, fontSize: 15, color: "#111" },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  postDate: { fontSize: 12, color: "#999" },
  likes: { flexDirection: "row", alignItems: "center" },
  likeText: { marginLeft: 4, color: "#ff4d4f", fontWeight: "600" },
  menuModal: {
    position: "absolute",
    top: 35,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,
  },
  menuButton: { paddingVertical: 5, paddingHorizontal: 10 },
  toastOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  toastModal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  toastText: { fontSize: 16, marginBottom: 15, textAlign: "center" },
  toastButtons: { flexDirection: "row", justifyContent: "space-between" },
  toastButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
});
