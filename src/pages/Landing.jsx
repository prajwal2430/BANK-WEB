import { Link } from 'react-router-dom';
import { Shield, ArrowRight, CreditCard, TrendingUp, Lock, Zap, Users, Globe, ChevronDown } from 'lucide-react';
import './Landing.css';

const FEATURES = [
  { icon: CreditCard, title: 'Smart Account Management', desc: 'Multi-account dashboards with real-time balance tracking and automated insights.', color: '#3b7fff' },
  { icon: Shield, title: 'Bank-Grade Security', desc: '256-bit encryption and multi-factor authentication to keep your money safe.', color: '#00d4b4' },
  { icon: TrendingUp, title: 'Investment Tracking', desc: 'Monitor portfolios and investment accounts with detailed performance analytics.', color: '#f59e0b' },
  { icon: Zap, title: 'Instant Transfers', desc: 'Send money instantly between accounts with zero hidden fees.', color: '#7c3aed' },
  { icon: Users, title: 'Family Banking', desc: 'Manage joint accounts and set spending limits for linked family members.', color: '#ef4444' },
  { icon: Globe, title: 'Global Access', desc: '24/7 mobile and web access from anywhere in the world.', color: '#22c55e' },
];

const STATS = [
  { value: '2.4M+', label: 'Active Customers' },
  { value: '$48B+', label: 'Assets Managed' },
  { value: '99.99%', label: 'Uptime SLA' },
  { value: '157', label: 'Countries Served' },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-logo">
            <div className="logo-icon-sm"><Shield size={18} /></div>
            <span>NexaBank</span>
          </div>
          <nav className="landing-nav">
            <a href="#features">Features</a>
            <a href="#stats">About</a>
          </nav>
          <div className="landing-header-actions">
            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Open Account</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="pulse-dot" />
            Trusted by 2.4 million customers worldwide
          </div>
          <h1 className="hero-title">
            Banking That <br/>
            <span className="gradient-text">Works For You</span>
          </h1>
          <p className="hero-desc">
            Experience the future of banking with NexaBank. Manage accounts, transfer funds, 
            apply for loans, and track your wealth — all in one secure platform.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-ghost btn-lg">
              Sign In to Dashboard
            </Link>
          </div>
          <div className="hero-note">No credit card required • Free forever for personal use</div>
        </div>
        <div className="hero-scroll">
          <ChevronDown size={20} />
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="stats-section">
        <div className="stats-grid">
          {STATS.map(({ value, label }) => (
            <div key={label} className="stat-block">
              <div className="stat-block-value gradient-text">{value}</div>
              <div className="stat-block-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features-section">
        <div className="section-label">WHAT WE OFFER</div>
        <h2 className="section-title">Everything Your Money Needs</h2>
        <p className="section-sub">Powerful tools designed to help you build, protect, and grow your financial future.</p>
        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div className="feature-card" key={title}>
              <div className="feature-icon" style={{ background: `${color}20`, color }}>
                <Icon size={22} />
              </div>
              <h3 className="feature-title">{title}</h3>
              <p className="feature-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <div className="cta-orb" />
          <h2 className="cta-title">Start Your Banking Journey Today</h2>
          <p className="cta-sub">Join millions of customers who trust NexaBank with their financial future.</p>
          <div className="cta-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Free Account <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-logo">
          <div className="logo-icon-sm"><Shield size={16} /></div>
          <span>NexaBank</span>
        </div>
        <p>© 2026 NexaBank. All rights reserved. FDIC Insured.</p>
      </footer>
    </div>
  );
}
