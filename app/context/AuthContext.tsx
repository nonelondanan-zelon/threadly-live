import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "~/lib/supabase";

// 1. Define what the context will share with the rest of the app
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

// 2. Create the context — this is the "broadcast channel" components tune into
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

// 3. The Provider — runs ONE listener and shares the result with everything inside it
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if someone is already logged in when the app first loads
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listen for any login or logout events that happen after load
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Clean up the listener when the app unmounts
    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Custom hook — how any component asks "who's logged in?"
export function useAuthContext() {
  return useContext(AuthContext);
}
