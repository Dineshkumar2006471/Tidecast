import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import Navbar from '../components/Navbar';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('fisherman');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Store role in Firestore via API
        const token = await userCredential.user.getIdToken();
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            preferred_language: 'en',
            zone_id: 'zone-kanyakumari',
            name: email.split('@')[0],
          }),
        });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      // Redirect based on role
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar variant="landing" />
      <div className="page-content" style={{ paddingTop: 40 }}>
        <div className="container" style={{ maxWidth: 440, paddingTop: 'var(--space-8)' }}>
          <div className="text-center mb-5">
            <img src="/tidecast-logo.png" alt="TIDECAST" style={{ height: 48, margin: '0 auto var(--space-4)' }} />
            <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
            <p className="text-secondary mt-2">
              {isSignUp
                ? 'Register to receive coastal advisories'
                : 'Access your advisory dashboard'}
            </p>
          </div>

          {error && (
            <div style={{
              background: 'var(--tc-alert-red-bg)',
              color: 'var(--tc-alert-red)',
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">I am a</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  className={`btn ${role === 'fisherman' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setRole('fisherman')}
                >
                  🎣 Fisherman
                </button>
                <button
                  type="button"
                  className={`btn ${role === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setRole('admin')}
                >
                  📋 Admin / Officer
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="email">Email</label>
              <input
                className="input"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <input
                className="input"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full mt-3"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p className="text-center mt-4 text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: 'var(--text-sm)' }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          <p className="text-center mt-5" style={{ fontSize: 'var(--text-xs)', color: 'var(--tc-text-tertiary)' }}>
            <Link to="/" style={{ color: 'var(--tc-text-tertiary)' }}>← Back to Home</Link>
          </p>
        </div>
      </div>
    </>
  );
}
