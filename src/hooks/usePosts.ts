// hooks/usePosts.ts
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export const usePosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        image_url,
        caption,
        likes,
        created_at,
        profiles!inner(username, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();

    // Subscribe to real-time changes in posts
    const postSubscription = supabase
      .channel("public:posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          fetchPosts(); // refetch on any insert/update/delete
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postSubscription);
    };
  }, []);

  return { posts, loading };
};
