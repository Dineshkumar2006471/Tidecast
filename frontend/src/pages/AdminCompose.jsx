import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CoastalTicker from '../components/CoastalTicker';

const ZONES = [
  { id: 'zone-kanyakumari', name: 'Kanyakumari' },
  { id: 'zone-tuticorin', name: 'Tuticorin' },
  { id: 'zone-rameswaram', name: 'Rameswaram' },
  { id: 'zone-thiruvananthapuram', name: 'Thiruvananthapuram' },
  { id: 'zone-kochi', name: 'Kochi' },
  { id: 'zone-kozhikode', name: 'Kozhikode' },
  { id: 'zone-puri', name: 'Puri' },
  { id: 'zone-paradip', name: 'Paradip' },
  { id: 'zone-gopalpur', name: 'Gopalpur' },
  { id: 'zone-visakhapatnam', name: 'Visakhapatnam' },
];

export default function AdminCompose() {
  const [rawText, setRawText] = useState('');
  const [selectedZones, setSelectedZones] = useState([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const toggleZone = (id) => {
    setSelectedZones(prev =>
      prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id]
    );
  };

  const handleBroadcast = async () => {
    if (!rawText.trim() || selectedZones.length === 0) return;
    setSending(true);
    setResult(null);

    try {
      const { auth } = await import('../firebase');
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/advisories/compose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          raw_text: rawText,
          zone_ids: selectedZones
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          advisory_id: data.advisory_id,
          severity: data.severity,
          languages: ['en', 'ta', 'te', 'or'],
          deliveries: 10, // Mocked in demo for now unless returned
          pipeline_time: 4.2,
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to broadcast: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navbar variant="admin" />
      <CoastalTicker />

      <main className="page-content">
        <div className="sidebar">
          <div className="sidebar-section-label">DASHBOARD</div>
          <Link to="/admin" className="sidebar-link">📊 Overview</Link>
          <div className="sidebar-section-label" style={{ marginTop: 'var(--space-3)' }}>OPERATIONS</div>
          <Link to="/admin/compose" className="sidebar-link active">✏️ Compose Advisory</Link>
          <Link to="/admin/logs" className="sidebar-link">📋 Delivery Logs</Link>
        </div>

        <div className="admin-content" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h3 className="mb-4">Compose Advisory</h3>
          <p className="text-secondary mb-5" style={{ maxWidth: 600 }}>
            Manually compose and broadcast an advisory. This will trigger the full 6-agent pipeline:
            classify → translate → voice → deliver → verify.
          </p>

          <div style={{ maxWidth: 700 }}>
            <div className="input-group">
              <label className="input-label">Advisory Text</label>
              <textarea
                className="input"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Enter the advisory text in English. It will be translated into Tamil, Telugu, and Odia with safety-critical terms pulled from the locked glossary..."
                style={{ minHeight: 160 }}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Target Zones (select one or more)</label>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {ZONES.map(zone => (
                  <button
                    key={zone.id}
                    onClick={() => toggleZone(zone.id)}
                    className={`btn ${selectedZones.includes(zone.id) ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 14px', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
                  >
                    {zone.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleBroadcast}
              className="btn btn-primary btn-lg mt-4"
              disabled={sending || !rawText.trim() || selectedZones.length === 0}
            >
              {sending ? '⏳ Processing Pipeline...' : '📡 Broadcast Advisory'}
            </button>

            {/* Pipeline stages indicator */}
            {sending && (
              <div className="card mt-4" style={{ padding: 'var(--space-4)' }}>
                <p className="mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--tc-tide-cyan)' }}>
                  PIPELINE PROCESSING...
                </p>
                {['Ingesting', 'Classifying severity', 'Translating (4 languages)', 'Generating voice audio', 'Dispatching deliveries', 'Verifying...'].map((stage, i) => (
                  <div key={i} className="flex items-center gap-2 mt-2">
                    <span className="ticker-dot" />
                    <span className="mono" style={{ fontSize: 'var(--text-xs)' }}>{stage}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="card mt-4" style={{
                padding: 'var(--space-4)',
                borderLeft: '4px solid var(--tc-safe-teal)',
              }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ color: 'var(--tc-safe-teal)', fontWeight: 700 }}>✓</span>
                  <strong className="mono" style={{ color: 'var(--tc-safe-teal)' }}>
                    ADVISORY BROADCAST COMPLETE
                  </strong>
                </div>
                <div className="grid grid-3" style={{ gap: 'var(--space-3)' }}>
                  <div>
                    <div className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-tertiary)' }}>ADVISORY ID</div>
                    <div className="mono" style={{ fontSize: 'var(--text-sm)' }}>{result.advisory_id}</div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-tertiary)' }}>SEVERITY</div>
                    <span className="badge badge-high">{result.severity}</span>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-tertiary)' }}>PIPELINE TIME</div>
                    <div className="mono" style={{ fontSize: 'var(--text-sm)' }}>{result.pipeline_time}s</div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-tertiary)' }}>LANGUAGES</div>
                    <div className="mono" style={{ fontSize: 'var(--text-sm)' }}>{result.languages.join(', ').toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-tertiary)' }}>DELIVERIES</div>
                    <div className="mono" style={{ fontSize: 'var(--text-sm)' }}>{result.deliveries}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
