import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import Sidebar from './Sidebar.jsx';
import Toast from '../ui/Toast.jsx';
import './Layout.css';

export default function Layout() {
  const { toast } = useApp();
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="content-inner">
          <Outlet />
        </div>
      </main>
      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} />}
    </div>
  );
}
