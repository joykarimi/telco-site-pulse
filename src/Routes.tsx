
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard'; // Import the Dashboard component
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

function AdminLayout() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/auth" element={<Auth />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} /> {/* Set Dashboard as the default route */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/revenue-breakdown" element={<RevenueBreakdown />} />
          <Route path="/asset-movement-requests" element={<AssetMovements />} />
          <Route path="/site-profitability" element={<SiteProfitability />} />
          <Route path="/settings" element={<Settings />} />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/roles" replace />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="create-user" element={<CreateUserForm />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
