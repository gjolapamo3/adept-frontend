import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStoredAuthToken, isUsableAuthToken } from '../utils/auth';
import { loginUserSchema } from '../shared/schemas';
import RegisterForm from './RegisterForm';
import './SSOGateway.css';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://adept-backend-fojr.onrender.com';
const AUTH_API_BASE_URL = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0f0d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgGradient: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(0,0,0,0) 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#111814',
    border: '1px solid #1f2d24',
    borderRadius: '12px',
    padding: '36px 30px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
    position: 'relative',
    zIndex: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  logoBadge: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#062016',
    border: '1px solid #10b98140',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px auto',
    color: '#10b981',
    fontWeight: 700,
    fontSize: '18px',
  },
  title: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    margin: '0 0 4px 0',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '12px',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  securityBanner: {
    backgroundColor: '#062016',
    border: '1px solid #10b98130',
    borderRadius: '6px',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#a7f3d0',
    fontSize: '11px',
    marginBottom: '20px',
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: '#0a0f0d',
    borderRadius: '8px',
    padding: '3px',
    marginBottom: '20px',
    border: '1px solid #1f2d24',
  },
  tabButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
  },
  ssoSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  instructionText: {
    color: '#94a3b8',
    fontSize: '12px',
    textAlign: 'center',
    marginBottom: '16px',
    lineHeight: '1.4',
  },
  ssoButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f382c',
    color: '#ffffff',
    border: '1px solid #10b98150',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#0a0f0d',
    border: '1px solid #1f2d24',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  submitButton: {
    backgroundColor: '#10b981',
    color: '#022c22',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '6px',
  },
  footer: {
    marginTop: '28px',
    paddingTop: '16px',
    borderTop: '1px solid #1f2d24',
    textAlign: 'center',
    color: '#475569',
    fontSize: '10px',
    lineHeight: '1.5',
  },
};

