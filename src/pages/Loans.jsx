import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Landmark, CheckCircle, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { inr, inrShort } from '../utils/currency.js';

const LOAN_TYPES = [
  { type:'Home Loan',      rate:7.5,  maxTerm:360, icon:'🏠' },
  { type:'Car Loan',       rate:9.2,  maxTerm:84,  icon:'🚗' },
  { type:'Personal Loan',  rate:11.5, maxTerm:60,  icon:'💳' },
  { type:'Education Loan', rate:6.8,  maxTerm:120, icon:'🎓' },
  { type:'Business Loan',  rate:10.5, maxTerm:84,  icon:'💼' },
];

export default function Loans() {
  const { loans, applyLoan, closeLoan } = useApp();
  const [form, setForm] = useState({ type:'Personal Loan', amount:'', term:'24', rate:'11.5' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('apply');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  /* ── Dynamic KPIs from actual loan data ── */
  const activeLoans   = useMemo(() => loans.filter(l => l.status === 'Active'), [loans]);
  const closedLoans   = useMemo(() => loans.filter(l => l.status === 'Closed'), [loans]);
  const totalOutstand = useMemo(() => activeLoans.reduce((s,l) => s + l.outstanding, 0), [activeLoans]);
  const totalEMI      = useMemo(() => activeLoans.reduce((s,l) => s + l.emi, 0), [activeLoans]);
  const totalRepaid   = useMemo(() => loans.reduce((s,l) => s + (l.amount - l.outstanding), 0), [loans]);
  const totalPrincipal = useMemo(() => loans.reduce((s,l) => s + l.amount, 0), [loans]);

  /* ── EMI Calculator ── */
  const P = parseFloat(form.amount) || 0;
  const r = parseFloat(form.rate) / 100 / 12;
  const n = parseInt(form.term) || 1;
  const emi          = P && r ? +(P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1)).toFixed(2) : P ? +(P/n).toFixed(2) : 0;
  const totalPayable  = +(emi * n).toFixed(2);
  const totalInterest = +(totalPayable - P).toFixed(2);
  const principalPct  = totalPayable > 0 ? Math.round(P / totalPayable * 100) : 0;

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.amount || P <= 0) { setError('Enter a valid loan amount'); return; }
    setLoading(true);
    try {
      await applyLoan({ type:form.type, amount:P, term:parseInt(form.term), rate:parseFloat(form.rate) });
      setSuccess(true);
      setForm(p => ({ ...p, amount:'', term:'24' }));
      setTimeout(() => setSuccess(false), 4000);
      setTab('active');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (lt) => {
    set('type', lt.type);
    set('rate', String(lt.rate));
    set('term', String(Math.min(parseInt(form.term)||24, lt.maxTerm)));
  };

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1 className="page-title">Loan Management</h1>
        <p className="page-subtitle">Apply and track your loan portfolio — all values are live</p>
      </div>

      {/* KPI Cards — all computed from real loan data */}
      <div className="grid grid-4" style={{marginBottom:'1.75rem'}}>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#3b7fff,#638bff)'}}>
          <div className="stat-icon" style={{background:'rgba(59,127,255,0.15)',color:'var(--clr-primary-light)'}}><Landmark size={20}/></div>
          <div className="stat-value">{activeLoans.length}</div>
          <div className="stat-label">Active Loans</div>
          <div className="stat-change up"><TrendingUp size={13}/> {closedLoans.length} closed</div>
        </div>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#f59e0b,#d97706)'}}>
          <div className="stat-icon" style={{background:'rgba(245,158,11,0.15)',color:'var(--clr-gold)'}}><DollarSign size={20}/></div>
          <div className="stat-value" style={{fontSize:'1.3rem'}}>{inrShort(totalOutstand)}</div>
          <div className="stat-label">Total Outstanding</div>
          <div className="stat-change down"><TrendingDown size={13}/> of {inrShort(totalPrincipal)} principal</div>
        </div>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#22c55e,#16a34a)'}}>
          <div className="stat-icon" style={{background:'rgba(34,197,94,0.15)',color:'var(--clr-success)'}}><TrendingUp size={20}/></div>
          <div className="stat-value" style={{fontSize:'1.3rem'}}>{inrShort(totalEMI)}</div>
          <div className="stat-label">Monthly EMI Total</div>
          <div className="stat-change up"><CheckCircle size={13}/> {activeLoans.length} EMI{activeLoans.length!==1?'s':''} due</div>
        </div>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#7c3aed,#6d28d9)'}}>
          <div className="stat-icon" style={{background:'rgba(124,58,237,0.15)',color:'#a78bfa'}}><CheckCircle size={20}/></div>
          <div className="stat-value" style={{fontSize:'1.3rem'}}>{inrShort(totalRepaid)}</div>
          <div className="stat-label">Total Repaid</div>
          <div className="stat-change up"><CheckCircle size={13}/> {totalPrincipal?`${Math.round(totalRepaid/totalPrincipal*100)}% repaid`:'No loans yet'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {[
          {key:'apply',  label:'Apply for Loan'},
          {key:'active', label:`Active Loans (${activeLoans.length})`},
          {key:'all',    label:`All Loans (${loans.length})`},
        ].map(({key,label})=>(
          <button key={key}
            style={{padding:'0.55rem 1.25rem',border:`1px solid ${tab===key?'var(--clr-primary)':'var(--clr-border)'}`,
              borderRadius:'var(--radius-sm)',background:tab===key?'rgba(59,127,255,0.12)':'transparent',
              color:tab===key?'var(--clr-primary-light)':'var(--clr-text-muted)',fontSize:'0.88rem',fontWeight:500,cursor:'pointer',transition:'var(--transition)'}}
            onClick={()=>setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'apply' && (
        <div className="grid grid-2">
          <div className="card">
            <div className="card-header"><div className="card-title">Loan Application</div></div>
            {success && <div className="alert alert-success"><CheckCircle size={15}/> Application submitted! Redirecting to active loans…</div>}
            {error   && <div className="alert alert-danger">{error}</div>}

            <div style={{marginBottom:'1.25rem'}}>
              <label className="form-label">Loan Type</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'0.5rem'}}>
                {LOAN_TYPES.map(lt=>(
                  <button key={lt.type} type="button"
                    style={{background:form.type===lt.type?'rgba(59,127,255,0.12)':'rgba(255,255,255,0.03)',
                      border:`1.5px solid ${form.type===lt.type?'var(--clr-primary)':'var(--clr-border)'}`,
                      borderRadius:'var(--radius-sm)',padding:'0.7rem 0.4rem',textAlign:'center',cursor:'pointer',transition:'var(--transition)'}}
                    onClick={()=>handleTypeSelect(lt)}>
                    <div style={{fontSize:'1.1rem',marginBottom:'0.25rem'}}>{lt.icon}</div>
                    <div style={{fontSize:'0.67rem',fontWeight:600,color:'var(--clr-text-muted)'}}>{lt.type}</div>
                    <div style={{fontSize:'0.68rem',color:'var(--clr-primary-light)',fontWeight:600}}>{lt.rate}%</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleApply}>
              <div className="form-group">
                <label className="form-label">Loan Amount (₹)</label>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute',left:'1rem',top:'50%',transform:'translateY(-50%)',color:'var(--clr-text-dim)',fontWeight:600}}>₹</span>
                  <input className="form-input" style={{paddingLeft:'2rem',fontSize:'1.1rem',fontWeight:700}}
                    type="number" min="10000" step="1000" value={form.amount}
                    onChange={e=>set('amount',e.target.value)} placeholder="0" required/>
                </div>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Tenure (Months)</label>
                  <input className="form-input" type="number" min="6" max={LOAN_TYPES.find(l=>l.type===form.type)?.maxTerm||360}
                    value={form.term} onChange={e=>set('term',e.target.value)} required/>
                </div>
                <div className="form-group">
                  <label className="form-label">Rate (% p.a.)</label>
                  <input className="form-input" readOnly value={form.rate} style={{opacity:0.65}}/>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading?<><div className="spinner"/>Submitting…</>:<><Landmark size={18}/> Apply Now</>}
              </button>
            </form>
          </div>

          {/* EMI Calculator */}
          <div className="card">
            <div className="card-header"><div className="card-title">Live EMI Calculator</div></div>
            {P > 0 ? (
              <div>
                <div style={{textAlign:'center',margin:'0.75rem 0 1.5rem'}}>
                  <div style={{background:'linear-gradient(135deg,rgba(59,127,255,0.12),rgba(0,212,180,0.06))',
                    border:'1px solid var(--clr-border)',borderRadius:'var(--radius-lg)',padding:'1.5rem'}}>
                    <div style={{fontSize:'0.8rem',color:'var(--clr-text-muted)',marginBottom:'0.4rem'}}>Monthly EMI</div>
                    <div style={{fontFamily:'var(--font-display)',fontSize:'2.2rem',fontWeight:800,
                      background:'linear-gradient(135deg,var(--clr-primary-light),var(--clr-accent))',
                      WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                      {inr(emi)}
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginBottom:'1.25rem'}}>
                  {[
                    ['Principal',     inr(P)],
                    ['Total Interest',inr(totalInterest)],
                    ['Total Payable', inr(totalPayable)],
                    ['Duration',      `${form.term} months (${(n/12).toFixed(1)} yrs)`],
                    ['Rate',          `${form.rate}% p.a.`],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderBottom:'1px solid rgba(99,139,255,0.06)'}}>
                      <span style={{fontSize:'0.82rem',color:'var(--clr-text-muted)'}}>{k}</span>
                      <span style={{fontSize:'0.82rem',fontWeight:700,color:'var(--clr-text)'}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.74rem',color:'var(--clr-text-muted)',marginBottom:'0.35rem'}}>
                  <span>Principal ({principalPct}%)</span>
                  <span>Interest ({100-principalPct}%)</span>
                </div>
                <div style={{height:10,background:'rgba(255,255,255,0.06)',borderRadius:99,overflow:'hidden',display:'flex'}}>
                  <div style={{width:`${principalPct}%`,background:'var(--clr-primary)',borderRadius:'99px 0 0 99px'}}/>
                  <div style={{flex:1,background:'var(--clr-warning)',borderRadius:'0 99px 99px 0'}}/>
                </div>
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'2.5rem 1rem',color:'var(--clr-text-dim)'}}>
                <DollarSign size={48} style={{opacity:0.2,marginBottom:'0.75rem'}}/>
                <p>Enter a loan amount to see EMI breakdown</p>
              </div>
            )}
          </div>
        </div>
      )}

      {(tab==='active'||tab==='all') && (() => {
        const displayLoans = tab==='active' ? activeLoans : loans;
        if (displayLoans.length === 0) return (
          <div className="card" style={{textAlign:'center',padding:'3rem'}}>
            <Landmark size={56} style={{opacity:0.2,marginBottom:'1rem'}}/>
            <h3 style={{marginBottom:'0.5rem'}}>No {tab==='active'?'Active ':''}Loans</h3>
            <p style={{marginBottom:'1.5rem',color:'var(--clr-text-muted)'}}>Apply for your first loan using the Apply tab.</p>
            <button className="btn btn-primary" onClick={()=>setTab('apply')}>Apply for a Loan</button>
          </div>
        );
        return (
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {displayLoans.map(loan => {
              const repaidPct = Math.round((1 - loan.outstanding/loan.amount)*100);
              return (
                <div key={loan._id} style={{background:'var(--clr-surface)',border:'1px solid var(--clr-border)',borderRadius:'var(--radius-lg)',padding:'1.5rem',transition:'var(--transition)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.2rem'}}>
                    <div>
                      <div style={{fontSize:'1.05rem',fontWeight:700,color:'var(--clr-text)'}}>{loan.type}</div>
                      <div style={{fontSize:'0.78rem',color:'var(--clr-text-dim)',marginTop:2}}>
                        ID: {loan._id.slice(-8).toUpperCase()} · Applied: {new Date(loan.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
                      <span className={`badge ${loan.status==='Active'?'badge-success':'badge-warning'}`}>{loan.status}</span>
                      {loan.status==='Active' && (
                        <button className="btn btn-ghost btn-sm" style={{fontSize:'0.75rem'}} onClick={()=>closeLoan(loan._id)}>Close</button>
                      )}
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.85rem',marginBottom:'1rem'}}>
                    {[
                      ['Principal',   inr(loan.amount)],
                      ['Outstanding', loan.outstanding>0?inr(loan.outstanding):'Cleared'],
                      ['Monthly EMI', loan.emi>0?inr(loan.emi):'—'],
                      ['Rate',        `${loan.rate}% p.a.`],
                      ['Tenure',      `${loan.term} months`],
                      ['Next Due',    loan.nextDue?new Date(loan.nextDue).toLocaleDateString('en-IN'):'—'],
                    ].map(([k,v])=>(
                      <div key={k}>
                        <div style={{fontSize:'0.7rem',color:'var(--clr-text-dim)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600,marginBottom:3}}>{k}</div>
                        <div style={{fontSize:'0.92rem',fontWeight:600,color:'var(--clr-text)'}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {loan.status==='Active' && (
                    <>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.76rem',color:'var(--clr-text-muted)',marginBottom:'0.3rem'}}>
                        <span>Repayment Progress</span>
                        <span style={{fontWeight:700,color:repaidPct>50?'var(--clr-success)':'var(--clr-text)'}}>{repaidPct}% Repaid</span>
                      </div>
                      <div style={{height:8,background:'rgba(255,255,255,0.06)',borderRadius:99,overflow:'hidden'}}>
                        <div style={{width:`${repaidPct}%`,height:'100%',background:'linear-gradient(90deg,var(--clr-primary),var(--clr-accent))',borderRadius:99,transition:'width 0.5s ease'}}/>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.71rem',color:'var(--clr-text-dim)',marginTop:4}}>
                        <span>₹0</span><span>{inr(loan.amount-loan.outstanding)} repaid</span><span>{inr(loan.amount)}</span>
                      </div>
                      {loan.nextDue && (
                        <div style={{marginTop:'0.75rem',padding:'0.6rem 0.85rem',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.82rem'}}>
                          <AlertCircle size={14} style={{color:'var(--clr-gold)',flexShrink:0}}/>
                          <span style={{color:'var(--clr-text-muted)'}}>
                            Next EMI of <strong style={{color:'var(--clr-gold)'}}>{inr(loan.emi)}</strong> due on <strong style={{color:'var(--clr-text)'}}>{new Date(loan.nextDue).toLocaleDateString('en-IN')}</strong>
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
