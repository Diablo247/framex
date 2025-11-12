import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import defaultAvatar from "../../assets/default-img.png";

interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  created_at: string;
  author: { username: string; avatar_url: string | null };
  likes_count: number;
  liked_by_user: boolean;
}

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch posts (and their authors + likes)
  const fetchPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from("posts")
        .select(
          `
          id,
          user_id,
          caption,
          image_url,
          created_at,
          profiles!inner(username, avatar_url)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = await Promise.all(
        postsData.map(async (p: any) => {
          const { count } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", p.id);

          const { data: liked } = await supabase
            .from("likes")
            .select("id")
            .eq("post_id", p.id)
            .eq("user_id", user.id)
            .maybeSingle();

          return {
            id: p.id,
            user_id: p.user_id,
            caption: p.caption,
            image_url: p.image_url,
            created_at: p.created_at,
            author: {
              username: p.profiles.username,
              avatar_url: p.profiles.avatar_url,
            },
            likes_count: count || 0,
            liked_by_user: !!liked,
          };
        })
      );

      setPosts(mapped);
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Real-time updates for posts (inserted or deleted)
  useEffect(() => {
    fetchPosts();

    const postsChannel = supabase
      .channel("realtime-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          console.log("New post added:", payload.new);
          fetchPosts(); // refresh on new post
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, []);

  // ✅ Auto-refresh likes every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ Like/unlike toggle
  const toggleLike = async (postId: string, liked: boolean) => {
    try {
      if (!user?.id) return;

      if (liked) {
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
      } else {
        await supabase.from("likes").insert([
          {
            user_id: user.id,
            post_id: postId,
          },
        ]);
      }

      // Optimistic update
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View
      style={{
        width: "100%",
        height: "auto",
        flex: 1,
        backgroundColor: "#ffffffff",
      }}
    >
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        style={{
          padding: 10,
          flex: 1,
          marginHorizontal: "auto",
          maxWidth: 650,
          width: "100%",
        }}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image
                source={
                  item.author.avatar_url
                    ? { uri: item.author.avatar_url }
                    : defaultAvatar
                }
                style={styles.avatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.username}>{item.author.username}</Text>
              </View>
            </View>

            {item.image_url && (
              <Image
                source={{ uri: item.image_url }}
                style={styles.postImage}
              />
            )}
            {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
            <View
              style={{
                flexDirection: "row",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 10,
              }}
            >
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.likes}
                  onPress={() => toggleLike(item.id, item.liked_by_user)}
                >
                  <Ionicons
                    name={item.liked_by_user ? "heart" : "heart-outline"}
                    size={20}
                    color="#ff4d4f"
                  />
                  <Text style={styles.likeCount}>{item.likes_count}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  postCard: {
    borderColor: "#008CFF",

    maxWidth: 650,
    borderWidth: 2,
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    paddingBottom: 10,
  },
  postHeader: { flexDirection: "row", alignItems: "center", padding: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderColor: "#008CFF",
    borderWidth: 2,
  },
  username: { fontWeight: "600", fontSize: 15, color: "#111" },
  date: { fontSize: 12, color: "#888" },
  postImage: { width: "100%", height: 250 },
  caption: { padding: 10, fontSize: 15, color: "#111" },
  footer: { flexDirection: "row", alignItems: "center" },
  likes: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  likeCount: { marginLeft: 5, color: "#ff4d4f", fontWeight: "500" },
});