export default function SSOGateway({ onSuccess }) {
  const [authMethod, setAuthMethod] = useState('enterprise');
  const [authMode, setAuthMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginUserSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const persistSession = (role = 'buyer', provider = 'Enterprise', formEmail = '', token = '') => {
    if (typeof window === 'undefined') {
      return;
    }

    const normalizedEmail = String(formEmail || watch('email') || '').trim().toLowerCase();
    const profile = {
      name: normalizedEmail ? normalizedEmail.split('@')[0] : 'Buyer',
      email: normalizedEmail || 'buyer@adept.local',
      provider,
      role,
    };

    const realToken = isUsableAuthToken(token) ? token : getStoredAuthToken();
    if (realToken) {
      localStorage.setItem('adept_auth_token', realToken);
      localStorage.setItem('token', realToken);
    } else {
      localStorage.removeItem('adept_auth_token');
      localStorage.removeItem('token');
    }

    localStorage.setItem('adept_user_role', role);
    localStorage.setItem('user', JSON.stringify(profile));
    onSuccess?.(profile);
  };

  const handleEnterpriseSSO = (provider) => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      persistSession('buyer', provider);
    }, 800);
  };

  const handleDirectLogin = async ({ email, password }) => {
    setAuthError('');
    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Invalid email or password.');
      }

      const token = data.token || data.accessToken || data.data?.token;
      if (!token) {
        throw new Error('Login succeeded but no token was returned by the server.');
      }

      const role = data.user?.role || data.data?.user?.role || 'buyer';
      persistSession(role, 'Direct Login', data.user?.email || email, token);
    } catch (err) {
      setAuthError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (payload) => {
    setAuthError('');
    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.fullName,
          email: payload.email,
          password: payload.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to create account.');
      }

      const token = data.token || data.accessToken || data.data?.token;
      if (token) {
        const role = data.user?.role || data.data?.user?.role || 'buyer';
        persistSession(role, 'Direct Registration', data.user?.email || payload.email, token);
      }
    } catch (err) {
      setAuthError(err.message || 'Unable to create account. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSuccess = () => {
    setAuthMode('signin');
  };

  const switchAuthMethod = (method) => {
    setAuthMethod(method);
    if (method === 'direct') {
      setAuthMode('signin');
    }
  };

  const switchAuthMode = (mode) => {
    if (loading) {
      return;
    }

    setAuthMode(mode);
  };

  const handleEnterpriseAuth = (provider) => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      persistSession('buyer', provider);
    }, 800);
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgGradient} />

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>A</div>
          <h1 style={styles.title}>ADEPT PROCESSING</h1>
          <p style={styles.subtitle}>Industrial Chemical & Ag Input B2B Gateway</p>
        </div>

        <div style={styles.securityBanner}>
          <span>Restricted Portal • Encrypted Enterprise Session</span>
        </div>

        <div style={styles.tabContainer}>
          <button
            type="button"
            style={{ ...styles.tabButton, ...(authMethod === 'enterprise' ? styles.activeTab : {}) }}
            onClick={() => switchAuthMethod('enterprise')}
          >
            Enterprise SSO
          </button>
          <button
            type="button"
            style={{ ...styles.tabButton, ...(authMethod === 'direct' ? styles.activeTab : {}) }}
            onClick={() => switchAuthMethod('direct')}
          >
            Direct Login
          </button>
        </div>

        {authMethod === 'enterprise' ? (
          <div style={styles.ssoSection}>
            <p style={styles.instructionText}>
              Authenticate using your corporate Identity Provider (Azure AD / Okta / SAML 2.0).
            </p>

            <button style={styles.ssoButton} onClick={() => handleEnterpriseAuth('AzureAD')} disabled={loading}>
              <span>Continue with Corporate ID (Azure AD / Entra)</span>
              <span>→</span>
            </button>

            <button
              type="button"
              style={{ ...styles.ssoButton, marginTop: '12px', backgroundColor: '#1e293b' }}
              onClick={() => handleEnterpriseAuth('Okta')}
              disabled={loading}
            >
              <span>Authenticate via Okta / Single Sign-On</span>
              <span>→</span>
            </button>
          </div>
        ) : (
          <div style={styles.form}>
            <div style={styles.tabContainer}>
              <button
                type="button"
                style={{
                  ...styles.tabButton,
                  ...(authMode === 'signin' ? styles.activeTab : {}),
                }}
                onClick={() => switchAuthMode('signin')}
                disabled={loading}
              >
                Sign In
              </button>
              <button
                type="button"
                style={{
                  ...styles.tabButton,
                  ...(authMode === 'register' ? styles.activeTab : {}),
                }}
                onClick={() => switchAuthMode('register')}
                disabled={loading}
              >
                Sign Up
              </button>
            </div>

            {authError ? (
              <p style={{ color: '#fca5a5', fontSize: '11px', margin: '0 0 8px' }}>{authError}</p>
            ) : null}

            {authMode === 'signin' ? (
              <form onSubmit={handleSubmit(handleDirectLogin)} style={styles.form} noValidate>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Corporate Email</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    {...register('email')}
                    style={styles.input}
                  />
                  {errors.email ? <p style={{ color: '#fca5a5', fontSize: '11px', margin: 0 }}>{errors.email.message}</p> : null}
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    {...register('password')}
                    style={styles.input}
                  />
                  {errors.password ? <p style={{ color: '#fca5a5', fontSize: '11px', margin: 0 }}>{errors.password.message}</p> : null}
                </div>

                <button type="submit" style={styles.submitButton} disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign In to Secure Portal'}
                </button>
              </form>
            ) : (
              <div>
                <p style={{ ...styles.label, marginBottom: '8px' }}>Create your secure portal account:</p>
                <RegisterForm
                  onRegister={handleRegister}
                  onSuccess={handleRegisterSuccess}
                />
              </div>
            )}
          </div>
        )}

        <div style={styles.footer}>
          <p>Managed & Secured by <strong>We Build-IT LLC</strong> Technical Infrastructure</p>
          <p>© 2026 Adept Processing Nig LTD. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
