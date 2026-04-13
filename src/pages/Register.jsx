import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Shield, User, Mail, Phone, MapPin, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import './Auth.css';

const STEPS = ['Personal Info', 'Contact Details', 'Security'];

export default function Register() {
  const { registerUser } = useApp();
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    password: '', confirm: '', agree: false,
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.name.trim())           e.name  = 'Full name is required';
      if (!form.email.includes('@'))   e.email = 'Valid email required';
    }
    if (step === 1) {
      if (!form.phone.trim())          e.phone   = 'Phone number is required';
      if (!form.address.trim())        e.address = 'Address is required';
    }
    if (step === 2) {
      if (form.password.length < 8)        e.password = 'Must be at least 8 characters';
      if (form.password !== form.confirm)  e.confirm  = 'Passwords do not match';
      if (!form.agree)                     e.agree    = 'You must agree to terms';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validate()) setStep(s => s + 1); };
  const prevStep = () => { setStep(s => s - 1); setApiError(''); };

  /* ── Submit — properly awaits the API ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      await registerUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
      });
      navigate('/dashboard');           // only runs after successful API response
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
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
          <h2>Open Your Account in<br/><span className="gradient-text">3 Simple Steps</span></h2>
          <p>Join millions managing their finances securely with NexaBank.</p>
        </div>
        <div className="auth-perks">
          {['No monthly fees', 'Instant account activation', 'Bank-grade 256-bit security', '24/7 customer support'].map(p => (
            <div key={p} className="perk-item"><CheckCircle size={16} className="perk-icon"/>{p}</div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-sub">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>

          {/* Step indicator */}
          <div className="step-indicator">
            {STEPS.map((s, i) => (
              <div key={s} className={`step-dot ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                {i < step ? <CheckCircle size={14}/> : <span>{i + 1}</span>}
              </div>
            ))}
          </div>

          {apiError && (
            <div className="alert alert-danger" style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1rem'}}>
              <AlertCircle size={15}/> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 0 — Personal Info */}
            {step === 0 && (
              <div className="animate-fade-up">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-icon-wrap">
                    <User size={16} className="input-icon"/>
                    <input className="form-input input-with-icon" value={form.name}
                      onChange={e => set('name', e.target.value)} placeholder="Raj Kumar"/>
                  </div>
                  {errors.name && <div className="field-error">{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-icon-wrap">
                    <Mail size={16} className="input-icon"/>
                    <input className="form-input input-with-icon" type="email" value={form.email}
                      onChange={e => set('email', e.target.value)} placeholder="raj@example.com"/>
                  </div>
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </div>
              </div>
            )}

            {/* Step 1 — Contact */}
            {step === 1 && (
              <div className="animate-fade-up">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="input-icon-wrap">
                    <Phone size={16} className="input-icon"/>
                    <input className="form-input input-with-icon" value={form.phone}
                      onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210"/>
                  </div>
                  {errors.phone && <div className="field-error">{errors.phone}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <div className="input-icon-wrap">
                    <MapPin size={16} className="input-icon"/>
                    <input className="form-input input-with-icon" value={form.address}
                      onChange={e => set('address', e.target.value)} placeholder="123 MG Road, Mumbai, MH"/>
                  </div>
                  {errors.address && <div className="field-error">{errors.address}</div>}
                </div>
              </div>
            )}

            {/* Step 2 — Security */}
            {step === 2 && (
              <div className="animate-fade-up">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-icon-wrap">
                    <Lock size={16} className="input-icon"/>
                    <input className="form-input input-with-icon"
                      type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="Min. 8 characters" style={{paddingRight:'3rem'}}/>
                    <button type="button" className="input-toggle" onClick={() => setShowPass(p => !p)}>
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                  {errors.password && <div className="field-error">{errors.password}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-icon-wrap">
                    <Lock size={16} className="input-icon"/>
                    <input className="form-input input-with-icon" type="password" value={form.confirm}
                      onChange={e => set('confirm', e.target.value)} placeholder="Re-enter password"/>
                  </div>
                  {errors.confirm && <div className="field-error">{errors.confirm}</div>}
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={form.agree} onChange={e => set('agree', e.target.checked)}/>
                    <span>I agree to the <a href="#" className="auth-link">Terms of Service</a> and <a href="#" className="auth-link">Privacy Policy</a></span>
                  </label>
                  {errors.agree && <div className="field-error">{errors.agree}</div>}
                </div>
              </div>
            )}

            <div className="auth-actions">
              {step > 0 && (
                <button type="button" className="btn btn-ghost btn-full" onClick={prevStep} disabled={loading}>Back</button>
              )}
              {step < 2 ? (
                <button type="button" className="btn btn-primary btn-full" onClick={nextStep}>Continue →</button>
              ) : (
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading
                    ? <><div className="spinner"/> Creating Account…</>
                    : 'Create Account & Sign In'}
                </button>
              )}
            </div>
          </form>

          <div className="auth-footer-text">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
