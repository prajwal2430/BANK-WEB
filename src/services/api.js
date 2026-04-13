/**
 * API Service Layer — all HTTP calls to the backend
 * Uses a relative /api path so Vite proxy forwards to backend (no CORS ever).
 */
const BASE = '/api';

const getToken = () => localStorage.getItem('nexa_token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const request = async (method, path, body) => {
  // Prevent GET caching to guarantee live data reflection
  const urlPath = method === 'GET'
    ? (path.includes('?') ? `${path}&_t=${Date.now()}` : `${path}?_t=${Date.now()}`)
    : path;

  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const contentType = res.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const textData = await res.text();
    throw new Error(`Expected JSON but received ${contentType}. Status: ${res.status}. Content: ${textData.substring(0, 150)}`);
  }

  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data;
};

export const api = {
  // Auth
  register: (body) => request('POST', '/auth/register', body),
  login: (body) => request('POST', '/auth/login', body),
  me: () => request('GET', '/auth/me'),

  // Accounts
  getAccounts: () => request('GET', '/accounts'),
  createAccount: (type) => request('POST', '/accounts', { type }),
  deposit: (body) => request('POST', '/accounts/deposit', body),
  withdraw: (body) => request('POST', '/accounts/withdraw', body),
  transfer: (body) => request('POST', '/accounts/transfer', body),
  lookupUser: (phone) => request('GET', `/accounts/lookup?phone=${encodeURIComponent(phone)}`),
  sendMoney: (body) => request('POST', '/accounts/send', body),

  // Transactions
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/transactions?${qs}`);
  },
  getStats: () => request('GET', '/transactions/stats'),

  // Loans
  getLoans: () => request('GET', '/loans'),
  applyLoan: (body) => request('POST', '/loans', body),
  closeLoan: (id) => request('PUT', `/loans/${id}/close`),
};
