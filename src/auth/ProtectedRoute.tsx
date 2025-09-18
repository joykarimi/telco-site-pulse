
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from './AuthProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  permission: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ permission }) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
