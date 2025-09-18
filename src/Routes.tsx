
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import CreateUserForm from './components/UserManagement/CreateUserForm';
import RolesPage from './components/UserManagement/RolesPage';
import Assets from './pages/Assets';
import Sites from './pages/Sites';
import RevenueBreakdown from './pages/RevenueBreakdown';
import AssetMovements from './pages/AssetMovements';
import SiteProfitability from './pages/SiteProfitability';
import Settings from './pages/Settings';
import ProtectedRoute from './auth/ProtectedRoute';
import { PERMISSIONS } from './lib/roles';
import Unauthorized from './pages/Unauthorized';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/revenue-breakdown" element={<RevenueBreakdown />} />
          <Route path="/site-profitability" element={<SiteProfitability />} />
          <Route path="/settings" element={<Settings />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute permission={PERMISSIONS.ASSET_READ} />}>
            <Route path="/assets" element={<Assets />} />
          </Route>
          <Route element={<ProtectedRoute permission={PERMISSIONS.SITE_READ} />}>
            <Route path="/sites" element={<Sites />} />
          </Route>
          <Route element={<ProtectedRoute permission={PERMISSIONS.MOVEMENT_READ} />}>
            <Route path="/asset-movement-requests" element={<AssetMovements />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute permission={PERMISSIONS.USER_MANAGEMENT_READ} />}>
            <Route path="/admin" element={<Outlet />}>
              <Route index element={<Navigate to="/admin/roles" replace />} />
              <Route path="roles" element={<RolesPage />} />
              <Route element={<ProtectedRoute permission={PERMISSIONS.USER_MANAGEMENT_CREATE} />}>
                <Route path="create-user" element={<CreateUserForm />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
