import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('brfn_user') || sessionStorage.getItem('brfn_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (userData, rememberMe = false) => {
    setUser(userData);
    if (rememberMe) {
      localStorage.setItem('brfn_user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('brfn_user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('brfn_user');
    sessionStorage.removeItem('brfn_token');
    localStorage.removeItem('brfn_user');
    localStorage.removeItem('brfn_token');
    localStorage.removeItem('brfn_cart');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}