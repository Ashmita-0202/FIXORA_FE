import { createContext, useState, useEffect } from "react";
import { login as loginApi, signup as signupApi } from "../api/authApi";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("fixora_user");
    const token = localStorage.getItem("fixora_token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const { data } = await loginApi(credentials);
    // Adjust these field names to match your API's actual response shape,
    // e.g. { token, user: { id, name, email, role } }
    localStorage.setItem("fixora_token", data.token);
    localStorage.setItem("fixora_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const signup = async (userData) => {
    const { data } = await signupApi(userData);
    localStorage.setItem("fixora_token", data.token);
    localStorage.setItem("fixora_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("fixora_token");
    localStorage.removeItem("fixora_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
