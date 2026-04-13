import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import {
  LayoutDashboard, CreditCard, ArrowDownUp, ArrowLeftRight,
  Landmark, ClipboardList, BarChart2, LogOut, ChevronRight, Shield, Send
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts',     icon: CreditCard,      label: 'Accounts' },
  { to: '/deposits',     icon: ArrowDownUp,     label: 'Deposits & Withdrawals' },
  { to: '/transfer',     icon: ArrowLeftRight,  label: 'Fund Transfer' },
  { to: '/send',         icon: Send,            label: 'Send Money', badge: 'UPI' },
  { to: '/loans',        icon: Landmark,        label: 'Loan Management' },
  { to: '/transactions', icon: ClipboardList,   label: 'Transactions' },
  { to: '/reports',      icon: BarChart2,       label: 'Reports' },
];

export default function Sidebar() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Shield size={22} />
        </div>
        <div>
          <span className="logo-name">NexaBank</span>
          <span className="logo-tagline">Secure Banking</span>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="sidebar-user">
          <div className="user-avatar">{user.avatar}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-id">ID: {user.id}</div>
          </div>
          <span className="badge badge-success" style={{fontSize:'0.65rem'}}>✓</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">NAVIGATION</div>
        {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={18} className="nav-icon" />
            <span className="nav-label">{label}</span>
            {badge && (
              <span style={{marginLeft:'auto',fontSize:'0.6rem',fontWeight:700,
                padding:'1px 5px',borderRadius:99,
                background:'linear-gradient(135deg,var(--clr-primary),var(--clr-accent))',
                color:'#fff',letterSpacing:'0.05em'}}>{badge}</span>
            )}
            <ChevronRight size={14} className="nav-arrow" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <div className="sidebar-divider" />
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <LogOut size={18} className="nav-icon" />
          <span className="nav-label">Logout</span>
        </button>
        <div className="sidebar-version">NexaBank v2.0 © 2026</div>
      </div>
    </aside>
  );
}
