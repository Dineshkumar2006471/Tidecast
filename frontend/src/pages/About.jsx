import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function About() {
  return (
    <>
      <Navbar variant="landing" />
      <main className="page-content">
        <div className="container" style={{ maxWidth: 800, paddingTop: 'var(--space-8)' }}>
          <p className="eyebrow">ABOUT</p>
          <h1 className="mb-4">TIDECAST</h1>
          <p className="text-secondary mb-5" style={{ fontSize: 'var(--text-lg)', lineHeight: 1.7 }}>
            A multi-agent advisory delivery system that takes a raw government advisory
            and gets it to a fisherman in under a minute, in his own language and dialect,
            over whatever channel is actually available to him right now.
          </p>

          <div className="card mb-5" style={{ padding: 'var(--space-5)' }}>
            <h3 className="mb-3">Built by</h3>
            <h4>Dinesh Kumar (Max)</h4>
            <p className="text-secondary mt-2">6R Hackathon 2026</p>
          </div>

          <h3 className="mb-3">What's Live vs. Simulated</h3>
          <div className="grid grid-2 mb-5">
            <div className="card" style={{ borderLeft: '4px solid var(--tc-safe-teal)' }}>
              <h5 style={{ color: 'var(--tc-safe-teal)' }}>✅ Live</h5>
              <ul style={{ listStyle: 'none', marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <li>Gemini AI classification & localization</li>
                <li>Google Cloud Text-to-Speech (4 languages)</li>
                <li>Firebase Auth (email/password)</li>
                <li>Firestore real-time database</li>
                <li>FCM push notifications</li>
                <li>Offline-first PWA with service worker</li>
                <li>Locked safety glossary for responsible AI</li>
              </ul>
            </div>
            <div className="card" style={{ borderLeft: '4px solid var(--tc-warning-amber)' }}>
              <h5 style={{ color: '#6E4B00' }}>⚠️ Simulated</h5>
              <ul style={{ listStyle: 'none', marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <li>SMS gateway (interface ready for Gupshup/Karix)</li>
                <li>IVR voice call gateway</li>
                <li>INCOIS/IMD feed (realistic mock schema)</li>
                <li>BigQuery analytics (demo data)</li>
              </ul>
            </div>
          </div>

          <h3 className="mb-3">Tech Stack</h3>
          <div className="card mb-5" style={{ padding: 'var(--space-4)' }}>
            <table className="data-table">
              <tbody>
                <tr><td>Frontend</td><td>React (Vite), Vanilla CSS, PWA</td></tr>
                <tr><td>Backend</td><td>Python, FastAPI, Cloud Run</td></tr>
                <tr><td>AI</td><td>Gemini 2.0 Flash (Vertex AI)</td></tr>
                <tr><td>Voice</td><td>Google Cloud Text-to-Speech</td></tr>
                <tr><td>Database</td><td>Firestore (operational), BigQuery (analytics)</td></tr>
                <tr><td>Auth</td><td>Firebase Authentication</td></tr>
                <tr><td>Push</td><td>Firebase Cloud Messaging</td></tr>
                <tr><td>Hosting</td><td>Firebase Hosting + Cloud Run</td></tr>
              </tbody>
            </table>
          </div>

          <div className="text-center mb-5">
            <Link to="/" className="btn btn-primary btn-lg">← Back to Home</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
