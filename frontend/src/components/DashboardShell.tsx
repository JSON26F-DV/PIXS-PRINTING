import React, { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface DashboardShellProps {
  children: ReactNode
  activeTab: string
  setActiveTab: (tab: string) => void
}

const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  activeTab,
  setActiveTab,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setIsMobileOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="custom-scrollbar flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardShell
