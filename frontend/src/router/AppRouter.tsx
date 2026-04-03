import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Storefront from '../views/customer/Homepage';
import Login from '../views/auth/Login';
import ProductDetailPage from '../views/product/ProductDetailPage';
import AddToCartPage from '../pages/AddToCart/AddToCartPage';
import SettingsPage from '../views/customer/SettingsPage';
import Transactions from '../pages/Transactions/Transactions';
import OrderSuccess from '../pages/Transactions/OrderSuccess';
import MessengerPage from '../pages/Messenger/MessengerPage';
import ScreenplatePage from '../pages/Screenplate/ScreenplatePage';
import { useAuth } from '../context/AuthContext';

// Admin Layout & Views
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../views/admin/Dashboard';
import ProductManagement from '../views/admin/ProductManagement';
import ScreenplateManagement from '../views/admin/ScreenplateManagement';
import StockAnalytics from '../views/admin/StockAnalytics';
// import Accounts from '../views/admin/Accounts';
// import Payroll from '../views/admin/Payroll';
// import MarketingPromotions from '../views/admin/MarketingPromotions';
// import DisputeView from '../views/admin/DisputeView';
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-white text-slate-900 font-black italic uppercase">Synchronizing...</div>;
  
  if (!user.isLoggedIn) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Storefront />} />
      <Route path="/login" element={<Login />} />
      <Route path="/product/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<AddToCartPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/order-success/:orderId" element={<OrderSuccess />} />
      <Route path="/chat" element={<MessengerPage />} />
      <Route path="/screenplate" element={<ScreenplatePage />} />
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'staff', 'inventory']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="product" element={<ProductManagement />} />
        <Route path="screenplate" element={<ScreenplateManagement />} />
        <Route path="stock" element={<StockAnalytics />} />
        {/* <Route path="accounts" element={<Accounts />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="marketing" element={<MarketingPromotions />} />
        <Route path="complaints" element={<DisputeView />} /> */}
      </Route>
      


      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
