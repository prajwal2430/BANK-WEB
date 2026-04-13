import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api.js';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  /* ── Auth State ── */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  /* ── Banking State (all populated from backend) ── */
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState(null);

  /* ── UI State ── */
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /* ── Toast helper ── */
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── Restore session on mount ── */
  useEffect(() => {
    const token = localStorage.getItem('nexa_token');
    if (!token) { setAuthLoading(false); return; }
    api.me()
      .then(({ user }) => {
        setUser(user);
        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem('nexa_token');
      })
      .finally(() => setAuthLoading(false));
  }, []);

  /* ── Fetch all data when authenticated ── */
  useEffect(() => {
    if (!isAuthenticated) return;
    refreshAll();
  }, [isAuthenticated]);

  const refreshAll = useCallback(async () => {
    try {
      const [accsRes, txnsRes, loansRes, statsRes] = await Promise.all([
        api.getAccounts(),
        api.getTransactions({ limit: 100 }),
        api.getLoans(),
        api.getStats(),
      ]);
      setAccounts(accsRes.accounts || []);
      setTransactions(txnsRes.transactions || []);
      setLoans(loansRes.loans || []);
      setStats(statsRes || null);
    } catch (err) {
      console.error('Refresh failed:', err.message);
    }
  }, []);

  /* ── Auth Actions ── */
  const login = useCallback(async (email, password) => {
    const { token, user } = await api.login({ email, password });
    localStorage.setItem('nexa_token', token);
    setUser(user);
    setIsAuthenticated(true);
  }, []);

  const registerUser = useCallback(async (data) => {
    const { token, user } = await api.register(data);
    localStorage.setItem('nexa_token', token);
    setUser(user);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nexa_token');
    setIsAuthenticated(false);
    setUser(null);
    setAccounts([]);
    setTransactions([]);
    setLoans([]);
    setStats(null);
  }, []);

  /* ── Account Actions ── */
  const addAccount = useCallback(async (type) => {
    const { account } = await api.createAccount(type);
    setAccounts(prev => [...prev, account]);
    showToast(`${type} account opened successfully!`);
    return account;
  }, [showToast]);

  const deposit = useCallback(async ({ accountId, amount, note }) => {
    const { account, transaction } = await api.deposit({ accountId, amount, note });
    setAccounts(prev => prev.map(a => a._id === accountId ? account : a));
    setTransactions(prev => [transaction, ...prev]);
    await refreshStats();
    showToast(`Deposited ${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(amount)} successfully`);
  }, [showToast]);

  const withdraw = useCallback(async ({ accountId, amount, note }) => {
    const { account, transaction } = await api.withdraw({ accountId, amount, note });
    setAccounts(prev => prev.map(a => a._id === accountId ? account : a));
    setTransactions(prev => [transaction, ...prev]);
    await refreshStats();
    showToast(`Withdrawn ${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(amount)} successfully`);
  }, [showToast]);

  const transfer = useCallback(async ({ fromId, toId, amount, note }) => {
    const { from, to, transactions: txns } = await api.transfer({ fromId, toId, amount, note });
    setAccounts(prev => prev.map(a => {
      if (a._id === fromId) return from;
      if (a._id === toId)   return to;
      return a;
    }));
    setTransactions(prev => [...txns, ...prev]);
    await refreshStats();
    showToast(`Transferred ${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(amount)} successfully`);
  }, [showToast]);

  const applyLoan = useCallback(async (body) => {
    const { loan } = await api.applyLoan(body);
    setLoans(prev => [loan, ...prev]);
    showToast(`Loan application submitted! Loan ID: ${loan._id.slice(-6).toUpperCase()}`);
  }, [showToast]);

  const closeLoan = useCallback(async (id) => {
    const { loan } = await api.closeLoan(id);
    setLoans(prev => prev.map(l => l._id === id ? loan : l));
    showToast('Loan closed successfully');
  }, [showToast]);

  /* ── Refresh stats only ── */
  const refreshStats = useCallback(async () => {
    try {
      const statsRes = await api.getStats();
      setStats(statsRes);
    } catch (err) {
      console.error('Stats refresh failed', err.message);
    }
  }, []);

  return (
    <AppContext.Provider value={{
      isAuthenticated, user, authLoading,
      accounts, transactions, loans, stats,
      loading, toast,
      login, logout, registerUser,
      addAccount, deposit, withdraw, transfer,
      applyLoan, closeLoan,
      refreshAll, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
