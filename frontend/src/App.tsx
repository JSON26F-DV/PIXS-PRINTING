import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DiscoveryProvider } from './context/DiscoveryContext';
import { NotificationProvider } from './context/NotificationContext';

import AppRouter from './router/AppRouter';
import CustomerNavbar from './components/customer/CustomerNavbar';
import { Toaster } from 'react-hot-toast';

const NavVisibilityWrapper = () => {
  const location = useLocation();
  const isEmployeePath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff');

  if (isEmployeePath) return null;
  return <CustomerNavbar />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <DiscoveryProvider>
            <div className="min-h-screen bg-white pb-16 lg:pb-0 lg:pt-0">
              <NavVisibilityWrapper />
              <Toaster position="top-right" />
              <main>
                <AppRouter />
              </main>
            </div>
          </DiscoveryProvider>
        </NotificationProvider>

      </AuthProvider>
    </Router>
  )
}

export default App
