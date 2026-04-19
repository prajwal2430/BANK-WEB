import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';
import Layout from './components/layout/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Accounts from './pages/Accounts.jsx';
import Deposits from './pages/Deposits.jsx';
import Transfer from './pages/Transfer.jsx';
import SendMoney from './pages/SendMoney.jsx';
import Loans from './pages/Loans.jsx';
import Transactions from './pages/Transactions.jsx';
import Reports from './pages/Reports.jsx';
import './styles/index.css';

/* ── Full-screen loading spinner ── */
const Spinner = () => (
  <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--clr-bg)'}}>
    <div style={{textAlign:'center'}}>
      <div style={{width:48,height:48,border:'3px solid rgba(59,127,255,0.2)',borderTopColor:'var(--clr-primary)',
        borderRadius:'50%',animation:'spin 0.7s linear infinite',margin:'0 auto 1rem'}}/>
      <div style={{color:'var(--clr-text-muted)',fontSize:'0.9rem'}}>Loading NexaBank…</div>
    </div>
  </div>
);

/* ── Guards ──
   PrivateGuard: renders <Layout> (with <Outlet>) if logged in, else redirects to /login
   PublicGuard:  renders the auth page if NOT logged in, else redirects to /dashboard
*/
const PrivateGuard = () => {
  const { isAuthenticated, authLoading } = useApp();
  if (authLoading) return <Spinner />;
  return isAuthenticated ? <Layout /> : <Navigate to="/login" replace />;
};

const PublicGuard = () => {
  const { isAuthenticated, authLoading } = useApp();
  if (authLoading) return <Spinner />;
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  const { isAuthenticated } = useApp();

  return (
    <Routes>
      {/* Public landing — Redirect to dashboard if already logged in */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />

      {/* Auth pages — redirect to dashboard if already logged in */}
      <Route element={<PublicGuard />}>
        <Route path="/register" element={<Register />} />
        <Route path="/login"    element={<Login />} />
      </Route>

      {/* Protected pages — Layout contains <Outlet> for child routes */}
      <Route element={<PrivateGuard />}>
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/accounts"     element={<Accounts />} />
        <Route path="/deposits"     element={<Deposits />} />
        <Route path="/transfer"     element={<Transfer />} />
        <Route path="/send"         element={<SendMoney />} />
        <Route path="/loans"        element={<Loans />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/reports"      element={<Reports />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
