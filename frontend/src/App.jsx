import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import FishermanHome from './pages/FishermanHome';
import AdvisoryDetail from './pages/AdvisoryDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminCompose from './pages/AdminCompose';
import AdminLogs from './pages/AdminLogs';
import About from './pages/About';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<FishermanHome />} />
        <Route path="/app/advisory/:id" element={<AdvisoryDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/compose" element={<AdminCompose />} />
        <Route path="/admin/logs" element={<AdminLogs />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;
