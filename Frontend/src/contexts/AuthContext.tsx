import { createContext, useContext, ReactNode } from 'react';

interface User {
  username: string;
  email: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  // Add other auth-related properties and methods as needed
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Add your auth logic here
  const user = null; // Replace with actual user data
  const isAuthenticated = false; // Replace with actual auth state

  return (
    <AuthContext.Provider value={{ user, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}; 