import { createContext, useContext, useState, ReactNode } from "react";
import { users, User, Role } from "@/lib/mockData";

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
  setRole: (r: Role) => void;
  failure: FailureKey;
  cycleFailure: () => void;
  notifications: number;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(users[1]); // counselor by default
  const [failure, setFailure] = useState<FailureKey>(null);

  const setRole = (r: Role) => {
    const u = users.find((x) => x.role === r) ?? users[0];
    setCurrentUser(u);
  };

  const cycleFailure = () => {
    const idx = cycle.indexOf(failure);
    setFailure(cycle[(idx + 1) % cycle.length]);
  };

  return (
    <AppContext.Provider value={{ currentUser, setRole, failure, cycleFailure, notifications: 5 }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
