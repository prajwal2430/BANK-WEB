import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
         AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, Legend } from 'recharts';
import { Download, TrendingUp, TrendingDown, BarChart2, RefreshCw } from 'lucide-react';
import { inr, inrShort } from '../utils/currency.js';
import { generateReportPDF } from '../utils/pdfGenerator.js';
import { api } from '../services/api.js';

const CATEGORY_COLORS = {
  Housing:'#3b7fff', Food:'#00d4b4', Shopping:'#f59e0b', Utilities:'#7c3aed',
  Entertainment:'#ef4444', Health:'#22c55e', Technology:'#f97316',
  Transfer:'#8b5cf6', Withdrawal:'#ec4899', Deposit:'#10b981', Other:'#8496b8',
};
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ChartTip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div style={{background:'var(--clr-bg-3)',border:'1px solid var(--clr-border)',borderRadius:8,padding:'0.6rem 0.9rem',fontSize:'0.82rem'}}>
      <div style={{color:'var(--clr-text-muted)',marginBottom:4}}>{label}</div>
      {payload.map(p=>(
        <div key={p.name} style={{color:p.color,fontWeight:600}}>{p.name}: {inr(p.value)}</div>
      ))}
    </div>
  ) : null;

/** Transform backend monthlyData into chart-friendly array */
const buildMonthly = (monthlyData = []) => {
  const map = {};
  monthlyData.forEach(({ _id, total }) => {
    const key = `${_id.month}-${_id.year}`;
    if (!map[key]) map[key] = { month: MONTH_NAMES[_id.month-1], sort: _id.year*100+_id.month, income:0, expenses:0 };
    if (_id.type === 'credit') map[key].income   += total;
    if (_id.type === 'debit')  map[key].expenses += total;
  });
  return Object.values(map)
    .sort((a,b)=>a.sort-b.sort)
    .map(m => ({ ...m, net: +(m.income - m.expenses).toFixed(2) }));
};

const EmptyChart = ({ msg }) => (
  <div style={{textAlign:'center',padding:'3rem',color:'var(--clr-text-dim)',fontSize:'0.88rem'}}>
    <BarChart2 size={36} style={{opacity:0.2,marginBottom:'0.75rem'}}/><p>{msg}</p>
  </div>
);

