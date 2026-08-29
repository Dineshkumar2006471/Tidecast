import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CoastalTicker from '../components/CoastalTicker';

const DEMO_STATS = {
  active_advisories: 4,
  total_users: 1247,
  reach_percentage: 92.4,
  ack_percentage: 74.1,
  dark_zone_count: 2,
  dark_zones: ['Paradip', 'Gopalpur'],
};

const DEMO_ZONES = [
  { zone_id: 'zone-kanyakumari', name: 'Kanyakumari', state: 'Tamil Nadu', severity: 'HIGH', ack_rate: 87, is_dark: false },
  { zone_id: 'zone-tuticorin', name: 'Tuticorin', state: 'Tamil Nadu', severity: 'HIGH', ack_rate: 79, is_dark: false },
  { zone_id: 'zone-rameswaram', name: 'Rameswaram', state: 'Tamil Nadu', severity: 'HIGH', ack_rate: 82, is_dark: false },
  { zone_id: 'zone-thiruvananthapuram', name: 'Thiruvananthapuram', state: 'Kerala', severity: 'INFORMATIONAL', ack_rate: 91, is_dark: false },
  { zone_id: 'zone-kochi', name: 'Kochi', state: 'Kerala', severity: 'INFORMATIONAL', ack_rate: 95, is_dark: false },
  { zone_id: 'zone-kozhikode', name: 'Kozhikode', state: 'Kerala', severity: 'INFORMATIONAL', ack_rate: 88, is_dark: false },
  { zone_id: 'zone-puri', name: 'Puri', state: 'Odisha', severity: 'CRITICAL', ack_rate: 65, is_dark: false },
  { zone_id: 'zone-paradip', name: 'Paradip', state: 'Odisha', severity: 'CRITICAL', ack_rate: 0, is_dark: true },
  { zone_id: 'zone-gopalpur', name: 'Gopalpur', state: 'Odisha', severity: 'CRITICAL', ack_rate: 0, is_dark: true },
  { zone_id: 'zone-visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh', severity: 'MEDIUM', ack_rate: 76, is_dark: false },
];

const SEVERITY_COLORS = {
  CRITICAL: 'var(--tc-alert-red)',
  HIGH: '#E6A817',
  MEDIUM: 'var(--tc-ocean-blue)',
  INFORMATIONAL: 'var(--tc-safe-teal)',
};

export default function AdminDashboard() {
  const location = useLocation();

  return (
    <>
      <Navbar variant="admin" />
      <CoastalTicker />

      <main className="page-content">
        <div className="sidebar">
          <div className="sidebar-section-label">DASHBOARD</div>
          <Link to="/admin" className={`sidebar-link ${location.pathname === '/admin' ? 'active' : ''}`}>
            📊 Overview
          </Link>
          <div className="sidebar-section-label" style={{ marginTop: 'var(--space-3)' }}>OPERATIONS</div>
          <Link to="/admin/compose" className={`sidebar-link ${location.pathname.includes('compose') ? 'active' : ''}`}>
            ✏️ Compose Advisory
          </Link>
          <Link to="/admin/logs" className={`sidebar-link ${location.pathname.includes('logs') ? 'active' : ''}`}>
            📋 Delivery Logs
          </Link>
          <div className="sidebar-section-label" style={{ marginTop: 'var(--space-3)' }}>ZONES</div>
          {DEMO_ZONES.slice(0, 5).map(z => (
            <div key={z.zone_id} className="sidebar-link" style={{ cursor: 'default' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: z.is_dark ? 'var(--tc-alert-red)' : SEVERITY_COLORS[z.severity],
              }} />
              {z.name}
            </div>
          ))}
        </div>

        <div className="admin-content" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          {/* Stats Cards */}
          <h3 className="mb-4">Dashboard Overview</h3>
          <div className="grid grid-4 mb-5">
            <div className="stat-card">
              <div className="stat-label">ACTIVE ADVISORIES</div>
              <div className="stat-value">{DEMO_STATS.active_advisories}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">REACH</div>
              <div className="stat-value positive">{DEMO_STATS.reach_percentage}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">ACKNOWLEDGED</div>
              <div className="stat-value" style={{ color: DEMO_STATS.ack_percentage > 70 ? 'var(--tc-safe-teal)' : 'var(--tc-warning-amber)' }}>
                {DEMO_STATS.ack_percentage}%
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">DARK ZONES</div>
              <div className="stat-value danger">{DEMO_STATS.dark_zone_count}</div>
            </div>
          </div>

          {/* Dark Zone Alert */}
          {DEMO_STATS.dark_zone_count > 0 && (
            <div style={{
              background: 'var(--tc-alert-red-bg)', border: '1px solid var(--tc-alert-red)',
              padding: 'var(--space-4)', marginBottom: 'var(--space-5)',
            }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <strong style={{ color: 'var(--tc-alert-red)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                  DARK ZONES DETECTED — NO ACKNOWLEDGMENTS RECEIVED
                </strong>
              </div>
              <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
                Zones <strong>{DEMO_STATS.dark_zones.join(', ')}</strong> have not acknowledged
                the current cyclone advisory. Consider dispatching a physical warning boat
                or loudspeaker van.
              </p>
            </div>
          )}

          {/* Zone Status Table */}
          <h4 className="mb-3">Zone Status</h4>
          <table className="data-table mb-5">
            <thead>
              <tr>
                <th>Zone</th>
                <th>State</th>
                <th>Severity</th>
                <th>Ack Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ZONES.map(zone => (
                <tr key={zone.zone_id}>
                  <td style={{ fontWeight: 500 }}>{zone.name}</td>
                  <td>{zone.state}</td>
                  <td>
                    <span className={`badge badge-${zone.severity.toLowerCase() === 'informational' ? 'clear' : zone.severity.toLowerCase()}`}>
                      {zone.severity}
                    </span>
                  </td>
                  <td style={{ color: zone.ack_rate === 0 ? 'var(--tc-alert-red)' : zone.ack_rate > 75 ? 'var(--tc-safe-teal)' : 'var(--tc-ink)' }}>
                    {zone.ack_rate}%
                  </td>
                  <td>
                    {zone.is_dark ? (
                      <span style={{ color: 'var(--tc-alert-red)', fontWeight: 600 }}>⚠ DARK</span>
                    ) : (
                      <span style={{ color: 'var(--tc-safe-teal)' }}>✓ Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Users */}
          <p className="mono text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
            TOTAL REGISTERED FISHERMEN: {DEMO_STATS.total_users} • LAST UPDATED: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </main>
    </>
  );
}
