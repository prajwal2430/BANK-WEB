import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeftRight, CheckCircle, Shield, Zap, Clock, CreditCard } from 'lucide-react';
import { inr } from '../utils/currency.js';

export default function Transfer() {
  const { accounts, transfer } = useApp();
  const [form, setForm] = useState({ fromId:'', toId:'', amount:'', note:'' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const fromId = form.fromId || accounts[0]?._id || '';
  const toId   = form.toId   || accounts[1]?._id || accounts[0]?._id || '';
  const fromAcc = accounts.find(a => a._id === fromId);
  const toAcc   = accounts.find(a => a._id === toId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0)   { setError('Enter a valid amount'); return; }
    if (fromId === toId)    { setError('Cannot transfer to the same account'); return; }
    if (!fromAcc || !toAcc) { setError('Select valid accounts'); return; }
    setLoading(true);
    try {
      await transfer({ fromId, toId, amount: amt, note: form.note });
      setSuccess(true);
      setForm(p => ({ ...p, amount:'', note:'' }));
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (accounts.length < 2) {
    return (
      <div className="animate-fade-up">
        <div className="page-header"><h1 className="page-title">Fund Transfer</h1></div>
        <div className="card" style={{textAlign:'center',padding:'3rem'}}>
          <CreditCard size={56} style={{opacity:0.2,marginBottom:'1rem'}}/>
          <h3 style={{marginBottom:'0.5rem'}}>Need At Least 2 Accounts</h3>
          <p style={{marginBottom:'1.5rem',color:'var(--clr-text-muted)'}}>Open a second account to transfer funds between them.</p>
          <a href="/accounts" className="btn btn-primary">Open Account</a>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1 className="page-title">Fund Transfer</h1>
        <p className="page-subtitle">Transfer money securely between your accounts — balances update instantly</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">New Transfer</div>
            <span className="badge badge-accent"><Zap size={11}/> Instant</span>
          </div>

          {success && <div className="alert alert-success"><CheckCircle size={15}/> Transfer completed successfully!</div>}
          {error   && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">From Account</label>
              <select className="form-select" value={fromId} onChange={e => set('fromId', e.target.value)}>
                {accounts.map(a => (
                  <option key={a._id} value={a._id}>{a.type} — {a.number} ({inr(a.balance)})</option>
                ))}
              </select>
            </div>

            <div style={{display:'flex',alignItems:'center',justifyContent:'center',color:'var(--clr-primary)',margin:'0.5rem 0'}}>
              <ArrowLeftRight size={20}/>
            </div>

            <div className="form-group">
              <label className="form-label">To Account</label>
              <select className="form-select" value={toId} onChange={e => set('toId', e.target.value)}>
                {accounts.filter(a => a._id !== fromId).map(a => (
                  <option key={a._id} value={a._id}>{a.type} — {a.number} ({inr(a.balance)})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (INR ₹)</label>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:'1rem',top:'50%',transform:'translateY(-50%)',color:'var(--clr-text-dim)',fontSize:'1.1rem',fontWeight:600}}>₹</span>
                <input className="form-input" style={{paddingLeft:'2rem',fontSize:'1.2rem',fontWeight:700}}
                  type="number" min="1" step="1" value={form.amount}
                  onChange={e=>set('amount',e.target.value)} placeholder="0" required/>
              </div>
              {fromAcc && <div style={{fontSize:'0.74rem',color:'var(--clr-text-dim)',marginTop:'0.3rem'}}>
                Available: <strong style={{color:'var(--clr-text)'}}>{inr(fromAcc.balance)}</strong>
              </div>}
            </div>

            <div className="form-group">
              <label className="form-label">Remarks (Optional)</label>
              <input className="form-input" value={form.note} onChange={e=>set('note',e.target.value)} placeholder="Transfer note"/>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><div className="spinner"/>Processing...</> : <><ArrowLeftRight size={18}/> Transfer Funds</>}
            </button>
          </form>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
          {/* Preview */}
          <div className="card">
            <div className="card-header"><div className="card-title">Transfer Preview</div></div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',marginTop:'0.5rem'}}>
              <div style={{flex:1,background:'rgba(59,127,255,0.06)',border:'1px solid var(--clr-border)',borderRadius:'var(--radius-md)',padding:'1rem',textAlign:'center'}}>
                <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',color:'var(--clr-text-dim)',marginBottom:'0.4rem'}}>FROM</div>
                <div style={{fontWeight:600,color:'var(--clr-text)'}}>{fromAcc?.type||'—'}</div>
                <div style={{fontSize:'0.75rem',color:'var(--clr-text-muted)',fontFamily:'monospace'}}>{fromAcc?.number||'—'}</div>
                <div style={{fontWeight:700,color:'var(--clr-accent)',marginTop:'0.3rem'}}>{inr(fromAcc?.balance||0)}</div>
              </div>
              <div style={{textAlign:'center',color:'var(--clr-primary)',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.3rem'}}>
                <ArrowLeftRight size={24}/>
                <div style={{fontSize:'0.85rem',fontWeight:700,color:'var(--clr-text)'}}>
                  {form.amount ? inr(parseFloat(form.amount)) : '—'}
                </div>
              </div>
              <div style={{flex:1,background:'rgba(59,127,255,0.06)',border:'1px solid var(--clr-border)',borderRadius:'var(--radius-md)',padding:'1rem',textAlign:'center'}}>
                <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',color:'var(--clr-text-dim)',marginBottom:'0.4rem'}}>TO</div>
                <div style={{fontWeight:600,color:'var(--clr-text)'}}>{toAcc?.type||'—'}</div>
                <div style={{fontSize:'0.75rem',color:'var(--clr-text-muted)',fontFamily:'monospace'}}>{toAcc?.number||'—'}</div>
                <div style={{fontWeight:700,color:'var(--clr-accent)',marginTop:'0.3rem'}}>{inr(toAcc?.balance||0)}</div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="card">
            <div className="card-header"><div className="card-title">Transfer Benefits</div></div>
            {[
              {icon:Zap,   title:'Instant Processing', desc:'Transfers between accounts are processed immediately.'},
              {icon:Shield,title:'Fully Secured',       desc:'End-to-end encrypted with fraud monitoring.'},
              {icon:Clock, title:'24/7 Available',      desc:'Transfer anytime, no downtime.'},
            ].map(({icon:Icon,title,desc})=>(
              <div key={title} style={{display:'flex',gap:'0.75rem',marginBottom:'1rem'}}>
                <div style={{width:36,height:36,background:'rgba(59,127,255,0.1)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--clr-primary-light)',flexShrink:0}}><Icon size={18}/></div>
                <div>
                  <div style={{fontSize:'0.88rem',fontWeight:600,color:'var(--clr-text)',marginBottom:'0.2rem'}}>{title}</div>
                  <div style={{fontSize:'0.8rem',color:'var(--clr-text-muted)'}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
