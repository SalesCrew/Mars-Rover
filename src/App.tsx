import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './components/gl/Dashboard';
import { AdminPanel } from './components/admin/AdminPanel';
import { LoginPage } from './LoginPage';
import { mockDashboardData } from './data/mockData';
import './styles/design-system.css';

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--color-bg-secondary)',
      }}>
        <div style={{
          fontSize: '18px',
          color: '#64748b',
          fontWeight: 500,
        }}>
          Lädt...
        </div>
      </div>
    );
  }

  // Not authenticated - show login page
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // SECURITY: Only admins can access admin panel - GLs get dashboard ONLY
  // This is the ONLY place where role-based routing happens
  if (user.role === 'admin') {
    return <AdminPanel />;
  }

  // GL role (or any other role) - show dashboard ONLY
  // GLs can NEVER access AdminPanel through any route
  return <Dashboard data={mockDashboardData} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
