// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";


interface AuthContextProps {
  user: any;
  loading: boolean;
  setUser: (user: any) => void;
  signUp: (email: string, password: string, username?: string) => Promise<{ user: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ user: any; error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (supabaseUser: any) => {
    if (!supabaseUser) return null;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username: supabaseUser.user_metadata?.username || "User",
      avatar: supabaseUser.user_metadata?.avatar_url || null,
      ...supabaseUser,
    };
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        // ✅ Try to get the persisted session
        const { data, error } = await supabase.auth.getSession();
        if (error) console.log("Session load error:", error);

        if (data?.session) {
          setUser(normalizeUser(data.session.user));
        }

        // ✅ Listen for changes to auth state (login, logout, refresh)
        const { data: listener } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (session?.user) {
              setUser(normalizeUser(session.user));
            } else {
              setUser(null);
            }
          }
        );

        return () => {
          listener.subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Error loading session:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

const signUp = async (email: string, password: string, username?: string) => {
  // 1️⃣ Sign up user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }, // optional metadata
  });

  if (error || !data.user) return { user: null, error };

  const newUser = normalizeUser(data.user);

  // 2️⃣ Create profile row in 'profiles' table
  const { error: profileError } = await supabase
    .from("profiles")
    .insert([
      {
        id: newUser.id,
        username: username || "User",
        avatar_url: null, // default avatar if needed
      },
    ]);

  if (profileError) {
    console.error("Profile creation error:", profileError);
    return { user: null, error: profileError };
  }

  // ✅ Update context immediately
  setUser(newUser);

  return { user: newUser, error: null };
};


  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data.user) setUser(normalizeUser(data.user));
    return { user: normalizeUser(data?.user), error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
