import { Dashboard } from './components/gl/Dashboard';
import { mockDashboardData } from './data/mockData';
import './styles/design-system.css';

function App() {
  return <Dashboard data={mockDashboardData} />;
}

export default App;
