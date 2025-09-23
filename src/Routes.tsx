import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import Layout from './components/Layout';
import { PERMISSIONS } from './lib/roles';
import ProtectedRoute from './auth/ProtectedRoute';
import { Suspense, lazy } from 'react';
import SuspenseFallback from './components/SuspenseFallback';

// Lazy-loaded components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Auth = lazy(() => import('./pages/Auth'));
const NotFound = lazy(() => import('./pages/NotFound'));
const CreateUserForm = lazy(() => import('./components/UserManagement/CreateUserForm'));
const UsersPage = lazy(() => import('./components/UserManagement/UsersPage')); // 1. Renamed import
const Assets = lazy(() => import('./pages/Assets'));
const Sites = lazy(() => import('./pages/Sites'));
const RevenueBreakdown = lazy(() => import('./pages/RevenueBreakdown'));
const AssetMovements = lazy(() => import('./pages/AssetMovements'));
const SiteProfitability = lazy(() => import('./pages/SiteProfitability'));
const Settings = lazy(() => import('./pages/Settings'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SuspenseFallback />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <Suspense fallback={<SuspenseFallback />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/revenue-breakdown" element={<RevenueBreakdown />} />
            <Route path="/site-profitability" element={<SiteProfitability />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<NotificationsPage />} />

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

            {/* 2. Standardized User Management Routes */}
            <Route path="/users" element={<Outlet />}>
              <Route element={<ProtectedRoute permission={PERMISSIONS.USER_MANAGEMENT_READ} />}>
                <Route index element={<UsersPage />} />
              </Route>
              <Route element={<ProtectedRoute permission={PERMISSIONS.USER_MANAGEMENT_CREATE} />}>
                <Route path="create" element={<CreateUserForm />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
