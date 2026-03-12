import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  userId: number | null;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("auth_token");
    const email = localStorage.getItem("user_email");
    const id = localStorage.getItem("user_id");

    if (token && email && id) {
      setIsAuthenticated(true);
      setUserEmail(email);
      setUserId(parseInt(id));
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_id");
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, userId, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
