import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CoastalTicker from '../components/CoastalTicker';
import Footer from '../components/Footer';

export default function Landing() {
  const revealRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addRevealRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <>
      <Navbar variant="landing" />
      <CoastalTicker />

      <main className="page-content">
        {/* ============ HERO ============ */}
        <section className="section" id="product">
          <div className="container">
            <div className="hero">
              <div className="hero-text">
                <p className="eyebrow fade-in-up">COASTAL ADVISORY INFRASTRUCTURE</p>
                <h1 className="fade-in-up delay-1">
                  An advisory a fisherman never got, is not an advisory.
                </h1>
                <p className="fade-in-up delay-2">
                  Translated into their language, voiced for those who can't read,
                  delivered on whatever connection exists, with confirmation it arrived.
                </p>
                <div className="hero-ctas fade-in-up delay-3">
                  <a href="#how-it-works" className="btn btn-primary btn-lg">See How It Works</a>
                  <a href="#impact" className="btn btn-ghost">Read the Ockhi Case →</a>
                </div>
              </div>
              <div className="hero-image fade-in-up delay-4">
                <img
                  src="/hero-illustration.jpg"
                  alt="Vector illustration of an Indian fishing boat on coastal waters with a lighthouse"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============ WHO IT'S FOR ============ */}
        <section className="section section-alt" ref={addRevealRef}>
          <div className="container reveal" ref={addRevealRef}>
            <p className="eyebrow text-center">WHO IT'S FOR</p>
            <h2 className="text-center mb-5">Built for the people on the water</h2>
            <div className="grid grid-3">
              <div className="persona-card card">
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎣</div>
                <h4>Ravi, 34</h4>
                <p className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-tide-cyan)', marginBottom: '8px' }}>
                  DEEP-SEA FISHERMAN • KANYAKUMARI
                </p>
                <p className="text-secondary">
                  Owns a basic Android phone, spotty connectivity beyond 15km from shore.
                  Needs a single glance or a single listen to know: is it safe to go out today?
                </p>
              </div>
              <div className="persona-card card">
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
                <h4>Meena, 41</h4>
                <p className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-tide-cyan)', marginBottom: '8px' }}>
                  FIELD OFFICER • FISHERIES DEPT
                </p>
                <p className="text-secondary">
                  Needs a dashboard to know which zones have acknowledged today's advisory
                  and which haven't — so she can dispatch a warning boat to the zones that went dark.
                </p>
              </div>
              <div className="persona-card card">
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏛️</div>
                <h4>State Fisheries Department</h4>
                <p className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-tide-cyan)', marginBottom: '8px' }}>
                  POLICY & COMPLIANCE STAKEHOLDER
                </p>
                <p className="text-secondary">
                  Needs aggregate reach and compliance reporting for policy
                  and funding justification.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ WHAT IT SOLVES ============ */}
        <section className="section" ref={addRevealRef}>
          <div className="container reveal" ref={addRevealRef}>
            <p className="eyebrow text-center">WHAT IT SOLVES</p>
            <h2 className="text-center mb-5">Three compounding failures</h2>
            <div className="grid grid-3">
              <div className="problem-card">
                <div className="problem-icon">🌐</div>
                <h4>Language Barrier</h4>
                <p className="text-secondary mt-2">
                  Official advisories are issued in English or formal regional language —
                  not the spoken dialect of the fisherman receiving it.
                </p>
                <p className="mono mt-3" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-tide-cyan)' }}>
                  4 LANGUAGES AT MVP • ARCHITECTURE SUPPORTS N
                </p>
              </div>
              <div className="problem-card">
                <div className="problem-icon">📡</div>
                <h4>Connectivity Gap</h4>
                <p className="text-secondary mt-2">
                  Coastal and deep-sea zones have patchy or no mobile data.
                  Advisories that assume a working internet connection simply don't arrive.
                </p>
                <p className="mono mt-3" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-tide-cyan)' }}>
                  OFFLINE-FIRST PWA • MULTI-CHANNEL DELIVERY
                </p>
              </div>
              <div className="problem-card">
                <div className="problem-icon">📖</div>
                <h4>Format Mismatch</h4>
                <p className="text-secondary mt-2">
                  A text bulletin is useless to someone who can't read it fluently,
                  or who is on a boat with both hands full.
                </p>
                <p className="mono mt-3" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-tide-cyan)' }}>
                  VOICE-FIRST DESIGN • AUDIO EVERY ADVISORY
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ THE OCKHI CASE ============ */}
        <section className="section section-dark" id="impact" ref={addRevealRef}>
          <div className="container reveal" ref={addRevealRef}>
            <div className="ockhi-section">
              <p className="eyebrow" style={{ color: 'var(--tc-alert-red)' }}>WHY THIS EXISTS</p>
              <h2>Cyclone Ockhi, 2017</h2>
              <p className="mt-4" style={{ fontSize: 'var(--text-lg)', color: 'var(--tc-text-tertiary)', lineHeight: 1.7 }}>
                A cyclone-specific advisory for Tamil Nadu and Kerala was not issued
                until the day of landfall. By then, most boats had already gone out to sea.
              </p>
              <div className="stat">204</div>
              <p style={{ color: 'var(--tc-text-tertiary)', fontSize: 'var(--text-lg)' }}>
                Dead or missing fishermen in Tamil Nadu alone.
              </p>
              <p className="mt-4" style={{ color: 'var(--tc-text-tertiary)' }}>
                A Rajya Sabha report (Feb 2019) confirmed the advisory came too late
                and didn't convey the severity clearly enough to be acted on.
              </p>
              <p className="mono mt-5" style={{ fontSize: 'var(--text-sm)', color: 'var(--tc-tide-cyan)' }}>
                THIS IS PRECISELY THE FAILURE MODE TIDECAST TARGETS.
              </p>
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="section" id="how-it-works" ref={addRevealRef}>
          <div className="container reveal" ref={addRevealRef}>
            <p className="eyebrow text-center">HOW IT WORKS</p>
            <h2 className="text-center mb-5">Six-agent pipeline</h2>
            <p className="text-center text-secondary mb-5" style={{ maxWidth: 600, margin: '0 auto var(--space-5)' }}>
              From raw government advisory to confirmed delivery in under 60 seconds.
              Each agent is independently testable with clear input/output contracts.
            </p>
            <div className="pipeline-steps">
              {[
                { step: '01', name: 'Ingest', desc: 'Parse raw advisory feed' },
                { step: '02', name: 'Classify', desc: 'Gemini severity tagging' },
                { step: '03', name: 'Localize', desc: 'Translate with safety glossary' },
                { step: '04', name: 'Voice', desc: 'Cloud TTS audio generation' },
                { step: '05', name: 'Deliver', desc: 'Multi-channel dispatch' },
                { step: '06', name: 'Verify', desc: 'Feedback loop + dark zones' },
              ].map((item) => (
                <div className="pipeline-step" key={item.step}>
                  <span className="step-number">STAGE {item.step}</span>
                  <h5>{item.name}</h5>
                  <p className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ WAR FACTORS ============ */}
        <section className="section section-alt" id="war-factors" ref={addRevealRef}>
          <div className="container reveal" ref={addRevealRef}>
            <p className="eyebrow text-center">WHAT'S UNIQUE</p>
            <h2 className="text-center mb-5">What separates this from an SMS blaster</h2>
            <div className="grid grid-2">
              <div className="war-factor-card">
                <h4>🔒 Safety-Locked Translation</h4>
                <p className="text-secondary mt-2">
                  Life-safety terms are pre-verified per language by a fixed glossary —
                  never freely LLM-generated. Only the surrounding narrative is AI-generated.
                  A genuine responsible-AI design decision.
                </p>
              </div>
              <div className="war-factor-card">
                <h4>🔊 Voice-First, Not Text-First</h4>
                <p className="text-secondary mt-2">
                  Every advisory has a synthesized audio version by default in the fisherman's
                  own language — not as an accessibility afterthought, but as the primary interface.
                </p>
              </div>
              <div className="war-factor-card">
                <h4>📴 Offline-First Architecture</h4>
                <p className="text-secondary mt-2">
                  Service worker cached last-known-good advisory, IndexedDB storage,
                  background sync on reconnect. Designed for zero-network, not as a stretch goal.
                </p>
              </div>
              <div className="war-factor-card">
                <h4>🔄 Verification Loop</h4>
                <p className="text-secondary mt-2">
                  A system that knows what it doesn't know — flags "dark zones" with no
                  acknowledgment, escalates to field officers. The system confirms delivery,
                  not just sending.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ LIVE PREVIEW WIDGET ============ */}
        <section className="section" ref={addRevealRef}>
          <div className="container reveal" ref={addRevealRef}>
            <p className="eyebrow text-center">INTERACTIVE DEMO</p>
            <h2 className="text-center mb-5">See it in action</h2>
            <div className="card" style={{ maxWidth: 700, margin: '0 auto', padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Select Zone</label>
                  <select className="select" id="demo-zone">
                    <option value="kanyakumari">Kanyakumari</option>
                    <option value="rameswaram">Rameswaram</option>
                    <option value="puri">Puri</option>
                    <option value="visakhapatnam">Visakhapatnam</option>
                  </select>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Language</label>
                  <select className="select" id="demo-lang">
                    <option value="en">English</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="or">ଓଡ଼ିଆ (Odia)</option>
                  </select>
                </div>
              </div>
              <div className="card-advisory severity-high" style={{ marginBottom: 'var(--space-3)' }}>
                <span className="badge badge-high">⚠ HIGH</span>
                <h5 className="mt-2">High Wave Alert — Kanyakumari Zone</h5>
                <p className="text-secondary mt-2" style={{ fontSize: 'var(--text-sm)' }}>
                  Waves of height 2.5 to 3.5 metres expected along the coast of Kanyakumari
                  during the next 24 hours. Fishermen are advised not to venture into sea.
                </p>
                <div className="audio-player mt-3">
                  <button className="audio-play-btn" aria-label="Play advisory audio">▶</button>
                  <div style={{ flex: 1 }}>
                    <div className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-secondary)' }}>
                      AUDIO • ENGLISH • 0:24
                    </div>
                    <div style={{ height: 4, background: 'var(--tc-border)', marginTop: 6 }}>
                      <div style={{ height: 4, width: '35%', background: 'var(--tc-ocean-blue)' }} />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Link to="/login" className="btn btn-primary">Try the Full App →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CTA BANNER ============ */}
        <section className="section-blue cta-banner">
          <h2>Built for the coastline that can't afford to miss a warning.</h2>
          <Link to="/login" className="btn btn-lg">Get Started</Link>
        </section>
      </main>

      <Footer />
    </>
  );
}
