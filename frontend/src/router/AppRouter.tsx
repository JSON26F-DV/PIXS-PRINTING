import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Storefront from '../views/customer/Homepage'
import LandingPage from '../views/customer/LandingPage'
import ProductDetailPage from '../views/product/ProductDetailPage'
import AddToCartPage from '../pages/AddToCart/AddToCartPage'
import SettingsPage from '../views/customer/SettingsPage'
import Transactions from '../pages/Transactions/Transactions'
import OrderSuccess from '../pages/Transactions/OrderSuccess'
import MessengerPage from '../pages/Messenger/MessengerPage'
import ScreenplatePage from '../pages/Screenplate/ScreenplatePage'
import DeletedAccount from '../views/auth/DeletedAccount'
import OrderPage from '../pages/Order/OrderPage'
import LoginPage from '../views/auth/LoginPage'
import RegisterPage from '../views/auth/RegisterPage'
import CustomerLayout from '../layouts/CustomerLayout'
import { useAuth } from '../context/AuthContext'

// Admin Layout & Views
import AdminLayout from '../layouts/AdminLayout'
import Dashboard from '../views/admin/Dashboard'
import ProductManagement from '../views/admin/ProductManagement'
import ScreenplateManagement from '../views/admin/ScreenplateManagement'
import StockAnalytics from '../views/admin/StockAnalytics'
import Accounts from '../views/admin/Accounts'
import Payroll from '../views/admin/payroll/Payroll'
import Orders from '../views/admin/Orders'
import MarketingPromotions from '../views/admin/MarketingPromotions'
import AdminSettings from '../views/admin/Settings/AdminSettings'
// import DisputeView from '../views/admin/DisputeView';
// Staff Views
import StaffOverview from '../views/staff/StaffOverview'
import StaffComHub from '../views/staff/StaffComHub'
import LiveQueue from '../pages/staff/LiveQueue'
import Attendance from '../pages/staff/Attendance'

const ProtectedRoute: React.FC<{
  children: React.ReactNode
  allowedRoles: string[]
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth()
  const location = window.location.pathname

  if (isLoading)
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white font-black text-slate-900 uppercase italic">
        Synchronizing...
      </div>
    )

  // 1. Session check
  if (!user.isLoggedIn) return <Navigate to="/" replace />

  // 2. Strict Role-to-Path Lock (RBAC)
  if (user.role === 'admin' && !location.startsWith('/admin')) {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (
    ['staff', 'technician', 'welder'].includes(user.role) &&
    !location.startsWith('/staff')
  ) {
    return <Navigate to="/staff/overview" replace />
  }

  if (user.role === 'inventory' && !location.startsWith('/inventory')) {
    return <Navigate to="/inventory/overview" replace />
  }

  if (
    user.role === 'customer' &&
    (location.startsWith('/admin') ||
      location.startsWith('/staff') ||
      location.startsWith('/inventory'))
  ) {
    return <Navigate to="/homepage" replace />
  }

  // 3. Allowed Roles check
  if (!allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard if they try to access a route they aren't allowed in
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'customer') return <Navigate to="/homepage" replace />
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const AppRouter: React.FC = () => {
  const { user, isLoading } = useAuth()

  const getHomePath = () => {
    if (user.role === 'admin') return '/admin/dashboard'
    if (['staff', 'technician', 'welder'].includes(user.role))
      return '/staff/overview'
    if (user.role === 'inventory') return '/inventory/overview'
    return '/homepage'
  }

  if (isLoading)
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white font-black text-slate-900 uppercase italic">
        Synchronizing...
      </div>
    )

  return (
    <Routes>
      <Route
        path="/"
        element={
          user.isLoggedIn ? (
            <Navigate to={getHomePath()} replace />
          ) : (
            <LandingPage />
          )
        }
      />
      <Route
        path="/login"
        element={
          user.isLoggedIn ? (
            <Navigate to={getHomePath()} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          user.isLoggedIn ? (
            <Navigate to={getHomePath()} replace />
          ) : (
            <RegisterPage />
          )
        }
      />

      {/* Customer Routes with Navbar */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/homepage" element={<Storefront />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<AddToCartPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/order-success/:orderId" element={<OrderSuccess />} />
        <Route path="/chat" element={<MessengerPage />} />
        <Route path="/screenplate" element={<ScreenplatePage />} />
        <Route path="/order" element={<OrderPage />} />
      </Route>

      <Route path="/delete-account" element={<DeletedAccount />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'inventory']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="product" element={<ProductManagement />} />
        <Route path="screenplate" element={<ScreenplateManagement />} />
        <Route path="stock" element={<StockAnalytics />} />
        <Route path="account" element={<Accounts />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="orders" element={<Orders />} />
        <Route path="message" element={<StaffComHub />} />
        <Route path="setting" element={<AdminSettings />} />
        <Route path="marketing" element={<MarketingPromotions />} />
        {/* <Route path="complaints" element={<DisputeView />} /> */}
      </Route>

      {/* Staff Routes */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['staff', 'technician', 'welder']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<StaffOverview />} />
        <Route path="livequeue" element={<LiveQueue />} />
        <Route path="orders" element={<Orders />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="chat" element={<MessengerPage />} />
        <Route path="setting" element={<AdminSettings />} />
      </Route>

      {/* Inventory Routes */}
      <Route
        path="/inventory"
        element={
          <ProtectedRoute allowedRoles={['inventory']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<StaffOverview />} />
        <Route path="orders" element={<Orders />} />
        <Route path="stock" element={<StockAnalytics />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="chat" element={<MessengerPage />} />
        <Route path="setting" element={<AdminSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter
