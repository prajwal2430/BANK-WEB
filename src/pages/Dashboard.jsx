import { useApp } from '../context/AppContext.jsx';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, CreditCard, ArrowLeftRight,
  Landmark, ClipboardList, ArrowRight, DollarSign, PiggyBank, AlertCircle, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { inr, inrShort } from '../utils/currency.js';
import './Dashboard.css';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CustomTooltip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-val">{inr(payload[0].value)}</div>
    </div>
  ) : null;

/** Build 6-month chart from the backend's monthlyData aggregation */
const buildChartData = (monthlyData = []) => {
  // monthlyData: [{ _id: { year, month, type }, total }]
  const map = {};
  monthlyData.forEach(({ _id, total }) => {
    const key = `${_id.year}-${String(_id.month).padStart(2,'0')}`;
    if (!map[key]) map[key] = { income: 0, expense: 0 };
    if (_id.type === 'credit') map[key].income  += total;
    if (_id.type === 'debit')  map[key].expense += total;
  });
  // Fill last 6 months
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = MONTH_NAMES[d.getMonth()];
    result.push({
      month: label,
      income:  +(map[mk]?.income  || 0).toFixed(2),
      expense: +(map[mk]?.expense || 0).toFixed(2),
      net:     +((map[mk]?.income||0) - (map[mk]?.expense||0)).toFixed(2),
    });
  }
  return result;
};

const EmptyState = ({ icon: Icon, msg, action }) => (
  <div style={{textAlign:'center',padding:'2.5rem 1rem',color:'var(--clr-text-dim)'}}>
    <Icon size={44} style={{opacity:0.25,marginBottom:'0.75rem'}} />
    <p style={{marginBottom:action?'1rem':'0',fontSize:'0.9rem'}}>{msg}</p>
    {action}
  </div>
);

export default function Dashboard() {
  const { user, accounts, transactions, loans, stats, refreshAll } = useApp();

  const totalBalance     = accounts.reduce((s, a) => s + a.balance, 0);
  const activeLoanCount  = loans.filter(l => l.status === 'Active').length;
  const totalOutstanding = loans.filter(l => l.status === 'Active').reduce((s,l)=>s+l.outstanding,0);

  const creditThisMonth = stats?.currentMonth?.credit || 0;
  const debitThisMonth  = stats?.currentMonth?.debit  || 0;
  const creditPrev      = stats?.prevMonth?.credit     || 0;
  const debitPrev       = stats?.prevMonth?.debit      || 0;

  const pct = (cur, prev) => {
    if (!prev) return null;
    const d = +((cur - prev) / prev * 100).toFixed(1);
    return { delta: Math.abs(d), up: d >= 0 };
  };
  const incomeTrend  = pct(creditThisMonth, creditPrev);
  const expenseTrend = pct(debitThisMonth, debitPrev);

  const chartData = buildChartData(stats?.monthlyData || []);
  // Use net balance trend for chart (cumulative net)
  const balanceChart = chartData.map((c, i, arr) => {
    const futureNet = arr.slice(i+1).reduce((s,x)=>s+x.net,0);
    return { month: c.month, balance: Math.max(0, totalBalance - futureNet) };
  });

  const recentTxns = transactions.slice(0, 5);
  const getAccName = (acc) => {
    if (!acc) return '—';
    if (typeof acc === 'object') return acc.type;
    return accounts.find(a => a._id === acc)?.type || '—';
  };

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="page-header dashboard-header">
        <div>
          <h1 className="page-title">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={refreshAll}><RefreshCw size={14}/> Refresh</button>
          <Link to="/transfer" className="btn btn-accent btn-sm"><ArrowLeftRight size={15}/> Transfer</Link>
          <Link to="/deposits" className="btn btn-primary btn-sm"><DollarSign size={15}/> Deposit</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4" style={{marginBottom:'1.75rem'}}>
        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#3b7fff,#638bff)'}}>
          <div className="stat-icon" style={{background:'rgba(59,127,255,0.15)',color:'var(--clr-primary-light)'}}>
            <PiggyBank size={20}/>
          </div>
          <div className="stat-value" style={{fontSize:'1.45rem'}}>{inrShort(totalBalance)}</div>
          <div className="stat-label">Total Portfolio Balance</div>
          <div className="stat-change up">
            <TrendingUp size={13}/> {accounts.length} account{accounts.length!==1?'s':''}
          </div>
        </div>

        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#22c55e,#16a34a)'}}>
          <div className="stat-icon" style={{background:'rgba(34,197,94,0.15)',color:'var(--clr-success)'}}>
            <TrendingUp size={20}/>
          </div>
          <div className="stat-value" style={{fontSize:'1.45rem'}}>{inrShort(creditThisMonth)}</div>
          <div className="stat-label">Credits This Month</div>
          {incomeTrend
            ? <div className={`stat-change ${incomeTrend.up?'up':'down'}`}>
                {incomeTrend.up?<TrendingUp size={13}/>:<TrendingDown size={13}/>}
                {incomeTrend.up?'+':'-'}{incomeTrend.delta}% vs last month
              </div>
            : <div className="stat-change up" style={{color:'var(--clr-text-dim)'}}>No previous data</div>}
        </div>

        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#f97316,#ea580c)'}}>
          <div className="stat-icon" style={{background:'rgba(249,115,22,0.15)',color:'var(--clr-warning)'}}>
            <TrendingDown size={20}/>
          </div>
          <div className="stat-value" style={{fontSize:'1.45rem'}}>{inrShort(debitThisMonth)}</div>
          <div className="stat-label">Debits This Month</div>
          {expenseTrend
            ? <div className={`stat-change ${expenseTrend.up?'down':'up'}`}>
                {expenseTrend.up?<TrendingUp size={13}/>:<TrendingDown size={13}/>}
                {expenseTrend.up?'+':'-'}{expenseTrend.delta}% vs last month
              </div>
            : <div className="stat-change up" style={{color:'var(--clr-text-dim)'}}>No previous data</div>}
        </div>

        <div className="stat-card" style={{'--accent-color':'linear-gradient(90deg,#ef4444,#dc2626)'}}>
          <div className="stat-icon" style={{background:'rgba(239,68,68,0.15)',color:'var(--clr-danger)'}}>
            <Landmark size={20}/>
          </div>
          <div className="stat-value" style={{fontSize:'1.45rem'}}>{inrShort(totalOutstanding)}</div>
          <div className="stat-label">Total Loan Balance</div>
          <div className="stat-change down">
            <AlertCircle size={13}/> {activeLoanCount} active loan{activeLoanCount!==1?'s':''}
          </div>
        </div>
      </div>

      {/* Chart + Accounts */}
      <div className="dashboard-main">
        <div className="card" style={{flex:2}}>
          <div className="card-header">
            <div className="card-title">Balance Trend (6 Months)</div>
            <span className="badge badge-success">Live ₹</span>
          </div>
          {totalBalance === 0 && transactions.length === 0 ? (
            <EmptyState icon={PiggyBank} msg="Make your first deposit to see balance trend" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={balanceChart} margin={{top:5,right:10,bottom:0,left:10}}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b7fff" stopOpacity={0.35}/>
                    <stop offset="100%" stopColor="#3b7fff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,139,255,0.08)" vertical={false}/>
                <XAxis dataKey="month" tick={{fill:'var(--clr-text-dim)',fontSize:12}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'var(--clr-text-dim)',fontSize:12}} axisLine={false} tickLine={false}
                  tickFormatter={v=>inrShort(v)}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="balance" stroke="var(--clr-primary)" strokeWidth={2.5}
                  fill="url(#balGrad)"
                  dot={{fill:'var(--clr-primary)',strokeWidth:2,r:4}} activeDot={{r:6,fill:'var(--clr-accent)'}}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card" style={{flex:1}}>
          <div className="card-header">
            <div className="card-title">My Accounts</div>
            <Link to="/accounts" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {accounts.length === 0 ? (
            <EmptyState icon={CreditCard} msg="No accounts yet"
              action={<Link to="/accounts" className="btn btn-primary btn-sm">Open Account</Link>}/>
          ) : (
            <div className="accounts-mini">
              {accounts.map(acc => (
                <div key={acc._id} className="account-mini-item">
                  <div className="account-mini-icon"><CreditCard size={16}/></div>
                  <div className="account-mini-info">
                    <div className="account-mini-name">{acc.type}</div>
                    <div className="account-mini-num">{acc.number}</div>
                  </div>
                  <div className="account-mini-balance">{inr(acc.balance)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header">
          <div className="card-title">Recent Transactions</div>
          <Link to="/transactions" className="btn btn-ghost btn-sm">View All <ArrowRight size={14}/></Link>
        </div>
        {recentTxns.length === 0 ? (
          <EmptyState icon={ClipboardList} msg="No transactions yet. Deposit or transfer funds to get started."
            action={<Link to="/deposits" className="btn btn-primary btn-sm">Make First Deposit</Link>}/>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th><th>Account</th><th>Category</th>
                  <th>Date</th><th>Amount</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map(t => (
                  <tr key={t._id}>
                    <td style={{fontWeight:500}}>{t.desc}</td>
                    <td><span className="badge badge-info">{getAccName(t.account)}</span></td>
                    <td>{t.category}</td>
                    <td style={{color:'var(--clr-text-muted)'}}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className={`txn-amount ${t.type}`}>
                      {t.type==='credit'?'+':'-'}{inr(t.amount)}
                    </td>
                    <td><span className="badge badge-success">{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions" style={{marginTop:'1.5rem'}}>
        {[
          {to:'/accounts',     Icon:CreditCard,     label:'New Account',    sub:'Open an account'},
          {to:'/deposits',     Icon:DollarSign,     label:'Deposit',        sub:'Add funds'},
          {to:'/transfer',     Icon:ArrowLeftRight, label:'Transfer',       sub:'Move money'},
          {to:'/loans',        Icon:Landmark,       label:'Loan',           sub:'Get financing'},
          {to:'/reports',      Icon:ClipboardList,  label:'Reports',        sub:'View analytics'},
        ].map(({to,Icon,label,sub})=>(
          <Link key={to} to={to} className="quick-action-btn">
            <div className="qa-icon"><Icon size={22}/></div>
            <div className="qa-label">{label}</div>
            <div className="qa-sub">{sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
