const STATUS_MESSAGE = 'LIVE ADVISORIES ARE AVAILABLE AFTER SIGN-IN';

export default function CoastalTicker() {
  return (
    <div
      className="ticker"
      role="marquee"
      aria-live="polite"
      aria-label="Coastal zone status ticker"
      tabIndex={0}
    >
      <div className="ticker-track">
        {[0, 1].map((item) => (
          <span className="ticker-item" key={item}>
            <span className="ticker-dot" />
            <span>{STATUS_MESSAGE}</span>
          </span>
        ))}
      </div>
      <span className="sr-only" style={{ position: 'absolute', left: '-9999px' }}>
        {STATUS_MESSAGE}
      </span>
    </div>
  );
}
