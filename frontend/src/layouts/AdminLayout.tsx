import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const AdminLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  
  // Extract active ID from path
  const activeTab = location.pathname.split('/').pop() || 'dashboard';

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeTab={activeTab}
        setActiveTab={() => {}} // Not needed with Router
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <Topbar 
          onMenuClick={() => setIsMobileOpen(true)} 
          activeTab={activeTab}
          setActiveTab={() => {}} // Not needed with Router
        />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
