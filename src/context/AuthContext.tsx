import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface AuthContextType {
  user: { id: number | null; email: string; role: 'admin' | 'student' | 'organizer' | null; name?: string; college?: string } | null;
  login: (id: number | null, email: string, role: 'admin' | 'student' | 'organizer', name?: string, college?: string) => void;
  logout: () => void;
  loading: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: number | null; email: string; role: 'admin' | 'student' | 'organizer' | null; name?: string; college?: string } | null>(() => {
    // Initialize user from sessionStorage
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true); // Initialize loading to true

  useEffect(() => {
    // Persist user to sessionStorage whenever it changes
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user');
    }
    setLoading(false); // Set loading to false after user is initialized/persisted
  }, [user]);

  const login = (id: number | null, email: string, role: 'admin' | 'student' | 'organizer', name?: string, college?: string) => {
    setUser({ id, email, role, name, college });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
