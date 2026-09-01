import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  displayName: string;
  description: string;
  canManageRentals: boolean;
  canCreateEquipment: boolean;
  canResolveAlerts: boolean;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
}

const ROLE_METADATA: Record<UserRole, { displayName: string; description: string }> = {
  ADMIN: {
    displayName: 'Fleet Administrator',
    description: 'Full administrative access across fleet, check-in/out, equipment registration, and settings.',
  },
  MANAGER: {
    displayName: 'Rental Operations Manager',
    description: 'Manage equipment rentals, check-in/out operations, and operational alerts.',
  },
  VIEWER: {
    displayName: 'Auditor / Viewer',
    description: 'Read-only access to equipment telemetry, rental status, and fleet analytics.',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('cat_auth_logged_in') === 'true';
  });

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('cat_auth_email') || 'operator@caterpillar.com';
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('cat_user_role');
    return (saved as UserRole) || 'ADMIN';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('cat_user_role', newRole);
  };

  const login = (email: string, preferredRole: UserRole = 'ADMIN') => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setRoleState(preferredRole);
    localStorage.setItem('cat_auth_logged_in', 'true');
    localStorage.setItem('cat_auth_email', email);
    localStorage.setItem('cat_user_role', preferredRole);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserEmail(null);
    localStorage.removeItem('cat_auth_logged_in');
    localStorage.removeItem('cat_auth_email');
  };

  const meta = ROLE_METADATA[role] || ROLE_METADATA.MANAGER;

  const canManageRentals = role === 'ADMIN' || role === 'MANAGER';
  const canCreateEquipment = role === 'ADMIN';
  const canResolveAlerts = role === 'ADMIN' || role === 'MANAGER';

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userEmail,
        role,
        setRole,
        displayName: meta.displayName,
        description: meta.description,
        canManageRentals,
        canCreateEquipment,
        canResolveAlerts,
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
