
import { useAuth } from './useAuth';

export const usePermissions = () => {
    const { hasPermission, role, loading } = useAuth();
    return { hasPermission, role, loading };
};
