import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Search, Filter, Download, TrendingUp, TrendingDown, RefreshCw, FileText } from 'lucide-react';
import { inr } from '../utils/currency.js';
import { generateTransactionPDF } from '../utils/pdfGenerator.js';
import { api } from '../services/api.js';

const CATEGORIES = ['All','Deposit','Withdrawal','Transfer','Income','Interest','Shopping','Utilities','Food','Entertainment','Housing','Health','Technology','Other'];

export default function Transactions() {
  const { accounts, transactions, stats, user, refreshAll } = useApp();
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('All');
  const [type,      setType]      = useState('all');
  const [accFilter, setAccFilter] = useState('all');
  const [page,      setPage]      = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const PER_PAGE = 15;

  const handleDownloadPDF = () => {
    setPdfLoading(true);
    try {
      // Use purely synchronous generation off perfectly-updated Context bounds to avoid browser anti-async blocking (temp files)
      generateTransactionPDF({ 
        user, 
        transactions: filtered, 
        accounts, 
        stats 
      });
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const getAccName = (acc) => {
    if (!acc) return '—';
    if (typeof acc === 'object') return acc.type;
    return accounts.find(a => a._id === acc)?.type || '—';
  };

  const formatted = useMemo(() => transactions.map(t => ({
    ...t,
    dateStr: new Date(t.createdAt).toLocaleDateString('en-IN'),
    accName: getAccName(t.account),
  })), [transactions, accounts]);

  const filtered = useMemo(() => formatted.filter(t => {
    const matchSearch = t.desc.toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === 'All' || t.category === category;
    const matchType   = type === 'all' || t.type === type;
    const matchAcc    = accFilter === 'all' ||
                        (typeof t.account === 'object' ? t.account._id === accFilter : t.account === accFilter);
    return matchSearch && matchCat && matchType && matchAcc;
  }), [formatted, search, category, type, accFilter]);

  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const totalCredit = filtered.filter(t=>t.type==='credit').reduce((s,t)=>s+t.amount,0);
  const totalDebit  = filtered.filter(t=>t.type==='debit').reduce((s,t)=>s+t.amount,0);

  const resetFilters = () => { setSearch(''); setCategory('All'); setType('all'); setAccFilter('all'); setPage(1); };

  return (
    <div className="animate-fade-up">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Transaction History</h1>
          <p className="page-subtitle">{filtered.length} transactions • All amounts in ₹ INR</p>
        </div>
        <div style={{display:'flex',gap:'0.75rem'}}>
          <button className="btn btn-ghost btn-sm" onClick={refreshAll}><RefreshCw size={14}/> Refresh</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleDownloadPDF}
            disabled={pdfLoading || filtered.length === 0}
            style={{display:'flex',alignItems:'center',gap:'0.4rem'}}
          >
            {pdfLoading
              ? <><div className="spinner" style={{width:14,height:14,borderWidth:2}}/> Generating…</>
              : <><FileText size={14}/> Export PDF ({filtered.length})</>}
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-3" style={{marginBottom:'1.5rem'}}>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#3b7fff,#638bff)'}}>
          <div className="stat-icon" style={{background:'rgba(59,127,255,0.15)',color:'var(--clr-primary-light)'}}><Filter size={20}/></div>
          <div className="stat-value">{filtered.length}</div>
          <div className="stat-label">Matching Transactions</div>
        </div>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#22c55e,#16a34a)'}}>
          <div className="stat-icon" style={{background:'rgba(34,197,94,0.15)',color:'var(--clr-success)'}}><TrendingUp size={20}/></div>
          <div className="stat-value" style={{fontSize:'1.3rem'}}>{inr(totalCredit)}</div>
          <div className="stat-label">Total Credits</div>
        </div>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#ef4444,#dc2626)'}}>
          <div className="stat-icon" style={{background:'rgba(239,68,68,0.15)',color:'var(--clr-danger)'}}><TrendingDown size={20}/></div>
          <div className="stat-value" style={{fontSize:'1.3rem'}}>{inr(totalDebit)}</div>
          <div className="stat-label">Total Debits</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{marginBottom:'1rem'}}>
        <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap',alignItems:'center'}}>
          <div style={{flex:1,minWidth:200,position:'relative'}}>
            <Search size={15} style={{position:'absolute',left:'0.75rem',top:'50%',transform:'translateY(-50%)',color:'var(--clr-text-dim)'}}/>
            <input className="form-input" style={{paddingLeft:'2.25rem'}} placeholder="Search transactions…"
              value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          </div>
          <select className="form-select" style={{width:'auto'}} value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}>
            {CATEGORIES.map(c=><option key={c}>{c}</option>)}
          </select>
          <select className="form-select" style={{width:'auto'}} value={type} onChange={e=>{setType(e.target.value);setPage(1);}}>
            <option value="all">All Types</option>
            <option value="credit">Credits</option>
            <option value="debit">Debits</option>
          </select>
          <select className="form-select" style={{width:'auto'}} value={accFilter} onChange={e=>{setAccFilter(e.target.value);setPage(1);}}>
            <option value="all">All Accounts</option>
            {accounts.map(a=><option key={a._id} value={a._id}>{a.type} {a.number}</option>)}
          </select>
          {(search||category!=='All'||type!=='all'||accFilter!=='all') && (
            <button className="btn btn-ghost btn-sm" onClick={resetFilters}>Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {transactions.length === 0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--clr-text-dim)'}}>
            <Filter size={48} style={{opacity:0.2,marginBottom:'1rem'}}/>
            <p style={{marginBottom:'1rem'}}>No transactions yet. Make your first deposit to get started.</p>
            <a href="/deposits" className="btn btn-primary btn-sm">Make First Deposit</a>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th><th>Account</th><th>Category</th>
                    <th>Date & Time</th><th>Type</th><th>Amount (₹)</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--clr-text-dim)'}}>No transactions match your filters</td></tr>
                  ) : paginated.map(t=>(
                    <tr key={t._id}>
                      <td style={{fontWeight:500}}>{t.desc}</td>
                      <td><span className="badge badge-info">{t.accName}</span></td>
                      <td style={{color:'var(--clr-text-muted)',fontSize:'0.85rem'}}>{t.category}</td>
                      <td style={{color:'var(--clr-text-muted)',fontSize:'0.8rem'}}>
                        {t.dateStr}<br/>
                        <span style={{fontSize:'0.72rem'}}>{new Date(t.createdAt).toLocaleTimeString('en-IN')}</span>
                      </td>
                      <td><span className={`badge ${t.type==='credit'?'badge-success':'badge-danger'}`}>{t.type==='credit'?'↑ Credit':'↓ Debit'}</span></td>
                      <td style={{fontWeight:700,fontFamily:'var(--font-display)',color:t.type==='credit'?'var(--clr-success)':'var(--clr-danger)'}}>
                        {t.type==='credit'?'+':'-'}{inr(t.amount)}
                      </td>
                      <td><span className="badge badge-success">{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 0 0',borderTop:'1px solid var(--clr-border)',marginTop:'0.5rem'}}>
                <span style={{fontSize:'0.82rem',color:'var(--clr-text-muted)'}}>
                  Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}
                </span>
                <div style={{display:'flex',gap:'0.4rem'}}>
                  <button className="btn btn-ghost btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
                  {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
                    <button key={p} className={`btn btn-sm ${p===page?'btn-primary':'btn-ghost'}`} onClick={()=>setPage(p)}>{p}</button>
                  ))}
                  <button className="btn btn-ghost btn-sm" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
