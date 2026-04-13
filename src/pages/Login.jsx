import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  /* ── Main login ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please enter email and password'); return; }
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);   // waits for API + sets isAuthenticated
      navigate('/dashboard');                   // only runs after successful login
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb-1"/><div className="auth-orb-2"/>
      </div>

      <div className="auth-left hide-mobile">
        <div className="auth-brand">
          <div className="logo-icon"><Shield size={26}/></div>
          <div>
            <div className="brand-name">NexaBank</div>
            <div className="brand-sub">Professional Banking</div>
          </div>
        </div>
        <div className="auth-tagline">
          <h2>Welcome Back to<br/><span className="gradient-text">NexaBank</span></h2>
          <p>Your trusted financial partner. Secure, reliable, and always available.</p>
        </div>
        <div className="auth-stats">
          <div className="auth-stat"><div className="auth-stat-val">₹48,000Cr+</div><div className="auth-stat-lbl">Assets Managed</div></div>
          <div className="auth-stat"><div className="auth-stat-val">24L+</div><div className="auth-stat-lbl">Happy Customers</div></div>
          <div className="auth-stat"><div className="auth-stat-val">99.99%</div><div className="auth-stat-lbl">Uptime</div></div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">Sign In</h1>
            <p className="auth-sub">Enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <AlertCircle size={15}/> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrap">
                <Mail size={16} className="input-icon"/>
                <input className="form-input input-with-icon" type="email"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="your@email.com" autoComplete="email" required/>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{display:'flex',justifyContent:'space-between'}}>
                Password
                <a href="#" className="auth-link forgot-link">Forgot Password?</a>
              </label>
              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon"/>
                <input className="form-input input-with-icon"
                  type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="Your password" style={{paddingRight:'3rem'}}
                  autoComplete="current-password" required/>
                <button type="button" className="input-toggle" onClick={() => setShowPass(p => !p)}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <div className="auth-actions">
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading
                  ? <><div className="spinner"/> Signing In…</>
                  : 'Sign In to Dashboard →'}
              </button>
            </div>
          </form>

          <div className="divider"/>
          <div className="auth-footer-text" style={{marginTop:'1.25rem'}}>
            No account yet? <Link to="/register" className="auth-link">Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
