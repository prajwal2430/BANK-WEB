import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { CreditCard, Plus, TrendingUp, X, Activity, CheckCircle } from 'lucide-react';
import { inr } from '../utils/currency.js';

const ACCOUNT_TYPES = ['Savings', 'Checking', 'Fixed Deposit', 'Investment'];
const RATE_MAP = { Savings: 3.5, Checking: 0, 'Fixed Deposit': 5.8, Investment: 6.8 };
const COLOR_MAP = { Savings:'#3b7fff', Checking:'#00d4b4', 'Fixed Deposit':'#f59e0b', Investment:'#7c3aed' };

export default function Accounts() {
  const { accounts, addAccount } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('Savings');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const handleCreate = async () => {
    setError('');
    setLoading(true);
    try {
      await addAccount(selectedType);
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Account Management</h1>
          <p className="page-subtitle">All your bank accounts in one place</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16}/> New Account
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-3" style={{marginBottom:'1.75rem'}}>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#3b7fff,#638bff)'}}>
          <div className="stat-icon" style={{background:'rgba(59,127,255,0.15)',color:'var(--clr-primary-light)'}}><CreditCard size={20}/></div>
          <div className="stat-value">{accounts.length}</div>
          <div className="stat-label">Total Accounts</div>
        </div>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#22c55e,#16a34a)'}}>
          <div className="stat-icon" style={{background:'rgba(34,197,94,0.15)',color:'var(--clr-success)'}}><TrendingUp size={20}/></div>
          <div className="stat-value" style={{fontSize:'1.3rem'}}>{inr(totalBalance)}</div>
          <div className="stat-label">Total Balance</div>
        </div>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#00d4b4,#00b8a0)'}}>
          <div className="stat-icon" style={{background:'rgba(0,212,180,0.15)',color:'var(--clr-accent)'}}><Activity size={20}/></div>
          <div className="stat-value">{accounts.filter(a=>a.status==='Active').length}</div>
          <div className="stat-label">Active Accounts</div>
        </div>
      </div>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <div className="card" style={{textAlign:'center',padding:'3rem'}}>
          <CreditCard size={56} style={{opacity:0.2,marginBottom:'1rem'}}/>
          <h3 style={{marginBottom:'0.5rem'}}>No Accounts Yet</h3>
          <p style={{marginBottom:'1.5rem',color:'var(--clr-text-muted)'}}>Open your first bank account to start banking with NexaBank.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16}/> Open First Account</button>
        </div>
      ) : (
        <>
          <div className="grid grid-3">
            {accounts.map((acc, i) => (
              <div key={acc._id} className="account-card animate-fade-up" style={{animationDelay:`${i*0.08}s`,'--card-color':COLOR_MAP[acc.type]||'#3b7fff'}}>
                <div className="account-card-top">
                  <div className="account-card-type">{acc.type} Account</div>
                  <span className="badge badge-success">{acc.status}</span>
                </div>
                <div className="account-card-number">{acc.number}</div>
                <div className="account-card-balance">
                  <div className="account-card-balance-label">Available Balance</div>
                  <div className="account-card-balance-val">{inr(acc.balance)}</div>
                </div>
                <div className="account-card-footer">
                  <div><div className="account-card-footer-label">Interest Rate</div><div className="account-card-footer-val">{acc.interestRate}% p.a.</div></div>
                  <div><div className="account-card-footer-label">Currency</div><div className="account-card-footer-val">{acc.currency}</div></div>
                  <div><div className="account-card-footer-label">Opened</div><div className="account-card-footer-val">{new Date(acc.createdAt).toLocaleDateString('en-IN')}</div></div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card" style={{marginTop:'1.75rem'}}>
            <div className="card-header"><div className="card-title">Account Summary</div></div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Type</th><th>Account Number</th><th>Balance</th><th>Interest Rate</th><th>Status</th><th>Opened</th></tr>
                </thead>
                <tbody>
                  {accounts.map(acc => (
                    <tr key={acc._id}>
                      <td style={{fontWeight:600}}>{acc.type}</td>
                      <td style={{fontFamily:'monospace'}}>{acc.number}</td>
                      <td style={{fontWeight:700}}>{inr(acc.balance)}</td>
                      <td>{acc.interestRate}%</td>
                      <td><span className="badge badge-success">{acc.status}</span></td>
                      <td style={{color:'var(--clr-text-muted)'}}>{new Date(acc.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Open New Account</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            <p style={{color:'var(--clr-text-muted)',fontSize:'0.88rem',marginBottom:'1.5rem'}}>Select the type of account you want to open.</p>
            {error && <div className="alert alert-danger" style={{marginBottom:'1rem'}}>{error}</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1.5rem'}}>
              {ACCOUNT_TYPES.map(type => (
                <button key={type}
                  style={{background:selectedType===type?`${COLOR_MAP[type]}15`:'rgba(255,255,255,0.03)',
                    border:`1.5px solid ${selectedType===type?COLOR_MAP[type]:'var(--clr-border)'}`,
                    borderRadius:'var(--radius-md)',padding:'1rem',textAlign:'left',cursor:'pointer',
                    transition:'var(--transition)',color:'var(--clr-text)',position:'relative'}}
                  onClick={() => setSelectedType(type)}>
                  <div style={{fontWeight:600,fontSize:'0.9rem',marginBottom:'0.2rem'}}>{type}</div>
                  <div style={{fontSize:'0.78rem',color:'var(--clr-text-muted)'}}>{RATE_MAP[type]}% p.a. interest</div>
                  {selectedType===type && <CheckCircle size={15} style={{position:'absolute',top:'0.6rem',right:'0.6rem',color:COLOR_MAP[type]}}/>}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button className="btn btn-ghost btn-full" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-full" onClick={handleCreate} disabled={loading}>
                {loading ? <><div className="spinner"/> Opening...</> : 'Open Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .account-card{background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:var(--radius-lg);padding:1.5rem;position:relative;overflow:hidden;transition:var(--transition)}
        .account-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--card-color)}
        .account-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-card);border-color:rgba(99,139,255,0.3)}
        .account-card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
        .account-card-type{font-size:0.82rem;font-weight:600;color:var(--clr-text-muted)}
        .account-card-number{font-family:monospace;font-size:1.1rem;letter-spacing:0.1em;color:var(--clr-text);margin-bottom:1.25rem}
        .account-card-balance-label{font-size:0.75rem;color:var(--clr-text-dim);margin-bottom:0.25rem}
        .account-card-balance-val{font-family:var(--font-display);font-size:1.6rem;font-weight:800;color:var(--clr-text)}
        .account-card-footer{display:flex;justify-content:space-between;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--clr-border)}
        .account-card-footer-label{font-size:0.7rem;color:var(--clr-text-dim);margin-bottom:2px}
        .account-card-footer-val{font-size:0.8rem;font-weight:600;color:var(--clr-text-muted)}
      `}</style>
    </div>
  );
}
