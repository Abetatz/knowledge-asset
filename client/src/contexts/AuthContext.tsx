import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  userId: number | null;
  userRole: string | null;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = () => {
    const token = localStorage.getItem("auth_token");
    const email = localStorage.getItem("user_email");
    const id = localStorage.getItem("user_id");
    const role = localStorage.getItem("user_role");

    if (token && email && id) {
      setIsAuthenticated(true);
      setUserEmail(email);
      setUserId(parseInt(id));
      setUserRole(role);
    } else {
      setIsAuthenticated(false);
      setUserEmail(null);
      setUserId(null);
      setUserRole(null);
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
    setIsLoading(false);

    // Listen for storage changes (from other tabs or programmatic updates)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_role");
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserId(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, userId, userRole, logout, isLoading }}>
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
