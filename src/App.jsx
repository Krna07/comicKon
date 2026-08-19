import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EpisodeList  from './components/EpisodeList';
import ComicReader  from './components/ComicReader';
import AdminLogin   from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import './App.css';

function ProtectedAdmin() {
  const token = localStorage.getItem('dhuaa_admin_token');
  return token ? <AdminDashboard /> : <Navigate to="/admin" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Episode list — homepage */}
        <Route path="/"          element={<EpisodeList />} />

        {/* Read a specific episode */}
        <Route path="/read/:id"  element={<ComicReader />} />

        {/* Writer's portal */}
        <Route path="/admin"                element={<AdminLogin />} />
        <Route path="/admin/dashboard"      element={<ProtectedAdmin />} />
        <Route path="/admin/dashboard/:id"  element={<ProtectedAdmin />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
