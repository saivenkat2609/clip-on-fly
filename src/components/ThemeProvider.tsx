import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type Theme = "indigo" | "ocean" | "sunset" | "forest" | "cyber" | "rose";
type Mode = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultMode?: Mode;
};

type ThemeProviderState = {
  theme: Theme;
  mode: Mode;
  setTheme: (theme: Theme) => void;
  setMode: (mode: Mode) => void;
};

const initialState: ThemeProviderState = {
  theme: "ocean",
  mode: "light",
  setTheme: () => null,
  setMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "ocean",
  defaultMode = "light",
  ...props
}: ThemeProviderProps) {
  const { currentUser } = useAuth();

  // Get initial theme from localStorage (BEFORE Firestore) - instant load
  const getInitialTheme = (): Theme => {
    if (currentUser) {
      const cached = localStorage.getItem(`theme_${currentUser.uid}`);
      if (cached) return cached as Theme;
    }
    return defaultTheme;
  };

  const getInitialMode = (): Mode => {
    if (currentUser) {
      const cached = localStorage.getItem(`mode_${currentUser.uid}`);
      if (cached) return cached as Mode;
    }
    return defaultMode;
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  const [mode, setMode] = useState<Mode>(getInitialMode());
  const [isLoadingTheme, setIsLoadingTheme] = useState(false); // Start as false since we have cache

  // Clean up old global localStorage keys on mount (one-time migration)
  useEffect(() => {
    const oldTheme = localStorage.getItem('theme');
    const oldMode = localStorage.getItem('mode');

    if (oldTheme || oldMode) {
      // Remove old global keys
      localStorage.removeItem('theme');
      localStorage.removeItem('mode');
    }
  }, []);

  // Sync with Firestore in background (non-blocking)
  useEffect(() => {
    async function syncWithFirestore() {
      if (currentUser) {
        try {
          const { data: userData } = await supabase
            .from('users').select('theme, mode').eq('id', currentUser.uid).maybeSingle();

          if (userData) {
            const firestoreTheme = userData.theme as Theme || defaultTheme;
            const firestoreMode = (userData as any).mode as Mode || defaultMode;

            // Only update if different from cache
            const cachedTheme = localStorage.getItem(`theme_${currentUser.uid}`);
            const cachedMode = localStorage.getItem(`mode_${currentUser.uid}`);

            if (firestoreTheme !== cachedTheme || firestoreMode !== cachedMode) {
              // UI/UX FIX #95: Remove production logging
              if (import.meta.env.DEV) {
                console.log('[ThemeProvider] Firestore theme differs from cache - updating');
              }
              setTheme(firestoreTheme);
              setMode(firestoreMode);
              localStorage.setItem(`theme_${currentUser.uid}`, firestoreTheme);
              localStorage.setItem(`mode_${currentUser.uid}`, firestoreMode);
            } else {
              if (import.meta.env.DEV) {
                console.log('[ThemeProvider] Using cached theme (matches Firestore)');
              }
            }
          }
        } catch (error) {
          console.error('Failed to sync theme from Firestore:', error);
          // Don't change current theme on error - keep using cached value
        }
      } else {
        // User signed out - reset to defaults
        setTheme(defaultTheme);
        setMode(defaultMode);
      }
    }

    syncWithFirestore();
  }, [currentUser, defaultTheme, defaultMode]);

  // Apply theme classes to document
  useEffect(() => {
    if (!isLoadingTheme) {
      const root = window.document.documentElement;

      // Remove all theme classes
      root.classList.remove("indigo", "ocean", "sunset", "forest", "cyber", "rose");

      // Remove dark class
      root.classList.remove("dark");

      // Add current theme and mode
      root.classList.add(theme);
      if (mode === "dark") {
        root.classList.add("dark");
      }
    }
  }, [theme, mode, isLoadingTheme]);

  const value = {
    theme,
    mode,
    setTheme: async (newTheme: Theme) => {
      setTheme(newTheme);

      // Store in user-specific localStorage if user is logged in
      if (currentUser) {
        localStorage.setItem(`theme_${currentUser.uid}`, newTheme);

        // Sync to Firestore
        try {
          await supabase.from('users').update({ theme: newTheme }).eq('id', currentUser.uid);
        } catch (error) {
          console.error('Failed to sync theme to Firestore:', error);
        }
      }
    },
    setMode: async (newMode: Mode) => {
      setMode(newMode);

      // Store in user-specific localStorage if user is logged in
      if (currentUser) {
        localStorage.setItem(`mode_${currentUser.uid}`, newMode);

        // Sync to Firestore
        try {
          await supabase.from('users').update({ mode: newMode }).eq('id', currentUser.uid);
        } catch (error) {
          console.error('Failed to sync mode to Firestore:', error);
        }
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
