import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { users, User } from "@/lib/mockData";
import { backendApi } from "@/lib/api";

export type FailureKey =
  | null
  | "S2_MALFORMED"
  | "S2_UNAUTHORIZED"
  | "S2_MISSED_CASCADE"
  | "S3_ASSESSMENT_CONFLICT"
  | "S3_UNAUTHORIZED";

const cycle: FailureKey[] = [null, "S2_MALFORMED", "S2_UNAUTHORIZED", "S2_MISSED_CASCADE", "S3_ASSESSMENT_CONFLICT", "S3_UNAUTHORIZED"];

interface Ctx {
  currentUser: User;
  failure: FailureKey;
  cycleFailure: () => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(users[1]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [failure, setFailure] = useState<FailureKey>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const cycleFailure = () => {
    const idx = cycle.indexOf(failure);
    setFailure(cycle[(idx + 1) % cycle.length]);
  };

  const login = async (username: string, password: string) => {
    const user = await backendApi.authLogin({ username, password });
    setCurrentUser(user as User);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await backendApi.authLogout();
    } catch {
      // Always clear client auth state even if server logout fails.
    }
    setCurrentUser(users[1]);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    let mounted = true;
    backendApi
      .authMe()
      .then((user) => {
        if (mounted) {
          setCurrentUser(user as User);
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setCurrentUser(users[1]);
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      failure,
      cycleFailure,
      isAuthenticated,
      authLoading,
      login,
      logout,
    }),
    [authLoading, currentUser, failure, isAuthenticated],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
