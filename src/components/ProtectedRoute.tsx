import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getHomePath, isAdminRole } from '../utils/roles';
import type { AppRole } from '../types';

interface Props {
  children: ReactNode;
  roles?: AppRole[];
}

function roleAllowed(userRole: AppRole, roles: AppRole[]): boolean {
  if (roles.includes(userRole)) return true;
  if (roles.includes('KITCHEN') && userRole === 'BAR') return true;
  if (roles.includes('WAITER') && userRole === 'SENIOR_WAITER') return true;
  if (roles.some(isAdminRole) && isAdminRole(userRole)) return true;
  return false;
}

export function ProtectedRoute({ children, roles }: Props) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  if (!user || !accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0 && !roleAllowed(user.role, roles)) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  return children;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }
  return children;
}
