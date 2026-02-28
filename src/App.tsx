import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Visits from './pages/Visits';
import SpecialCases from './pages/SpecialCases';
import Referrals from './pages/Referrals';
import ClinicAppointments from './pages/ClinicAppointments';
import Archive from './pages/Archive';
import Settings from './pages/Settings';
import Students from './pages/Students';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="visits" element={<Visits />} />
            <Route path="special-cases" element={<SpecialCases />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="clinic-appointments" element={<ClinicAppointments />} />
            <Route path="archive" element={<Archive />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
