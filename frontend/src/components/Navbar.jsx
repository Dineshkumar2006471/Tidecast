import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ variant = 'landing' }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand" aria-label="TIDECAST Home">
          <img src="/tidecast-logo.png" alt="TIDECAST" />
        </Link>

        {variant === 'landing' && (
          <ul className="navbar-links">
            <li><a href="#product" className={isActive('#product') ? 'active' : ''}>Product</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#impact">Impact</a></li>
            <li><a href="#team">Team</a></li>
          </ul>
        )}

        {variant === 'app' && (
          <ul className="navbar-links">
            <li><Link to="/app" className={isActive('/app') ? 'active' : ''}>Advisories</Link></li>
          </ul>
        )}

        {variant === 'admin' && (
          <ul className="navbar-links">
            <li><Link to="/admin" className={isActive('/admin') && !location.pathname.includes('compose') ? 'active' : ''}>Dashboard</Link></li>
            <li><Link to="/admin/compose" className={location.pathname.includes('compose') ? 'active' : ''}>Compose</Link></li>
            <li><Link to="/admin/logs" className={location.pathname.includes('logs') ? 'active' : ''}>Logs</Link></li>
          </ul>
        )}

        <div className="navbar-actions">
          {variant === 'landing' ? (
            <>
              <Link to="/login" className="btn btn-ghost">Sign In</Link>
              <Link to="/login" className="btn btn-primary">Get Started</Link>
            </>
          ) : (
            <Link to="/" className="btn btn-ghost">Sign Out</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
