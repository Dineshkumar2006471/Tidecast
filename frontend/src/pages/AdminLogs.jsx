import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CoastalTicker from '../components/CoastalTicker';
import { apiUrl } from '../api';

const STATUS_STYLES = {
  acknowledged: { color: 'var(--tc-safe-teal)', label: '✓ ACK' },
  sent: { color: 'var(--tc-ocean-blue)', label: '→ SENT' },
  delivered: { color: 'var(--tc-tide-cyan)', label: '✓ DELIVERED' },
  failed: { color: 'var(--tc-alert-red)', label: '✗ FAILED' },
};

const CHANNEL_LABELS = {
  push: '📱 FCM Push',
  sms: '📨 SMS (sim)',
  ivr: '📞 IVR (sim)',
  offline_cache: '📴 Offline',
};

const formatTimestamp = (value) => value ? new Date(value).toLocaleString() : '—';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadLogs = async () => {
      try {
        const { auth } = await import('../firebase');
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('Please sign in as an admin to view delivery logs.');
        const response = await fetch(apiUrl('/api/admin/logs'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Live delivery logs could not be loaded.');
        const data = await response.json();
        if (active) setLogs(data.logs);
      } catch (loadError) {
        if (active) setError(loadError.message);
      }
    };

    loadLogs();
    const refreshTimer = window.setInterval(loadLogs, 10000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  return (
    <>
      <Navbar variant="admin" />
      <CoastalTicker />

      <main className="page-content">
        <div className="sidebar">
          <div className="sidebar-section-label">DASHBOARD</div>
          <Link to="/admin" className="sidebar-link">📊 Overview</Link>
          <div className="sidebar-section-label" style={{ marginTop: 'var(--space-3)' }}>OPERATIONS</div>
          <Link to="/admin/compose" className="sidebar-link">✏️ Compose Advisory</Link>
          <Link to="/admin/logs" className="sidebar-link active">📋 Delivery Logs</Link>
        </div>

        <div className="admin-content" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3>Delivery Logs</h3>
            <p className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-tertiary)' }}>SHOWING {logs.length} RECORDS • LAST UPDATED: {new Date().toLocaleTimeString()}</p>
          </div>
          {error && <p role="alert" className="text-secondary mb-4">{error}</p>}

          <table className="data-table">
            <thead><tr><th>Delivery ID</th><th>Advisory</th><th>User ID</th><th>Zone</th><th>Channel</th><th>Status</th><th>Sent At</th><th>Ack At</th></tr></thead>
            <tbody>
              {logs.map((log) => {
                const status = STATUS_STYLES[log.status] || STATUS_STYLES.sent;
                return (
                  <tr key={log.id}>
                    <td>{log.id}</td><td>{log.advisory_id}</td><td>{log.user_id}</td><td>{log.zone_id || '—'}</td>
                    <td>{CHANNEL_LABELS[log.channel] || log.channel}</td>
                    <td style={{ color: status.color, fontWeight: 600 }}>{status.label}</td>
                    <td>{formatTimestamp(log.sent_at)}</td><td>{formatTimestamp(log.ack_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!error && logs.length === 0 && <p className="text-secondary mt-4">No delivery attempts have been recorded yet.</p>}

          <div className="mt-4" style={{ padding: 'var(--space-3)', background: 'var(--tc-surface-alt)', border: '1px solid var(--tc-border)' }}>
            <p className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-secondary)' }}>📨 SMS and 📞 IVR channels are marked as <strong>(sim)</strong> — simulated gateways. The <code>NotificationGateway</code> interface is ready for a registered aggregator.</p>
          </div>
        </div>
      </main>
    </>
  );
}
