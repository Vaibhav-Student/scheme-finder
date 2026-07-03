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
    const email = session.user.email || '';
    const is_admin = email.toLowerCase() === 'admin@example.com' || 
                     email.toLowerCase().startsWith('admin@') || 
                     meta.role === 'admin' || 
                     meta.is_admin === true;
    return {
      username: meta.username || email,
      email: email,
      is_admin: is_admin,
    };
  };

  // ----- Bootstrap: restore session on mount -----
  useEffect(() => {
    const initAuth = async () => {
      // Try Supabase session
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

  // ----- Login (via Supabase) -----
  const login = async (emailOrUsername, password) => {
    checkSupabaseConfig();

    let email = emailOrUsername;
    // Map standard username 'admin' to its default email for Supabase authentication
    if (email === 'admin') {
      email = 'admin@example.com';
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    const sessionUser = buildUserFromSession(data.session);
    setUser(sessionUser);
    setToken(data.session.access_token);

    return { role: sessionUser.is_admin ? 'admin' : 'user', user: sessionUser };
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
