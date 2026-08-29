import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CoastalTicker from '../components/CoastalTicker';

const DEMO_ADVISORIES = [
  {
    id: 'ADV-2026-001',
    severity: 'CRITICAL',
    source: 'IMD',
    bulletin_type: 'CYCLONE_WARNING',
    zone: 'Puri, Paradip, Gopalpur',
    title: 'Cyclone DANA — Return to Shore Immediately',
    summary: 'Cyclone DANA expected to cross north Odisha coast with wind speed 100-110 kmph. Storm surge of 1-2 metres. All fishing operations must cease.',
    translations: {
      en: 'Cyclone DANA expected to cross north Odisha coast. Return to shore immediately.',
      ta: 'புயல் DANA வடக்கு ஒடிசா கடற்கரையை கடக்கும் என எதிர்பார்க்கப்படுகிறது. உடனடியாக கரைக்கு திரும்புங்கள்.',
      te: 'తుఫాను DANA ఉత్తర ఒడిశా తీరాన్ని దాటనున్నది. వెంటనే తీరానికి తిరిగి రండి.',
    },
    time: '6:00 AM',
    acknowledged: false,
  },
  {
    id: 'ADV-2026-002',
    severity: 'HIGH',
    source: 'INCOIS',
    bulletin_type: 'HIGH_WAVE_ALERT',
    zone: 'Kanyakumari, Tuticorin, Rameswaram',
    title: 'High Wave Alert — Tamil Nadu Coast',
    summary: 'Waves of 2.5 to 3.5 metres expected. Fishermen advised not to venture into sea.',
    translations: {
      en: 'High waves of 2.5-3.5m expected along Tamil Nadu coast. Do not venture into the sea.',
      ta: 'தமிழ்நாடு கடற்கரையில் 2.5-3.5 மீட்டர் உயர் அலைகள் எதிர்பார்க்கப்படுகின்றன. கடலுக்கு செல்ல வேண்டாம்.',
    },
    time: '5:30 AM',
    acknowledged: false,
  },
  {
    id: 'ADV-2026-003',
    severity: 'MEDIUM',
    source: 'INCOIS',
    bulletin_type: 'PFZ_ADVISORY',
    zone: 'Visakhapatnam',
    title: 'Potential Fishing Zone — Visakhapatnam',
    summary: 'Good fish aggregation identified off Visakhapatnam coast. Moderate sea conditions.',
    time: '4:00 AM',
    acknowledged: true,
  },
  {
    id: 'ADV-2026-004',
    severity: 'INFORMATIONAL',
    source: 'IMD',
    bulletin_type: 'ALL_CLEAR',
    zone: 'Thiruvananthapuram, Kochi, Kozhikode',
    title: 'All Clear — Kerala Coast',
    summary: 'Sea conditions returning to normal. Fishermen may resume normal activities.',
    time: '3:00 AM',
    acknowledged: true,
  },
];

const SEVERITY_CONFIG = {
  CRITICAL: { badge: 'badge-critical', card: 'severity-critical', icon: '🔴', label: 'CRITICAL' },
  HIGH: { badge: 'badge-high', card: 'severity-high', icon: '🟠', label: 'HIGH' },
  MEDIUM: { badge: 'badge-medium', card: 'severity-medium', icon: '🟡', label: 'MEDIUM' },
  INFORMATIONAL: { badge: 'badge-clear', card: 'severity-clear', icon: '🟢', label: 'CLEAR' },
};

export default function FishermanHome() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [language, setLanguage] = useState('en');
  const [advisories, setAdvisories] = useState(DEMO_ADVISORIES);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Fetch live advisories
    const fetchAdvisories = async () => {
      try {
        const { auth } = await import('../firebase');
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        if (!token) return;

        const profileResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const profile = profileResponse.ok ? await profileResponse.json() : null;
        const zoneQuery = profile?.zone_id ? `?zone_id=${encodeURIComponent(profile.zone_id)}` : '';
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/advisories/active${zoneQuery}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = data.advisories.map(a => ({
            id: a.advisory_id || a.id,
            severity: a.severity,
            source: a.source || 'IMD',
            bulletin_type: a.bulletin_type,
            zone: (a.zone_ids || []).join(', '),
            title: a.translations?.en?.full || a.raw_text?.substring(0, 50) + '...',
            summary: a.translations?.en?.full || a.raw_text,
            translations: Object.fromEntries(
              Object.entries(a.translations || {}).map(([language, text]) => [
                language,
                typeof text === 'string' ? text : text.full,
              ]),
            ),
            time: new Date(a.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            acknowledged: false, // In real app, query if user acknowledged
            audio_urls: a.audio_urls || {}
          }));
          if (mapped.length > 0) {
             setAdvisories(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to fetch live advisories:', err);
      }
    };

    fetchAdvisories();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAck = async (id) => {
    try {
      const { auth } = await import('../firebase');
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Please sign in before acknowledging an advisory.');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/deliveries/ack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ advisory_id: id, response: 'safe' }),
      });
      if (!response.ok) throw new Error('The acknowledgment could not be saved.');

      setAdvisories(prev =>
        prev.map(a => a.id === id ? { ...a, acknowledged: true } : a)
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const langLabels = { en: 'EN', ta: 'TA', te: 'TE', or: 'OR' };

  return (
    <>
      <Navbar variant="app" />
      <CoastalTicker />

      <main className="page-content">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="offline-banner">
            ● OFFLINE — SHOWING LAST SYNCED ADVISORIES
          </div>
        )}

        <div className="container" style={{ maxWidth: 700, paddingTop: 'var(--space-4)' }}>
          {/* Language selector */}
          <div className="flex items-center justify-between mb-4">
            <h3>Active Advisories</h3>
            <div className="flex gap-2">
              {Object.entries(langLabels).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`btn ${language === code ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 14px', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Advisory Cards */}
          <div className="flex flex-col gap-3">
            {advisories.map((adv) => {
              const config = SEVERITY_CONFIG[adv.severity] || SEVERITY_CONFIG.INFORMATIONAL;
              return (
                <div key={adv.id} className={`card card-advisory ${config.card}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge ${config.badge}`}>
                      {config.icon} {config.label}
                    </span>
                    <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-tertiary)' }}>
                      {adv.time} • {adv.source}
                    </span>
                  </div>

                  <h4 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
                    {adv.title}
                  </h4>

                  <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
                    {adv.translations?.[language] || adv.summary}
                  </p>

                  <p className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-tertiary)', marginBottom: 'var(--space-3)' }}>
                    {adv.zone}
                  </p>

                  {/* Audio Player */}
                  <div className="audio-player" style={{ marginBottom: 'var(--space-3)' }}>
                    <button className="audio-play-btn" aria-label={`Play advisory in ${langLabels[language]}`}>
                      ▶
                    </button>
                    <div style={{ flex: 1 }}>
                      <div className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-secondary)' }}>
                        AUDIO • {langLabels[language]} • 0:24
                      </div>
                      <div style={{ height: 4, background: 'var(--tc-border)', marginTop: 6, borderRadius: 2 }}>
                        <div style={{ height: 4, width: '0%', background: 'var(--tc-ocean-blue)', borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>

                  {/* Acknowledgment */}
                  {adv.acknowledged ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 16px', background: 'var(--tc-safe-teal-bg)',
                      fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                      color: 'var(--tc-safe-teal)', fontWeight: 600,
                    }}>
                      ✓ ACKNOWLEDGED
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAck(adv.id)}
                      className="btn btn-primary w-full"
                      style={{ padding: '14px', fontSize: 'var(--text-sm)' }}
                    >
                      ✓ I Received This — Mark as Safe
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
