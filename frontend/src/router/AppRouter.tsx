import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Storefront from '../views/customer/Homepage'
import LandingPage from '../views/customer/LandingPage'
import ProductDetailPage from '../views/product/ProductDetailPage'
import AddToCartPage from '../pages/AddToCart/AddToCartPage'
import SettingsPage from '../views/customer/SettingsPage'
import Transactions from '../pages/Transactions/Transactions'
import PaymentSuccess from '../pages/Transactions/PaymentSuccess'
import OrderSuccess from '../pages/Transactions/OrderSuccess'
import MessengerPage from '../pages/Messenger/MessengerPage'
import ScreenplatePage from '../pages/Screenplate/ScreenplatePage'
import DeletedAccount from '../views/auth/DeletedAccount'
import OrderPage from '../pages/Order/OrderPage'
import DiscoveryPage from '../pages/Discovery/DiscoveryPage'
import LoginPage from '../views/auth/LoginPage'
import RegisterPage from '../views/auth/RegisterPage'
import ForgotPasswordPage from '../views/auth/ForgotPasswordPage'
import ChangeEmailPage from '../views/auth/ChangeEmailPage'
import Test from '../test/Test'
import CustomerLayout from '../layouts/CustomerLayout'
import { useAuth } from '../context/AuthContext'
import { getHomePathForRole } from '../utils/authRouting'

// Admin Layout & Views
import AdminLayout from '../layouts/AdminLayout'
import Dashboard from '../views/admin/Dashboard'
import ProductManagement from '../views/admin/ProductManagement'
import ManageProduct from '../views/admin/management/ManageProduct'
import ScreenplateManagement from '../views/admin/ScreenplateManagement'
import ManageScreenplate from '../views/admin/management/ManageScreenplate'
import StockAnalytics from '../views/admin/StockAnalytics'
import ManageStock from '../views/admin/management/ManageStock'
import Accounts from '../views/admin/Accounts'
import ManageEmployee from '../views/admin/management/ManageEmployee'
import ManageCustomer from '../views/admin/management/ManageCustomer'
import DeleteAccountPage from '../views/admin/management/DeleteAccountPage'
import ManageAttendance from '../views/admin/management/ManageAttendance'
import Payroll from '../views/admin/payroll/Payroll'
import Orders from '../views/admin/Orders'
import ManageOrder from '../views/admin/management/ManageOrder'
import MarketingPromotions from '../views/admin/MarketingPromotions'
import EmployeeSettings from '../views/admin/Settings/EmployeeSettings'
import PayCode from '../views/admin/PayCode'
import RefundPage from '../views/admin/Refund'
import AuditLog from '../views/admin/AuditLog'
import BlockedIps from '../views/admin/BlockedIps'
import Notifications from '../views/admin/Notifications'
// import DisputeView from '../views/admin/DisputeView';
// Staff Views
import StaffOverview from '../views/staff/StaffOverview'

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

  const role = user?.role ?? 'guest'

  // 2. Strict Role-to-Path Lock (RBAC) — path from customers.role / employees.role
  if (role === 'admin' && !location.startsWith('/admin')) {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (
    ['staff', 'technician'].includes(role) &&
    !location.startsWith('/staff')
  ) {
    return <Navigate to="/staff/overview" replace />
  }

  if (role === 'inventory' && !location.startsWith('/inventory')) {
    return <Navigate to="/inventory/overview" replace />
  }

  if (
    role === 'customer' &&
    (location.startsWith('/admin') ||
      location.startsWith('/staff') ||
      location.startsWith('/inventory'))
  ) {
    return <Navigate to="/homepage" replace />
  }

  // 3. Allowed Roles check
  if (!allowedRoles.includes(role)) {
    return <Navigate to={getHomePathForRole(role)} replace />
  }

  return <>{children}</>
}

const NotFoundPage: React.FC = () => {
  const { user } = useAuth()
  const location = window.location.pathname

  // If logged in, redirect to their dashboard
  if (user.isLoggedIn) {
    const homePath = getHomePathForRole(user.role)
    return <Navigate replace to={homePath} />
  }

  // If not logged in, show error and allow refresh
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-white">
      <h1 className="text-6xl font-bold text-slate-900">404</h1>
      <p className="mt-4 text-lg text-slate-500">Page not found</p>
      <p className="mt-2 text-sm text-slate-400">Current path: {location}</p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => window.location.href = '/'}
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          Go to Homepage
        </button>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}

const AppRouter: React.FC = () => {
  const { user, isLoading } = useAuth()

  const getHomePath = () => getHomePathForRole(user?.role)

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
      <Route
        path="/forgot-password"
        element={
          user.isLoggedIn ? (
            <Navigate to={getHomePath()} replace />
          ) : (
            <ForgotPasswordPage />
          )
        }
      />
      <Route
        path="/change-email"
        element={
          user.isLoggedIn ? (
            <Navigate to={getHomePath()} replace />
          ) : (
            <ChangeEmailPage />
          )
        }
      />
      <Route path="/test" element={<Test />} />

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
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/order-success/:orderId" element={<OrderSuccess />} />
        <Route path="/chat" element={<MessengerPage />} />
        <Route path="/screenplate" element={<ScreenplatePage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/discovery" element={<DiscoveryPage />} />
      </Route>

      <Route path="/delete-account" element={<DeletedAccount />} />
      
      {/* Standalone Admin Message Route */}
      <Route
        path="/admin/message"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MessengerPage />
          </ProtectedRoute>
        }
      />

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
        <Route path="product/manage" element={<ManageProduct />} />
        <Route path="product/manage/:product_id" element={<ManageProduct />} />
        <Route path="screenplate" element={<ScreenplateManagement />} />
        <Route path="screenplate/manage" element={<ManageScreenplate />} />
        <Route path="screenplate/manage/:id" element={<ManageScreenplate />} />
        <Route path="stock" element={<StockAnalytics />} />
        <Route path="stock/manage/:product_id" element={<ManageStock />} />
        <Route path="account" element={<Accounts />} />
        <Route path="account/manage/employee" element={<ManageEmployee />} />
        <Route path="account/manage/employee/:id" element={<ManageEmployee />} />
        <Route path="account/manage/customer" element={<ManageCustomer />} />
        <Route path="account/manage/customer/:id" element={<ManageCustomer />} />
        <Route path="accounts/delete/:id" element={<DeleteAccountPage />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="payroll/manage/:id" element={<ManageAttendance />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/manage" element={<ManageOrder />} />
        <Route path="orders/manage/:customerId" element={<ManageOrder />} />
        <Route path="setting" element={<EmployeeSettings />} />
        <Route path="setting/:section" element={<EmployeeSettings />} />
        <Route path="marketing" element={<MarketingPromotions />} />
        <Route path="generatecode" element={<PayCode />} />
        <Route path="refund" element={<RefundPage />} />
        <Route path="auditlog" element={<AuditLog />} />
        <Route path="blocked-ips" element={<BlockedIps />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Staff Routes */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['staff', 'technician']}>
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
        <Route path="setting" element={<EmployeeSettings />} />
        <Route path="setting/:section" element={<EmployeeSettings />} />
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
        <Route path="stock/manage/:product_id" element={<ManageStock />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="chat" element={<MessengerPage />} />
        <Route path="setting" element={<EmployeeSettings />} />
        <Route path="setting/:section" element={<EmployeeSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter
