import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CoastalTicker from '../components/CoastalTicker';
import { apiUrl } from '../api';

const SEVERITY_COLORS = {
  CRITICAL: 'var(--tc-alert-red)',
  HIGH: '#E6A817',
  MEDIUM: 'var(--tc-ocean-blue)',
  INFORMATIONAL: 'var(--tc-safe-teal)',
};

const EMPTY_STATS = {
  active_advisories: 0,
  total_users: 0,
  reach_percentage: 0,
  ack_percentage: 0,
  dark_zone_count: 0,
  dark_zones: [],
};

export default function AdminDashboard() {
  const location = useLocation();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [zones, setZones] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const { auth } = await import('../firebase');
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('Please sign in as an admin to view the dashboard.');

        const headers = { Authorization: `Bearer ${token}` };
        const [statsResponse, zonesResponse] = await Promise.all([
          fetch(apiUrl('/api/admin/dashboard/stats'), { headers }),
          fetch(apiUrl('/api/admin/zones/status'), { headers }),
        ]);
        if (!statsResponse.ok || !zonesResponse.ok) {
          throw new Error('Live dashboard data could not be loaded.');
        }

        const [nextStats, nextZones] = await Promise.all([
          statsResponse.json(),
          zonesResponse.json(),
        ]);
        if (active) {
          setStats(nextStats);
          setZones(nextZones.zones);
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      }
    };

    loadDashboard();
    return () => { active = false; };
  }, []);

  return (
    <>
      <Navbar variant="admin" />
      <CoastalTicker />

      <main className="page-content">
        <div className="sidebar">
          <div className="sidebar-section-label">DASHBOARD</div>
          <Link to="/admin" className={`sidebar-link ${location.pathname === '/admin' ? 'active' : ''}`}>📊 Overview</Link>
          <div className="sidebar-section-label" style={{ marginTop: 'var(--space-3)' }}>OPERATIONS</div>
          <Link to="/admin/compose" className={`sidebar-link ${location.pathname.includes('compose') ? 'active' : ''}`}>✏️ Compose Advisory</Link>
          <Link to="/admin/logs" className={`sidebar-link ${location.pathname.includes('logs') ? 'active' : ''}`}>📋 Delivery Logs</Link>
          <div className="sidebar-section-label" style={{ marginTop: 'var(--space-3)' }}>ZONES</div>
          {zones.slice(0, 5).map((zone) => {
            const severity = zone.severity || 'INFORMATIONAL';
            return (
              <div key={zone.zone_id} className="sidebar-link" style={{ cursor: 'default' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: zone.is_dark ? 'var(--tc-alert-red)' : SEVERITY_COLORS[severity] }} />
                {zone.name}
              </div>
            );
          })}
        </div>

        <div className="admin-content" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h3 className="mb-4">Dashboard Overview</h3>
          {error && <p role="alert" className="text-secondary mb-4">{error}</p>}
          <div className="grid grid-4 mb-5">
            <div className="stat-card"><div className="stat-label">ACTIVE ADVISORIES</div><div className="stat-value">{stats.active_advisories}</div></div>
            <div className="stat-card"><div className="stat-label">REACH</div><div className="stat-value positive">{stats.reach_percentage}%</div></div>
            <div className="stat-card"><div className="stat-label">ACKNOWLEDGED</div><div className="stat-value" style={{ color: stats.ack_percentage > 70 ? 'var(--tc-safe-teal)' : 'var(--tc-warning-amber)' }}>{stats.ack_percentage}%</div></div>
            <div className="stat-card"><div className="stat-label">DARK ZONES</div><div className="stat-value danger">{stats.dark_zone_count}</div></div>
          </div>

          {stats.dark_zone_count > 0 && (
            <div style={{ background: 'var(--tc-alert-red-bg)', border: '1px solid var(--tc-alert-red)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <div className="flex items-center gap-2 mb-2"><span style={{ fontSize: '1.2rem' }}>⚠️</span><strong style={{ color: 'var(--tc-alert-red)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>DARK ZONES DETECTED — NO ACKNOWLEDGMENTS RECEIVED</strong></div>
              <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>Zones <strong>{stats.dark_zones.join(', ')}</strong> have not acknowledged the current advisory. Consider dispatching a physical warning boat or loudspeaker van.</p>
            </div>
          )}

          <h4 className="mb-3">Zone Status</h4>
          <table className="data-table mb-5">
            <thead><tr><th>Zone</th><th>State</th><th>Ack Rate</th><th>Status</th></tr></thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.zone_id}>
                  <td style={{ fontWeight: 500 }}>{zone.name}</td>
                  <td>{zone.state}</td>
                  <td style={{ color: zone.ack_rate === 0 ? 'var(--tc-alert-red)' : zone.ack_rate > 75 ? 'var(--tc-safe-teal)' : 'var(--tc-ink)' }}>{zone.ack_rate}%</td>
                  <td>{zone.is_dark ? <span style={{ color: 'var(--tc-alert-red)', fontWeight: 600 }}>⚠ DARK</span> : <span style={{ color: 'var(--tc-safe-teal)' }}>✓ Active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!error && zones.length === 0 && <p className="text-secondary">No zones have been seeded yet.</p>}
          <p className="mono text-secondary" style={{ fontSize: 'var(--text-xs)' }}>TOTAL REGISTERED FISHERMEN: {stats.total_users} • LAST UPDATED: {new Date().toLocaleTimeString()}</p>
        </div>
      </main>
    </>
  );
}
