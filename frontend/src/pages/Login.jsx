import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import Navbar from '../components/Navbar';
import { apiUrl } from '../api';

const describeAuthError = (error) => {
  const messages = {
    'auth/email-already-in-use': 'An account already exists for this email. Choose Sign In instead.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Use a password with at least six characters.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/network-request-failed': 'Firebase could not be reached. Check your internet connection and try again.',
  };

  return messages[error.code] || error.message.replace('Firebase: ', '');
};

const allowLocalAdminSignup = import.meta.env.VITE_ALLOW_LOCAL_ADMIN_SIGNUP === 'true';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('fisherman');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState('');
  const [zonesError, setZonesError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignUp) return undefined;
    let active = true;

    const loadZones = async () => {
      try {
        const response = await fetch(apiUrl('/api/zones'));
        if (!response.ok) throw new Error('Coastal zones could not be loaded.');
        const { zones: nextZones } = await response.json();
        if (!nextZones.length) throw new Error('No coastal zones are configured yet.');
        if (active) {
          setZones(nextZones);
          setZoneId((currentZone) => currentZone || nextZones[0].zone_id);
          setZonesError('');
        }
      } catch (loadError) {
        if (active) setZonesError(loadError.message);
      }
    };

    loadZones();
    return () => { active = false; };
  }, [isSignUp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp && role === 'admin' && !allowLocalAdminSignup) {
        throw new Error('Admin accounts are provisioned by the project owner. Create a fisherman account here, then assign admin access in Firestore for authorized officers.');
      }

      let userCredential;
      let profile;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        const registerResponse = await fetch(apiUrl('/api/users/register'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            preferred_language: 'en',
            zone_id: zoneId,
            name: email.split('@')[0],
            role,
          }),
        });

        if (!registerResponse.ok) {
          throw new Error('Account was created, but the TIDECAST profile could not be saved. Confirm the backend is running and try signing in again.');
        }

        profile = (await registerResponse.json()).user;
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        const profileResponse = await fetch(apiUrl('/api/users/me'), {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!profileResponse.ok) {
          throw new Error('Could not load your TIDECAST role. Confirm the backend is running and your Firestore user profile exists.');
        }

        profile = await profileResponse.json();
      }

      if (profile.role !== role) {
        throw new Error(`This account is registered as ${profile.role}. Select the matching role before signing in.`);
      }

      if (profile.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    } catch (err) {
      setError(describeAuthError(err));
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
                  disabled={isSignUp && !allowLocalAdminSignup}
                  title={isSignUp && !allowLocalAdminSignup ? 'Create a fisherman account first; admins are provisioned by the project owner.' : undefined}
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

            {isSignUp && (
              <div className="input-group">
                <label className="input-label" htmlFor="zone">Coastal Zone</label>
                <select
                  className="select"
                  id="zone"
                  value={zoneId}
                  onChange={(event) => setZoneId(event.target.value)}
                  disabled={Boolean(zonesError)}
                  required
                >
                  {zones.map((zone) => (
                    <option key={zone.zone_id} value={zone.zone_id}>
                      {zone.name}{zone.state ? ` — ${zone.state}` : ''}
                    </option>
                  ))}
                </select>
                {zonesError && <p role="alert" className="text-secondary mt-2">{zonesError}</p>}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full mt-3"
              disabled={loading || (isSignUp && (!zoneId || Boolean(zonesError)))}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {isSignUp && !allowLocalAdminSignup && (
            <p className="text-secondary mt-3" style={{ fontSize: 'var(--text-xs)' }}>
              Self-service registration creates a fisherman account. Admin accounts must be assigned
              by the project owner after verification.
            </p>
          )}

          <p className="text-center mt-4 text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => {
                const nextIsSignUp = !isSignUp;
                setIsSignUp(nextIsSignUp);
                if (nextIsSignUp) setRole('fisherman');
                setError('');
              }}
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
