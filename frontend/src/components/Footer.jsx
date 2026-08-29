import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><a href="#product">How It Works</a></li>
              <li><a href="#impact">Impact</a></li>
              <li><a href="#war-factors">What's Unique</a></li>
              <li><Link to="/login">Get Started</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Team</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><a href="https://github.com/Dineshkumar2006471/Tidecast" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Built With</h4>
            <ul>
              <li><a href="https://cloud.google.com" target="_blank" rel="noopener noreferrer">Google Cloud Platform</a></li>
              <li><a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer">Gemini AI</a></li>
              <li><a href="https://firebase.google.com" target="_blank" rel="noopener noreferrer">Firebase</a></li>
              <li><a href="https://cloud.google.com/text-to-speech" target="_blank" rel="noopener noreferrer">Cloud Text-to-Speech</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><span style={{ color: 'var(--tc-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                This is a hackathon submission for educational and demonstration purposes.
              </span></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 TIDECAST. Built for the 6R Hackathon.</span>
          <span className="mono">Dinesh Kumar (Max)</span>
        </div>
      </div>
    </footer>
  );
}
