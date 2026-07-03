import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const isAdmin = user?.is_admin || false;

  // Derive a normalised user object from a Supabase session
  const buildUserFromSession = (session) => {
    if (!session?.user) return null;
    const meta = session.user.user_metadata || {};
    return {
      username: meta.username || session.user.email,
      email: session.user.email,
      is_admin: false,
    };
  };

  // ----- Bootstrap: restore session on mount -----
  useEffect(() => {
    const initAuth = async () => {
      // Check for an admin stored in localStorage (admin login goes through backend)
      const adminData = localStorage.getItem('admin_user_data');
      if (adminData) {
        try {
          setUser(JSON.parse(adminData));
          setToken(localStorage.getItem('admin_access_token'));
          setIsLoading(false);
          return;
        } catch { /* fall through */ }
      }

      // Otherwise try Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(buildUserFromSession(session));
        setToken(session.access_token);
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Don't overwrite admin session
        if (localStorage.getItem('admin_user_data')) return;

        if (session) {
          setUser(buildUserFromSession(session));
          setToken(session.access_token);
        } else {
          setUser(null);
          setToken(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSupabaseConfig = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('your-project') || key.includes('your-anon-key')) {
      throw new Error('Supabase is not configured. Please add your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the frontend/.env file.');
    }
  };

  // ----- Login (regular user via Supabase, admin via backend) -----
  const login = async (emailOrUsername, password) => {
    // Try admin login via backend first
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: emailOrUsername, password }),
      });
      const data = await res.json();
      if (res.ok && data.role === 'admin') {
        const adminUser = { username: data.user.username, is_admin: true };
        localStorage.setItem('admin_access_token', data.token);
        localStorage.setItem('admin_user_data', JSON.stringify(adminUser));
        setToken(data.token);
        setUser(adminUser);
        return data;
      }
    } catch {
      // Backend unreachable — continue to Supabase
    }

    // Regular user login via Supabase (uses email)
    checkSupabaseConfig();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailOrUsername,
      password,
    });

    if (error) throw new Error(error.message);

    const sessionUser = buildUserFromSession(data.session);
    setUser(sessionUser);
    setToken(data.session.access_token);

    return { role: 'user', user: sessionUser };
  };

  // ----- Signup (regular user via Supabase) -----
  const signup = async (email, username, password) => {
    checkSupabaseConfig();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },        // stored in user_metadata
      },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  // ----- Logout -----
  const logout = useCallback(async () => {
    // Clear admin session if present
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_user_data');

    // Also clear legacy keys (from old code)
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');

    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
  }, []);

  // ----- Fetch profile (kept for backward compatibility) -----
  const fetchProfile = useCallback(async () => {
    // For admin, profile is already in state
    if (user?.is_admin) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(buildUserFromSession(session));
    }
  }, [user]);

  const value = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    signup,
    logout,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
