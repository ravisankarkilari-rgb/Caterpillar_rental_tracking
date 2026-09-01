import React, { createContext, useContext, useState } from 'react';
import { UserRole } from '../types';
import { api, getErrorMessage } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  username: string | null;
  userEmail: string | null;
  token: string | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  displayName: string;
  description: string;
  isAdmin: boolean;
  isManager: boolean;
  isViewer: boolean;
  canManageRentals: boolean;
  canCreateEquipment: boolean;
  canEditEquipment: boolean;
  canDeactivateEquipment: boolean;
  canResolveAlerts: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canManageEntities: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
}

const ROLE_METADATA: Record<UserRole, { displayName: string; description: string }> = {
  ADMIN: {
    displayName: 'Fleet System Administrator',
    description: 'Full administrative control over users, settings, fleet master data, and operations.',
  },
  MANAGER: {
    displayName: 'Rental Operations Manager',
    description: 'Manage rental operations, check-in/out, equipment assignments, and operational alerts.',
  },
  VIEWER: {
    displayName: 'Fleet Monitor / Auditor',
    description: 'Read-only access to fleet telemetry, rental records, alerts, and analytics.',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('cat_auth_token');
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('cat_auth_logged_in') === 'true' && !!localStorage.getItem('cat_auth_token');
  });

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('cat_auth_email') || 'admin@caterpillar.com';
  });

  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem('cat_user_id') || 'USR_ADMIN01';
  });

  const [username, setUsername] = useState<string | null>(() => {
    return localStorage.getItem('cat_username') || 'admin';
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('cat_user_role');
    return (saved as UserRole) || 'ADMIN';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('cat_user_role', newRole);
  };

  const login = async (email: string, password?: string) => {
    try {
      const res = await api.login({ email, password });
      const userRole = (res.role as UserRole) || 'ADMIN';

      setToken(res.access_token);
      setIsAuthenticated(true);
      setUserEmail(res.email);
      setUserId(res.user_id);
      setUsername(res.username);
      setRoleState(userRole);

      localStorage.setItem('cat_auth_token', res.access_token);
      localStorage.setItem('cat_auth_logged_in', 'true');
      localStorage.setItem('cat_auth_email', res.email);
      localStorage.setItem('cat_user_id', res.user_id);
      localStorage.setItem('cat_username', res.username);
      localStorage.setItem('cat_user_role', userRole);
    } catch (err: any) {
      const msg = getErrorMessage(err);
      throw new Error(msg);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setToken(null);
    setUserEmail(null);
    setUserId(null);
    setUsername(null);

    localStorage.removeItem('cat_auth_token');
    localStorage.removeItem('cat_auth_logged_in');
    localStorage.removeItem('cat_auth_email');
    localStorage.removeItem('cat_user_id');
    localStorage.removeItem('cat_username');
  };

  const meta = ROLE_METADATA[role] || ROLE_METADATA.MANAGER;

  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';
  const isViewer = role === 'VIEWER';

  const canManageRentals = role === 'ADMIN' || role === 'MANAGER';
  const canCreateEquipment = role === 'ADMIN';
  const canEditEquipment = role === 'ADMIN';
  const canDeactivateEquipment = role === 'ADMIN';
  const canResolveAlerts = role === 'ADMIN' || role === 'MANAGER';
  const canManageUsers = role === 'ADMIN';
  const canManageSettings = role === 'ADMIN';
  const canManageEntities = role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userId,
        username,
        userEmail,
        token,
        role,
        setRole,
        displayName: meta.displayName,
        description: meta.description,
        isAdmin,
        isManager,
        isViewer,
        canManageRentals,
        canCreateEquipment,
        canEditEquipment,
        canDeactivateEquipment,
        canResolveAlerts,
        canManageUsers,
        canManageSettings,
        canManageEntities,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
