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

// Simple placeholder for Dashboard views
const DashboardPlaceholder: React.FC<{ role: string }> = ({ role }) => (
  <div className="pt-32 px-16 min-h-screen bg-slate-50">
    <div className="bg-white rounded-[48px] p-20 shadow-2xl border border-slate-100">
      <h1 className="text-6xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">{role} Dashboard</h1>
      <p className="text-slate-400 font-bold uppercase tracking-[5px] italic">Secured Production Node Access</p>
    </div>
  </div>
);

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
      
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardPlaceholder role="Administrator" />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/staff/overview" 
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <DashboardPlaceholder role="Staff" />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/inventory/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['inventory']}>
            <DashboardPlaceholder role="Inventory" />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
