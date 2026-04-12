import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

const AdminLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  // Extract active ID from path
  const activeTab = location.pathname.split('/').pop() || 'dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeTab={activeTab}
        setActiveTab={() => {}} // Not needed with Router
      />

      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setIsMobileOpen(true)}
          activeTab={activeTab}
          setActiveTab={() => {}} // Not needed with Router
        />

        <main className="custom-scrollbar flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
