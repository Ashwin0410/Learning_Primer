import { createContext, useContext, useState, type ReactNode } from "react";
import { clearToken, getToken, setToken } from "../lib/api";

interface AuthState {
  token: string | null;
  learnerName: string;
  signIn: (token: string, learnerName: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [learnerName, setLearnerName] = useState<string>(
    localStorage.getItem("primer_learner") || "there"
  );

  const signIn = (t: string, name: string) => {
    setToken(t);
    localStorage.setItem("primer_learner", name);
    setTokenState(t);
    setLearnerName(name);
  };

  const signOut = () => {
    clearToken();
    setTokenState(null);
  };

  return (
    <AuthContext.Provider value={{ token, learnerName, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
