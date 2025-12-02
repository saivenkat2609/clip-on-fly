import { createContext, useContext, useEffect, useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  theme: "indigo",
  mode: "light",
  setTheme: () => null,
  setMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "indigo",
  defaultMode = "light",
  ...props
}: ThemeProviderProps) {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

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

  // Load user's theme from Firestore when they sign in
  useEffect(() => {
    async function loadUserTheme() {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const userTheme = userData.theme as Theme || defaultTheme;
            const userMode = userData.mode as Mode || defaultMode;

            setTheme(userTheme);
            setMode(userMode);

            // Store in user-specific localStorage
            localStorage.setItem(`theme_${currentUser.uid}`, userTheme);
            localStorage.setItem(`mode_${currentUser.uid}`, userMode);
          }
        } catch (error) {
          console.error('Failed to load theme from Firestore:', error);
          // Fall back to defaults
          setTheme(defaultTheme);
          setMode(defaultMode);
        }
      } else {
        // User signed out - reset to defaults and clear user-specific storage
        setTheme(defaultTheme);
        setMode(defaultMode);

        // Clean up old localStorage entries for all users (keep only non-user-specific keys)
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('theme_') || key.startsWith('mode_')) {
            // Keep user-specific entries for future logins, but they won't be used
          }
        });
      }
      setIsLoadingTheme(false);
    }

    loadUserTheme();
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
          await updateDoc(doc(db, 'users', currentUser.uid), {
            theme: newTheme
          });
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
          await updateDoc(doc(db, 'users', currentUser.uid), {
            mode: newMode
          });
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
