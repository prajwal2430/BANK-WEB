import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowDownCircle, ArrowUpCircle, DollarSign, AlertTriangle, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { inr, inrShort } from '../utils/currency.js';

export default function Deposits() {
  const { accounts, transactions, stats, deposit, withdraw } = useApp();
  const [tab, setTab] = useState('deposit');
  const [form, setForm] = useState({ accountId: '', amount: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  // Set default account when accounts load
  const effectiveAccountId = form.accountId || accounts[0]?._id || '';
  const selectedAcc = accounts.find(a => a._id === effectiveAccountId);

  /* ── Dynamic stats from backend ── */
  const creditThisMonth = stats?.currentMonth?.credit || 0;
  const debitThisMonth  = stats?.currentMonth?.debit  || 0;
  const txnCount        = stats?.currentMonth?.txnCount || 0;

  /* ── Today's amounts from local transactions ── */
  const today = new Date().toISOString().slice(0, 10);
  const todayCredit = useMemo(() =>
    transactions.filter(t => t.createdAt?.slice(0,10) === today && t.type === 'credit').reduce((s,t)=>s+t.amount,0),
    [transactions, today]);
  const todayDebit  = useMemo(() =>
    transactions.filter(t => t.createdAt?.slice(0,10) === today && t.type === 'debit').reduce((s,t)=>s+t.amount,0),
    [transactions, today]);

  /* ── Recent deposit/withdrawal activity ── */
  const recentActivity = useMemo(() =>
    transactions.filter(t => ['Deposit','Withdrawal'].includes(t.category)).slice(0, 5),
    [transactions]);

  const getAccName = (acc) => {
    if (!acc) return '—';
    if (typeof acc === 'object') return acc.type;
    return accounts.find(a => a._id === acc)?.type || '—';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return; }
    if (!effectiveAccountId) { setError('Select an account'); return; }
    setLoading(true);
    try {
      const payload = { accountId: effectiveAccountId, amount: amt, note: form.note };
      if (tab === 'deposit') await deposit(payload);
      else await withdraw(payload);
      setDone(true);
      setForm(p => ({ ...p, amount: '', note: '' }));
      setTimeout(() => setDone(false), 3500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const depositLimit  = 500000;
  const withdrawLimit = 100000;
  const monthlyLimit  = 5000000;

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1 className="page-title">Deposits & Withdrawals</h1>
        <p className="page-subtitle">All amounts update instantly after each transaction</p>
      </div>

      {/* Dynamic Stats */}
      <div className="grid grid-4" style={{marginBottom:'1.75rem'}}>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#22c55e,#16a34a)'}}>
          <div className="stat-icon" style={{background:'rgba(34,197,94,0.15)',color:'var(--clr-success)'}}><ArrowDownCircle size={20}/></div>
          <div className="stat-value" style={{fontSize:'1.35rem'}}>{inrShort(creditThisMonth)}</div>
          <div className="stat-label">Total Credits This Month</div>
          <div className="stat-change up"><TrendingUp size={13}/> {stats?.currentMonth?.txnCount||0} transactions</div>
        </div>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#ef4444,#dc2626)'}}>
          <div className="stat-icon" style={{background:'rgba(239,68,68,0.15)',color:'var(--clr-danger)'}}><ArrowUpCircle size={20}/></div>
          <div className="stat-value" style={{fontSize:'1.35rem'}}>{inrShort(debitThisMonth)}</div>
          <div className="stat-label">Total Debits This Month</div>
          <div className="stat-change down"><TrendingDown size={13}/> Spent so far</div>
        </div>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#3b7fff,#638bff)'}}>
          <div className="stat-icon" style={{background:'rgba(59,127,255,0.15)',color:'var(--clr-primary-light)'}}><DollarSign size={20}/></div>
          <div className="stat-value" style={{fontSize:'1.35rem', color: creditThisMonth>=debitThisMonth?'var(--clr-success)':'var(--clr-danger)'}}>
            {creditThisMonth>=debitThisMonth?'+':''}{inrShort(creditThisMonth - debitThisMonth)}
          </div>
          <div className="stat-label">Net Flow This Month</div>
          <div className={`stat-change ${creditThisMonth>=debitThisMonth?'up':'down'}`}>
            {creditThisMonth>=debitThisMonth?<TrendingUp size={13}/>:<TrendingDown size={13}/>}
            {creditThisMonth>=debitThisMonth?'Positive':'Negative'} cashflow
          </div>
        </div>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#f59e0b,#d97706)'}}>
          <div className="stat-icon" style={{background:'rgba(245,158,11,0.15)',color:'var(--clr-gold)'}}><CreditCard size={20}/></div>
          <div className="stat-value">{accounts.reduce((s,a)=>s+a.balance,0) > 0 ? inrShort(accounts.reduce((s,a)=>s+a.balance,0)) : '₹0'}</div>
          <div className="stat-label">Total Portfolio Balance</div>
          <div className="stat-change up"><TrendingUp size={13}/> Across {accounts.length} account{accounts.length!==1?'s':''}</div>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="card" style={{textAlign:'center',padding:'3rem'}}>
          <CreditCard size={56} style={{opacity:0.2,marginBottom:'1rem'}}/>
          <h3 style={{marginBottom:'0.5rem'}}>No Accounts Found</h3>
          <p style={{marginBottom:'1.5rem',color:'var(--clr-text-muted)'}}>Open a bank account first before making deposits or withdrawals.</p>
          <a href="/accounts" className="btn btn-primary">Open Account</a>
        </div>
      ) : (
        <div className="grid grid-2">
          {/* Form */}
          <div className="card">
            <div className="tab-bar" style={{marginBottom:'1.5rem'}}>
              <button className={`tab-btn${tab==='deposit'?' active':''}`} onClick={()=>setTab('deposit')}><ArrowDownCircle size={16}/> Deposit</button>
              <button className={`tab-btn${tab==='withdraw'?' active':''}`} onClick={()=>setTab('withdraw')}><ArrowUpCircle size={16}/> Withdraw</button>
            </div>

            {done && <div className="alert alert-success">✓ {tab==='deposit'?'Deposit':'Withdrawal'} processed!</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Account</label>
                <select className="form-select" value={effectiveAccountId} onChange={e => set('accountId', e.target.value)}>
                  {accounts.map(a => (
                    <option key={a._id} value={a._id}>{a.type} — {a.number} ({inr(a.balance)})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (INR ₹)</label>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute',left:'1rem',top:'50%',transform:'translateY(-50%)',color:'var(--clr-text-dim)',fontSize:'1rem',fontWeight:600}}>₹</span>
                  <input className="form-input" style={{paddingLeft:'2rem',fontSize:'1.2rem',fontWeight:700}}
                    type="number" min="1" step="1" value={form.amount}
                    onChange={e=>set('amount',e.target.value)} placeholder="0" required />
                </div>
                {selectedAcc && (
                  <div style={{fontSize:'0.75rem',color:'var(--clr-text-dim)',marginTop:'0.3rem'}}>
                    Available: <strong style={{color:'var(--clr-text)'}}>{inr(selectedAcc.balance)}</strong>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Reference / Note</label>
                <input className="form-input" value={form.note} onChange={e=>set('note',e.target.value)} placeholder="Optional description"/>
              </div>

              {tab==='withdraw' && selectedAcc && parseFloat(form.amount) > selectedAcc.balance && (
                <div className="alert alert-danger" style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
                  <AlertTriangle size={16}/> Insufficient balance. Available: {inr(selectedAcc.balance)}
                </div>
              )}

              <button type="submit" className={`btn ${tab==='deposit'?'btn-accent':'btn-danger'} btn-full btn-lg`} disabled={loading}>
                {loading
                  ? <><div className="spinner"/>Processing...</>
                  : tab==='deposit'
                    ? <><ArrowDownCircle size={18}/> Deposit Funds</>
                    : <><ArrowUpCircle size={18}/> Withdraw Funds</>}
              </button>
            </form>
          </div>

          {/* Right panel */}
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {/* Account details */}
            {selectedAcc && (
              <div className="card">
                <div className="card-header"><div className="card-title">Selected Account</div></div>
                <div style={{display:'flex',flexDirection:'column',gap:'0.55rem'}}>
                  {[
                    ['Type',     selectedAcc.type],
                    ['Number',   selectedAcc.number],
                    ['Balance',  inr(selectedAcc.balance)],
                    ['Interest', `${selectedAcc.interestRate}% p.a.`],
                    ['Status',   selectedAcc.status],
                    ['Opened',   new Date(selectedAcc.createdAt).toLocaleDateString('en-IN')],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'0.45rem 0',borderBottom:'1px solid rgba(99,139,255,0.06)'}}>
                      <span style={{fontSize:'0.82rem',color:'var(--clr-text-muted)'}}>{k}</span>
                      <span style={{fontSize:'0.82rem',fontWeight:600,color:'var(--clr-text)'}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Limits */}
            <div className="card">
              <div className="card-header"><div className="card-title">Daily & Monthly Limits</div></div>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {[
                  {label:'Daily Deposit Limit',    limit:depositLimit,  used:todayCredit},
                  {label:'Daily Withdrawal Limit', limit:withdrawLimit, used:todayDebit},
                  {label:'Monthly Activity',       limit:monthlyLimit,  used:creditThisMonth+debitThisMonth},
                ].map(({label,limit,used})=>{
                  const pct = Math.min(100, Math.round(used/limit*100));
                  return (
                    <div key={label}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',marginBottom:'0.35rem',color:'var(--clr-text-muted)'}}>
                        <span>{label}</span>
                        <span style={{fontWeight:600,color:'var(--clr-text)'}}>{inr(used)} / {inrShort(limit)}</span>
                      </div>
                      <div style={{height:7,background:'rgba(255,255,255,0.06)',borderRadius:99,overflow:'hidden'}}>
                        <div style={{width:`${pct}%`,height:'100%',
                          background:pct>80?'var(--clr-danger)':'linear-gradient(90deg,var(--clr-primary),var(--clr-accent))',
                          borderRadius:99,transition:'width 0.4s ease'}}/>
                      </div>
                      <div style={{fontSize:'0.7rem',color:'var(--clr-text-dim)',marginTop:'0.2rem'}}>{pct}% used</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="card">
                <div className="card-header"><div className="card-title">Recent Activity</div></div>
                {recentActivity.map(t=>(
                  <div key={t._id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.55rem 0',borderBottom:'1px solid rgba(99,139,255,0.06)'}}>
                    <div style={{width:32,height:32,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                      background:t.type==='credit'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)',
                      color:t.type==='credit'?'var(--clr-success)':'var(--clr-danger)'}}>
                      {t.type==='credit'?<ArrowDownCircle size={15}/>:<ArrowUpCircle size={15}/>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--clr-text)'}}>{t.desc}</div>
                      <div style={{fontSize:'0.72rem',color:'var(--clr-text-dim)'}}>{getAccName(t.account)} · {new Date(t.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div style={{fontWeight:700,fontSize:'0.88rem',color:t.type==='credit'?'var(--clr-success)':'var(--clr-danger)'}}>
                      {t.type==='credit'?'+':'-'}{inr(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .tab-bar{display:flex;gap:0.5rem;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);padding:4px}
        .tab-btn{flex:1;padding:0.6rem;border:none;border-radius:calc(var(--radius-sm) - 2px);background:transparent;color:var(--clr-text-muted);font-size:0.88rem;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.4rem;transition:var(--transition)}
        .tab-btn.active{background:var(--clr-bg-2);color:var(--clr-primary-light);border:1px solid var(--clr-border)}
      `}</style>
    </div>
  );
}
