import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '../types/User';
import { Role, DEFAULT_ROLES, Permission } from '../types/Role';

interface AuthContextType {
  currentUser: User | null;
  roles: Role[];
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  getUserRole: () => Role | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = (users: User[]) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    // 初期ロールを設定
    const initialRoles: Role[] = DEFAULT_ROLES.map((role, index) => ({
      ...role,
      id: `role_${index + 1}`,
      createdAt: new Date().toISOString()
    }));
    setRoles(initialRoles);

    // デモ用：最初の管理者ユーザーを自動ログイン
    const adminUser = users.find(user => user.role === 'admin');
    if (adminUser) {
      setCurrentUser(adminUser);
    }
  }, [users]);

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const getUserRole = (): Role | null => {
    if (!currentUser) return null;
    return roles.find(role => role.name === currentUser.role) || null;
  };

  const hasPermission = (permission: string): boolean => {
    const userRole = getUserRole();
    if (!userRole) return false;
    return userRole.permissions.some(p => p.name === permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  return {
    currentUser,
    roles,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    getUserRole,
    AuthContext
  };
};