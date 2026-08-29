import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CoastalTicker from '../components/CoastalTicker';

const DEMO_LOGS = [
  { id: 'DEL-001', advisory_id: 'ADV-2026-001', user: 'Ravi K.', zone: 'Puri', channel: 'push', status: 'acknowledged', sent_at: '06:00:14', ack_at: '06:02:31' },
  { id: 'DEL-002', advisory_id: 'ADV-2026-001', user: 'Kumar S.', zone: 'Puri', channel: 'sms', status: 'sent', sent_at: '06:00:18', ack_at: '—' },
  { id: 'DEL-003', advisory_id: 'ADV-2026-001', user: 'Mohan R.', zone: 'Paradip', channel: 'push', status: 'failed', sent_at: '06:00:22', ack_at: '—' },
  { id: 'DEL-004', advisory_id: 'ADV-2026-001', user: 'Babu N.', zone: 'Paradip', channel: 'ivr', status: 'sent', sent_at: '06:00:25', ack_at: '—' },
  { id: 'DEL-005', advisory_id: 'ADV-2026-002', user: 'Selvan M.', zone: 'Kanyakumari', channel: 'push', status: 'acknowledged', sent_at: '05:30:08', ack_at: '05:31:12' },
  { id: 'DEL-006', advisory_id: 'ADV-2026-002', user: 'Murugan T.', zone: 'Tuticorin', channel: 'push', status: 'acknowledged', sent_at: '05:30:11', ack_at: '05:34:45' },
  { id: 'DEL-007', advisory_id: 'ADV-2026-002', user: 'Kannan V.', zone: 'Rameswaram', channel: 'sms', status: 'delivered', sent_at: '05:30:15', ack_at: '—' },
  { id: 'DEL-008', advisory_id: 'ADV-2026-003', user: 'Rao P.', zone: 'Visakhapatnam', channel: 'push', status: 'acknowledged', sent_at: '04:00:05', ack_at: '04:01:22' },
  { id: 'DEL-009', advisory_id: 'ADV-2026-004', user: 'Ajith R.', zone: 'Kochi', channel: 'offline_cache', status: 'acknowledged', sent_at: '03:00:30', ack_at: '03:15:44' },
  { id: 'DEL-010', advisory_id: 'ADV-2026-001', user: 'Sahu D.', zone: 'Gopalpur', channel: 'sms', status: 'failed', sent_at: '06:00:28', ack_at: '—' },
];

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

export default function AdminLogs() {
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
            <p className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-tertiary)' }}>
              SHOWING {DEMO_LOGS.length} RECORDS • LAST UPDATED: {new Date().toLocaleTimeString()}
            </p>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Advisory</th>
                <th>User</th>
                <th>Zone</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Sent At</th>
                <th>Ack At</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_LOGS.map(log => {
                const status = STATUS_STYLES[log.status] || STATUS_STYLES.sent;
                return (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{log.advisory_id}</td>
                    <td style={{ fontFamily: 'var(--font-sans)' }}>{log.user}</td>
                    <td>{log.zone}</td>
                    <td>{CHANNEL_LABELS[log.channel] || log.channel}</td>
                    <td style={{ color: status.color, fontWeight: 600 }}>{status.label}</td>
                    <td>{log.sent_at}</td>
                    <td>{log.ack_at}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4" style={{ padding: 'var(--space-3)', background: 'var(--tc-surface-alt)', border: '1px solid var(--tc-border)' }}>
            <p className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-secondary)' }}>
              📨 SMS and 📞 IVR channels are marked as <strong>(sim)</strong> — simulated gateways.
              The <code>NotificationGateway</code> interface is production-ready for a registered aggregator (e.g., Gupshup, Karix).
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
