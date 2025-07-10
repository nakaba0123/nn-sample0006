import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  children,
  fallback = null
}) => {
  const { hasPermission, hasAnyPermission } = useAuth();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = permissions.every(p => hasPermission(p));
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    hasAccess = true; // 権限指定がない場合は表示
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;