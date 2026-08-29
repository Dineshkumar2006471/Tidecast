import { useEffect, useRef } from 'react';

const DEMO_ZONES = [
  { zone: 'KANYAKUMARI', advisory: 'HIGH WAVES EXPECTED', sync: '2 MIN AGO', severity: 'high' },
  { zone: 'RAMESWARAM', advisory: 'CLEAR — SAFE FOR FISHING', sync: '4 MIN AGO', severity: 'clear' },
  { zone: 'PURI', advisory: 'CYCLONE WARNING — RETURN TO SHORE', sync: '1 MIN AGO', severity: 'critical' },
  { zone: 'VISAKHAPATNAM', advisory: 'PFZ IDENTIFIED — FAVORABLE CONDITIONS', sync: '6 MIN AGO', severity: 'clear' },
  { zone: 'KOCHI', advisory: 'ALL CLEAR — NORMAL CONDITIONS', sync: '3 MIN AGO', severity: 'clear' },
  { zone: 'PARADIP', advisory: 'CYCLONE ALERT — DO NOT VENTURE', sync: '1 MIN AGO', severity: 'critical' },
  { zone: 'TUTICORIN', advisory: 'MODERATE SEAS — EXERCISE CAUTION', sync: '5 MIN AGO', severity: 'high' },
  { zone: 'GOPALPUR', advisory: 'STORM SURGE WARNING', sync: '2 MIN AGO', severity: 'critical' },
];

export default function CoastalTicker() {
  const hasCritical = DEMO_ZONES.some(z => z.severity === 'critical');

  return (
    <div
      className="ticker"
      role="marquee"
      aria-live="polite"
      aria-label="Coastal zone status ticker"
      tabIndex={0}
    >
      <div className="ticker-track">
        {/* Duplicate for seamless loop */}
        {[...DEMO_ZONES, ...DEMO_ZONES].map((zone, i) => (
          <span className="ticker-item" key={i}>
            <span className={`ticker-dot ${zone.severity === 'critical' ? 'critical' : ''}`} />
            <span>
              ZONE: {zone.zone} — ADVISORY: {zone.advisory} — LAST SYNC: {zone.sync}
            </span>
          </span>
        ))}
      </div>
      {/* Screen reader accessible static text */}
      <span className="sr-only" style={{ position: 'absolute', left: '-9999px' }}>
        Coastal zone status updates: {DEMO_ZONES.map(z =>
          `${z.zone}: ${z.advisory}`
        ).join('. ')}
      </span>
    </div>
  );
}
