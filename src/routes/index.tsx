import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuestOnly, ProtectedRoute } from '../components/ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { LoginPage } from '../pages/LoginPage';
import { WaiterHallPage } from '../pages/waiter/WaiterHallPage';
import { WaiterOrderPage } from '../pages/waiter/WaiterOrderPage';
import { KitchenPage } from '../pages/kitchen/KitchenPage';
import { CashierPage } from '../pages/cashier/CashierPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { MenuPage } from '../pages/admin/MenuPage';
import { HallsPage } from '../pages/admin/HallsPage';
import { EmployeesPage } from '../pages/admin/EmployeesPage';
import { RolesPage } from '../pages/admin/RolesPage';
import { PrintersPage } from '../pages/admin/PrintersPage';
import { DiscountsPage } from '../pages/admin/DiscountsPage';
import { ReportsPage } from '../pages/admin/ReportsPage';
import { AuditPage } from '../pages/admin/AuditPage';
import { SettingsPage } from '../pages/admin/SettingsPage';
import { useAuthStore } from '../stores/authStore';
import { getHomePath } from '../utils/roles';

function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getHomePath(user.role)} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />

        <Route
          path="/waiter"
          element={
            <ProtectedRoute roles={['WAITER', 'SENIOR_WAITER', 'OWNER', 'ADMIN', 'MANAGER']}>
              <WaiterHallPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiter/orders/:orderId"
          element={
            <ProtectedRoute roles={['WAITER', 'SENIOR_WAITER', 'OWNER', 'ADMIN', 'MANAGER']}>
              <WaiterOrderPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kitchen"
          element={
            <ProtectedRoute roles={['KITCHEN', 'BAR', 'OWNER', 'ADMIN', 'MANAGER']}>
              <KitchenPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cashier"
          element={
            <ProtectedRoute roles={['CASHIER', 'OWNER', 'ADMIN', 'MANAGER']}>
              <CashierPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['OWNER', 'ADMIN', 'MANAGER']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="halls" element={<HallsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="printers" element={<PrintersPage />} />
          <Route path="discounts" element={<DiscountsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
