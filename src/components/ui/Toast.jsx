import './Toast.css';

export default function Toast({ msg, type }) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icons[type] || icons.info}</span>
      <span>{msg}</span>
    </div>
  );
}
