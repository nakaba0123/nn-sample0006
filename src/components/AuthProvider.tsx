import React from 'react';
import { useAuthProvider } from '../hooks/useAuth';
import { User } from '../types/User';

interface AuthProviderProps {
  children: React.ReactNode;
  users: User[];
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children, users }) => {
  const auth = useAuthProvider(users);

  return (
    <auth.AuthContext.Provider value={auth}>
      {children}
    </auth.AuthContext.Provider>
  );
};

export default AuthProvider;