export default function Reports() {
  const { accounts, transactions, loans, stats, user, refreshAll } = useApp();
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = () => {
    setPdfLoading(true);
    try {
      // Use purely synchronous Context objects (which auto-refresh under the hood via cache-busting API)
      generateReportPDF({ 
        user, 
        transactions, 
        accounts, 
        loans, 
        stats 
      });
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const totalBalance    = accounts.reduce((s,a)=>s+a.balance,0);
  const creditThisMonth = stats?.currentMonth?.credit || 0;
  const debitThisMonth  = stats?.currentMonth?.debit  || 0;
  const creditPrev      = stats?.prevMonth?.credit     || 0;
  const debitPrev       = stats?.prevMonth?.debit      || 0;
  const netSavings      = creditThisMonth - debitThisMonth;

  const pct = (cur, prev) => {
    if (!prev) return { delta: 0, up: true, noData: true };
    const d = +((cur - prev) / prev * 100).toFixed(1);
    return { delta: Math.abs(d), up: d >= 0 };
  };
  const incomeTrend  = pct(creditThisMonth, creditPrev);
  const expenseTrend = pct(debitThisMonth, debitPrev);

  const monthlyData = buildMonthly(stats?.monthlyData || []);

  const spendCategories = (stats?.spendByCategory || []).map(c => ({
    ...c, color: CATEGORY_COLORS[c.name] || CATEGORY_COLORS.Other,
  }));
  const totalSpend = spendCategories.reduce((s,c)=>s+c.value,0);

  // Balance trend from account totals over monthly history
  const balanceTrend = monthlyData.map((m,i,arr) => {
    const futureNet = arr.slice(i+1).reduce((s,x)=>s+x.net,0);
    return { month: m.month, balance: Math.max(0, totalBalance - futureNet) };
  });

  const noData = transactions.length === 0;

  return (
    <div className="animate-fade-up">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-subtitle">Live analytics — values change as you transact</p>
        </div>
        <div style={{display:'flex',gap:'0.75rem'}}>
          <button className="btn btn-ghost btn-sm" onClick={refreshAll}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleDownloadPDF}
            disabled={pdfLoading || transactions.length === 0}
            style={{display:'flex',alignItems:'center',gap:'0.4rem'}}
          >
            {pdfLoading
              ? <><div className="spinner" style={{width:14,height:14,borderWidth:2}}/> Generating…</>
              : <><Download size={14}/> Download PDF</>}
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-4" style={{marginBottom:'1.75rem'}}>
        {[
          { label:'Total Portfolio',   val:inrShort(totalBalance),       trend:{up:true,noData:true},   note:`${accounts.length} accounts` },
          { label:'Income This Month', val:inrShort(creditThisMonth),    trend:incomeTrend,              note:incomeTrend.noData?'No previous data':`${incomeTrend.up?'+':'-'}${incomeTrend.delta}% vs last month` },
          { label:'Expenses This Month',val:inrShort(debitThisMonth),   trend:{...expenseTrend,up:!expenseTrend?.up}, note:expenseTrend?.noData?'No previous data':`${expenseTrend.up?'+':'-'}${expenseTrend.delta}% vs last month` },
          { label:'Net Savings',        val:(netSavings>=0?'+':'')+inrShort(netSavings), trend:{up:netSavings>=0,noData:false}, note:'Credits minus debits' },
        ].map(({label,val,trend,note},i)=>(
          <div key={label} className="stat-card animate-fade-up" style={{animationDelay:`${i*0.08}s`,
            '--accent-color':trend.up?'linear-gradient(90deg,#3b7fff,#638bff)':'linear-gradient(90deg,#ef4444,#dc2626)'}}>
            <div className="stat-value" style={{fontSize:'1.35rem'}}>{val||'₹0'}</div>
            <div className="stat-label">{label}</div>
            <div className={`stat-change ${trend.up?'up':'down'}`}>
              {trend.up?<TrendingUp size={13}/>:<TrendingDown size={13}/>} {note}
            </div>
          </div>
        ))}
      </div>

      {noData ? (
        <div className="card" style={{textAlign:'center',padding:'4rem 1rem'}}>
          <BarChart2 size={64} style={{opacity:0.15,marginBottom:'1rem'}}/>
          <h3 style={{marginBottom:'0.5rem'}}>No Data Yet</h3>
          <p style={{color:'var(--clr-text-muted)',marginBottom:'1.5rem',maxWidth:400,margin:'0 auto 1.5rem'}}>
            Start transacting — make a deposit, withdrawal, or transfer and come back to see your live financial charts and analytics.
          </p>
          <a href="/deposits" className="btn btn-primary">Make First Deposit</a>
        </div>
      ) : (
        <>
          {/* Income vs Expenses + Spend pie */}
          <div className="grid grid-2" style={{marginBottom:'1.5rem'}}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Income vs Expenses</div>
                <span className="badge badge-info">Monthly</span>
              </div>
              {monthlyData.length < 1 ? <EmptyChart msg="No monthly data yet"/> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} margin={{top:5,right:10,bottom:0,left:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,139,255,0.08)" vertical={false}/>
                    <XAxis dataKey="month" tick={{fill:'var(--clr-text-dim)',fontSize:12}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'var(--clr-text-dim)',fontSize:12}} axisLine={false} tickLine={false} tickFormatter={v=>inrShort(v)}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Legend wrapperStyle={{fontSize:'0.8rem',color:'var(--clr-text-muted)'}}/>
                    <Bar dataKey="income"   name="Income"   fill="var(--clr-success)" radius={[4,4,0,0]}/>
                    <Bar dataKey="expenses" name="Expenses" fill="var(--clr-danger)"  radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Spending by Category</div>
                <span className="badge badge-accent">{new Date().toLocaleString('default',{month:'long',year:'numeric'})}</span>
              </div>
              {spendCategories.length === 0 ? <EmptyChart msg="No expenses recorded this month"/> : (
                <div style={{display:'flex',gap:'1rem',alignItems:'center'}}>
                  <ResponsiveContainer width="55%" height={200}>
                    <PieChart>
                      <Pie data={spendCategories} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {spendCategories.map((e,i)=><Cell key={i} fill={e.color}/>)}
                      </Pie>
                      <Tooltip formatter={v=>[inr(v),'']}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:'0.4rem',overflow:'auto',maxHeight:200}}>
                    {spendCategories.map(c=>(
                      <div key={c.name} style={{display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.78rem'}}>
                        <div style={{width:10,height:10,borderRadius:2,background:c.color,flexShrink:0}}/>
                        <span style={{flex:1,color:'var(--clr-text-muted)'}}>{c.name}</span>
                        <span style={{fontWeight:600,color:'var(--clr-text)'}}>{inr(c.value)}</span>
                        <span style={{color:'var(--clr-text-dim)',fontSize:'0.7rem'}}>
                          {totalSpend?Math.round(c.value/totalSpend*100):0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Balance trend */}
          <div className="card" style={{marginBottom:'1.5rem'}}>
            <div className="card-header">
              <div className="card-title">Portfolio Balance Trend</div>
              <span className="badge badge-success">Live ₹</span>
            </div>
            {balanceTrend.length < 2 ? <EmptyChart msg="More months of transactions needed to show trend"/> : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={balanceTrend} margin={{top:5,right:10,bottom:0,left:10}}>
                  <defs>
                    <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b7fff" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#3b7fff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,139,255,0.08)" vertical={false}/>
                  <XAxis dataKey="month" tick={{fill:'var(--clr-text-dim)',fontSize:12}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:'var(--clr-text-dim)',fontSize:12}} axisLine={false} tickLine={false} tickFormatter={v=>inrShort(v)}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Area type="monotone" dataKey="balance" name="Balance" stroke="#3b7fff" strokeWidth={2.5} fill="url(#bGrad)"
                    dot={{fill:'#3b7fff',r:4}} activeDot={{r:6,fill:'var(--clr-accent)'}}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Net savings line */}
          <div className="card" style={{marginBottom:'1.5rem'}}>
            <div className="card-header">
              <div className="card-title">Net Monthly Savings</div>
              <span className={`badge ${netSavings>=0?'badge-success':'badge-danger'}`}>
                <BarChart2 size={11}/> {netSavings>=0?'Positive':'Negative'}
              </span>
            </div>
            {monthlyData.length < 1 ? <EmptyChart msg="No monthly net data yet"/> : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyData} margin={{top:5,right:10,bottom:0,left:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,139,255,0.08)" vertical={false}/>
                  <XAxis dataKey="month" tick={{fill:'var(--clr-text-dim)',fontSize:12}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:'var(--clr-text-dim)',fontSize:12}} axisLine={false} tickLine={false} tickFormatter={v=>inrShort(v)}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Line type="monotone" dataKey="net" name="Net Savings" stroke="var(--clr-accent)" strokeWidth={3}
                    dot={{fill:'var(--clr-accent)',r:5}} activeDot={{r:7}}/>
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Loan summary */}
          {loans.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Loan Portfolio</div>
                <span className="badge badge-warning">{loans.filter(l=>l.status==='Active').length} Active</span>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Type</th><th>Principal</th><th>Outstanding</th><th>EMI/Month</th><th>Rate</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {loans.map(l=>(
                      <tr key={l._id}>
                        <td style={{fontWeight:600}}>{l.type}</td>
                        <td>{inr(l.amount)}</td>
                        <td style={{fontWeight:600,color:l.outstanding>0?'var(--clr-danger)':'var(--clr-success)'}}>
                          {l.outstanding>0?inr(l.outstanding):'Cleared ✓'}
                        </td>
                        <td>{l.emi>0?inr(l.emi):'—'}</td>
                        <td>{l.rate}%</td>
                        <td><span className={`badge ${l.status==='Active'?'badge-success':'badge-warning'}`}>{l.status}</span></td>
                      </tr>
                    ))}
                    <tr style={{background:'rgba(59,127,255,0.06)'}}>
                      <td style={{fontWeight:700}}>Total</td>
                      <td style={{fontWeight:700}}>{inr(loans.reduce((s,l)=>s+l.amount,0))}</td>
                      <td style={{fontWeight:700,color:'var(--clr-danger)'}}>{inr(loans.reduce((s,l)=>s+l.outstanding,0))}</td>
                      <td style={{fontWeight:700,color:'var(--clr-warning)'}}>{inr(loans.filter(l=>l.status==='Active').reduce((s,l)=>s+l.emi,0))}</td>
                      <td colSpan={2}/>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
