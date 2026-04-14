import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Smartphone, QrCode, Search, CheckCircle, Send,
  ArrowLeftRight, Shield, X, User, AlertCircle, Copy, Share2, Loader
} from 'lucide-react';
import { inr } from '../utils/currency.js';

/* ── QR data format: nexabank:PHONE:NAME  ── */
const encodeQR  = (phone, name) => `nexabank:${phone}:${encodeURIComponent(name)}`;
const decodeQR  = (raw) => {
  if (!raw.startsWith('nexabank:')) return null;
  const [, phone, name] = raw.split(':');
  return { phone, name: decodeURIComponent(name || '') };
};

/* ── Steps for Send flow ── */
const STEP = { INPUT: 0, CONFIRM: 1, AMOUNT: 2, SUCCESS: 3 };

export default function SendMoney() {
  const { user, accounts, refreshAll } = useApp();
  const [tab, setTab] = useState('mobile');   // 'mobile' | 'qr' | 'myqr'

  /* ── Form state ── */
  const [phone, setPhone]         = useState('');
  const [step, setStep]           = useState(STEP.INPUT);
  const [recipient, setRecipient] = useState(null);
  const [fromId, setFromId]       = useState('');
  const [amount, setAmount]       = useState('');
  const [note, setNote]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fromAcc = accounts.find(a => a._id === (fromId || accounts[0]?._id));
  const effectiveFromId = fromId || accounts[0]?._id || '';

  /* ── QR Scanner ── */
  const qrRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (tab === 'qr') {
      // Small delay to let DOM render
      const t = setTimeout(() => {
        if (!qrRef.current) return;
        const scanner = new Html5QrcodeScanner('qr-reader', {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          rememberLastUsedCamera: true,
        }, false);
        scanner.render(
          (decodedText) => {
            const parsed = decodeQR(decodedText);
            if (parsed?.phone) {
              scanner.clear();
              setPhone(parsed.phone);
              setTab('mobile');
              handleLookup(parsed.phone);
            } else {
              setError('Invalid NexaBank QR code. Please scan a valid NexaBank QR.');
            }
          },
          (err) => { /* silent scan errors */ }
        );
        scannerRef.current = scanner;
      }, 200);
      return () => {
        clearTimeout(t);
        scannerRef.current?.clear().catch(() => {});
      };
    }
  }, [tab]);

  /* ── Lookup by phone ── */
  const handleLookup = async (overridePhone) => {
    let p = (overridePhone || phone).replace(/\D/g, '');
    // If user entered country code (e.g. 919876543210), take only the last 10 digits
    if (p.length > 10) p = p.slice(-10);
    
    if (p.length < 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setError(''); setLoading(true);
    try {
      const data = await api.lookupUser(p);
      setRecipient(data.recipient);
      setStep(STEP.CONFIRM);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Send money ── */
  const handleSend = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return; }
    if (!fromAcc || fromAcc.balance < amt) {
      setError(`Insufficient balance. Available: ${inr(fromAcc?.balance || 0)}`); return;
    }
    setError(''); setLoading(true);
    try {
      const res = await api.sendMoney({
        fromId: effectiveFromId,
        recipientAccountId: recipient.accountId,
        amount: amt,
        note,
        recipientName: recipient.name,
      });
      setSuccessMsg(res.message);
      setStep(STEP.SUCCESS);
      await refreshAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(STEP.INPUT); setPhone(''); setRecipient(null);
    setAmount(''); setNote(''); setError(''); setSuccessMsg('');
  };

  /* ── Avatars ── */
  const Avatar = ({ initials, size = 48, color = '#3b7fff' }) => (
    <div style={{width:size,height:size,borderRadius:'50%',background:`${color}20`,border:`2px solid ${color}40`,
      display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:size*0.34,
      color,flexShrink:0}}>
      {initials}
    </div>
  );

  /* ── My QR code panel ── */
  const myQRValue = encodeQR(user?.phone || '', user?.name || '');
  const copyQR = () => navigator.clipboard?.writeText(myQRValue);

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1 className="page-title">Send Money</h1>
        <p className="page-subtitle">Transfer to any NexaBank user by mobile number or QR code</p>
      </div>

      {accounts.length === 0 ? (
        <div className="card" style={{textAlign:'center',padding:'3rem'}}>
          <Send size={56} style={{opacity:0.2,marginBottom:'1rem'}}/>
          <h3 style={{marginBottom:'0.5rem'}}>No Accounts Found</h3>
          <p style={{marginBottom:'1.5rem',color:'var(--clr-text-muted)'}}>Open a bank account first to send money.</p>
          <a href="/accounts" className="btn btn-primary">Open Account</a>
        </div>
      ) : (
        <div className="grid grid-2" style={{alignItems:'start'}}>

          {/* LEFT: Send Panel */}
          <div className="card">
            {/* Tabs */}
            <div style={{display:'flex',gap:'0.4rem',background:'rgba(255,255,255,0.03)',
              borderRadius:'var(--radius-sm)',padding:4,marginBottom:'1.5rem'}}>
              {[
                {key:'mobile', icon:<Smartphone size={15}/>, label:'Mobile Number'},
                {key:'qr',     icon:<QrCode size={15}/>,     label:'Scan QR'},
                {key:'myqr',   icon:<Share2 size={15}/>,     label:'My QR Code'},
              ].map(t => (
                <button key={t.key}
                  style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'0.35rem',
                    padding:'0.55rem 0.5rem',border:`1px solid ${tab===t.key?'var(--clr-primary)':'transparent'}`,
                    borderRadius:'calc(var(--radius-sm) - 2px)',fontSize:'0.8rem',fontWeight:500,
                    background:tab===t.key?'var(--clr-bg-2)':'transparent',
                    color:tab===t.key?'var(--clr-primary-light)':'var(--clr-text-muted)',
                    cursor:'pointer',transition:'var(--transition)'}}
                  onClick={() => { setTab(t.key); setError(''); }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* ── My QR Code tab ── */}
            {tab === 'myqr' && (
              <div style={{textAlign:'center'}}>
                <p style={{color:'var(--clr-text-muted)',fontSize:'0.85rem',marginBottom:'1.25rem'}}>
                  Share your QR code with others to receive money instantly.
                </p>
                <div style={{display:'inline-block',padding:'1.25rem',background:'#fff',borderRadius:'var(--radius-md)',marginBottom:'1rem'}}>
                  <QRCodeSVG value={myQRValue} size={200} level="H"
                    imageSettings={{src:'', height:0, width:0, excavate:false}}/>
                </div>
                <div style={{marginBottom:'0.75rem'}}>
                  <div style={{fontWeight:700,fontSize:'1rem',color:'var(--clr-text)'}}>{user?.name}</div>
                  <div style={{color:'var(--clr-text-muted)',fontSize:'0.85rem'}}>{user?.phone}</div>
                </div>
                <div style={{display:'flex',gap:'0.5rem',justifyContent:'center',flexWrap:'wrap'}}>
                  <button className="btn btn-ghost btn-sm" onClick={copyQR}><Copy size={14}/> Copy Code</button>
                  <button className="btn btn-primary btn-sm"><Share2 size={14}/> Share</button>
                </div>
                <div style={{marginTop:'1.25rem',padding:'0.75rem',background:'rgba(59,127,255,0.06)',
                  border:'1px solid rgba(59,127,255,0.15)',borderRadius:'var(--radius-sm)',fontSize:'0.8rem',
                  color:'var(--clr-text-muted)',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <Shield size={14} style={{color:'var(--clr-primary-light)',flexShrink:0}}/>
                  Ask the sender to scan this QR code in their NexaBank app.
                </div>
              </div>
            )}

            {/* ── QR Scanner tab ── */}
            {tab === 'qr' && (
              <div>
                <p style={{color:'var(--clr-text-muted)',fontSize:'0.85rem',marginBottom:'1rem',textAlign:'center'}}>
                  Point your camera at the recipient's NexaBank QR code.
                </p>
                {error && (
                  <div className="alert alert-danger" style={{marginBottom:'1rem',display:'flex',gap:'0.5rem',alignItems:'center'}}>
                    <AlertCircle size={15}/> {error}
                  </div>
                )}
                <div id="qr-reader" ref={qrRef}
                  style={{borderRadius:'var(--radius-md)',overflow:'hidden'}}/>
                <p style={{textAlign:'center',fontSize:'0.78rem',color:'var(--clr-text-dim)',marginTop:'0.75rem'}}>
                  Or switch to "Mobile Number" to enter it manually
                </p>
              </div>
            )}

            {/* ── Mobile Number flow ── */}
            {tab === 'mobile' && (
              <>
                {error && (
                  <div className="alert alert-danger" style={{marginBottom:'1rem',display:'flex',gap:'0.5rem',alignItems:'center'}}>
                    <AlertCircle size={15}/> {error}
                    <button style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'inherit'}}
                      onClick={() => setError('')}><X size={14}/></button>
                  </div>
                )}

                {/* Step 0 — Enter mobile */}
                {step === STEP.INPUT && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Recipient's Mobile Number</label>
                      <div style={{display:'flex',gap:'0.5rem'}}>
                        <div style={{position:'relative',flex:1}}>
                          <Smartphone size={15} style={{position:'absolute',left:'0.75rem',top:'50%',transform:'translateY(-50%)',color:'var(--clr-text-dim)'}}/>
                          <input className="form-input" style={{paddingLeft:'2.25rem',fontSize:'1.05rem',letterSpacing:'0.05em'}}
                            type="tel" maxLength={15} placeholder="e.g. 9876543210"
                            value={phone} onChange={e => setPhone(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLookup()}/>
                        </div>
                        <button className="btn btn-primary" onClick={() => handleLookup()} disabled={loading || phone.length < 10}>
                          {loading ? <Loader size={16} style={{animation:'spin 0.7s linear infinite'}}/> : <Search size={16}/>}
                        </button>
                      </div>
                      <div style={{fontSize:'0.75rem',color:'var(--clr-text-dim)',marginTop:'0.35rem'}}>
                        Enter the mobile number registered with NexaBank
                      </div>
                    </div>
                    <div style={{padding:'1rem',background:'rgba(59,127,255,0.04)',border:'1px dashed rgba(59,127,255,0.2)',
                      borderRadius:'var(--radius-md)',textAlign:'center',color:'var(--clr-text-dim)',fontSize:'0.82rem'}}>
                      <QrCode size={20} style={{marginBottom:'0.4rem',opacity:0.4}}/><br/>
                      You can also <button style={{background:'none',border:'none',cursor:'pointer',
                        color:'var(--clr-primary-light)',fontWeight:600,fontSize:'0.82rem'}}
                        onClick={() => setTab('qr')}>scan the recipient's QR code</button>
                    </div>
                  </div>
                )}

                {/* Step 1 — Confirm recipient */}
                {step === STEP.CONFIRM && recipient && (
                  <div className="animate-fade-up">
                    <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
                      <div style={{marginBottom:'0.75rem',display:'flex',justifyContent:'center'}}>
                        <Avatar initials={recipient.avatar || recipient.name?.slice(0,2).toUpperCase()} size={64} color="#3b7fff"/>
                      </div>
                      <div style={{fontSize:'1.2rem',fontWeight:700,color:'var(--clr-text)'}}>{recipient.name}</div>
                      <div style={{fontSize:'0.85rem',color:'var(--clr-text-muted)',marginBottom:'0.5rem'}}>{recipient.phone}</div>
                      <span className="badge badge-success" style={{fontSize:'0.72rem'}}>
                        <CheckCircle size={11}/> {recipient.kycStatus} NexaBank User
                      </span>
                      <div style={{marginTop:'0.75rem',fontSize:'0.8rem',color:'var(--clr-text-dim)'}}>
                        Account: {recipient.accountType} · {recipient.accountNum}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'0.75rem'}}>
                      <button className="btn btn-ghost btn-full" onClick={reset}>Cancel</button>
                      <button className="btn btn-primary btn-full" onClick={() => { setError(''); setStep(STEP.AMOUNT); }}>
                        Continue →
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2 — Enter amount */}
                {step === STEP.AMOUNT && recipient && (
                  <div className="animate-fade-up">
                    {/* Recipient banner */}
                    <div style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem',
                      background:'rgba(59,127,255,0.06)',border:'1px solid rgba(59,127,255,0.15)',
                      borderRadius:'var(--radius-md)',marginBottom:'1.25rem'}}>
                      <Avatar initials={recipient.avatar || recipient.name?.slice(0,2).toUpperCase()} size={38}/>
                      <div>
                        <div style={{fontWeight:600,color:'var(--clr-text)',fontSize:'0.9rem'}}>{recipient.name}</div>
                        <div style={{fontSize:'0.75rem',color:'var(--clr-text-muted)'}}>{recipient.phone} · {recipient.accountType}</div>
                      </div>
                      <button style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',
                        color:'var(--clr-text-dim)'}} onClick={reset}><X size={16}/></button>
                    </div>

                    <div className="form-group">
                      <label className="form-label">From Account</label>
                      <select className="form-select" value={effectiveFromId} onChange={e => setFromId(e.target.value)}>
                        {accounts.map(a => (
                          <option key={a._id} value={a._id}>{a.type} — {a.number} ({inr(a.balance)})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Amount (₹)</label>
                      <div style={{position:'relative'}}>
                        <span style={{position:'absolute',left:'1rem',top:'50%',transform:'translateY(-50%)',
                          fontSize:'1.3rem',fontWeight:700,color:'var(--clr-text-dim)'}}>₹</span>
                        <input className="form-input" style={{paddingLeft:'2.2rem',fontSize:'1.6rem',fontWeight:800,
                          letterSpacing:'-0.02em',height:64}}
                          type="number" min="1" step="1" value={amount}
                          onChange={e => { setAmount(e.target.value); setError(''); }}
                          placeholder="0" autoFocus/>
                      </div>
                      {fromAcc && (
                        <div style={{fontSize:'0.75rem',color:'var(--clr-text-dim)',marginTop:4}}>
                          Available: <strong style={{color:'var(--clr-text)'}}>{inr(fromAcc.balance)}</strong>
                        </div>
                      )}
                      {/* Quick amount chips */}
                      <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginTop:'0.6rem'}}>
                        {[500,1000,2000,5000,10000].map(q => (
                          <button key={q}
                            style={{padding:'0.25rem 0.7rem',fontSize:'0.78rem',border:'1px solid var(--clr-border)',
                              borderRadius:99,background:parseFloat(amount)===q?'rgba(59,127,255,0.15)':'transparent',
                              color:parseFloat(amount)===q?'var(--clr-primary-light)':'var(--clr-text-muted)',cursor:'pointer',transition:'var(--transition)'}}
                            onClick={() => setAmount(String(q))}>
                            ₹{q.toLocaleString('en-IN')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Note / Reason (Optional)</label>
                      <input className="form-input" value={note} onChange={e => setNote(e.target.value)}
                        placeholder="e.g., Rent, Split bill, Gift…"/>
                    </div>

                    {parseFloat(amount) > (fromAcc?.balance||0) && (
                      <div className="alert alert-danger" style={{marginBottom:'1rem',display:'flex',gap:'0.5rem',alignItems:'center'}}>
                        <AlertCircle size={15}/> Insufficient balance. Available: {inr(fromAcc?.balance||0)}
                      </div>
                    )}

                    <div style={{display:'flex',gap:'0.75rem'}}>
                      <button className="btn btn-ghost btn-full" onClick={() => setStep(STEP.CONFIRM)}>Back</button>
                      <button className="btn btn-primary btn-full btn-lg" onClick={handleSend}
                        disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > (fromAcc?.balance||0)}>
                        {loading
                          ? <><div className="spinner"/> Processing…</>
                          : <><Send size={16}/> Send {amount ? inr(parseFloat(amount)) : 'Money'}</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3 — Success */}
                {step === STEP.SUCCESS && (
                  <div className="animate-fade-up" style={{textAlign:'center',padding:'1rem 0'}}>
                    <div style={{width:72,height:72,borderRadius:'50%',background:'rgba(34,197,94,0.15)',
                      border:'2px solid rgba(34,197,94,0.4)',display:'flex',alignItems:'center',
                      justifyContent:'center',margin:'0 auto 1.25rem',
                      animation:'pulse 1.5s ease-in-out'}}>
                      <CheckCircle size={36} style={{color:'var(--clr-success)'}}/>
                    </div>
                    <h3 style={{fontWeight:700,color:'var(--clr-text)',marginBottom:'0.5rem'}}>Transfer Successful!</h3>
                    <p style={{color:'var(--clr-success)',fontWeight:600,fontSize:'1rem',marginBottom:'0.25rem'}}>{successMsg}</p>
                    <p style={{color:'var(--clr-text-muted)',fontSize:'0.85rem',marginBottom:'1.5rem'}}>
                      Sent to <strong>{recipient?.name}</strong> · {new Date().toLocaleString('en-IN')}
                    </p>
                    <div style={{padding:'0.85rem',background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',
                      borderRadius:'var(--radius-md)',marginBottom:'1.5rem'}}>
                      <div style={{fontSize:'0.78rem',color:'var(--clr-text-muted)'}}>Updated Balance</div>
                      <div style={{fontSize:'1.4rem',fontWeight:800,color:'var(--clr-text)'}}>
                        {inr(accounts.find(a=>a._id===effectiveFromId)?.balance||0)}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'0.75rem',justifyContent:'center'}}>
                      <button className="btn btn-ghost btn-sm" onClick={reset}><Send size={14}/> Send Again</button>
                      <a href="/transactions" className="btn btn-primary btn-sm">View Transactions</a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT: Info + own QR mini */}
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {/* How It Works */}
            <div className="card">
              <div className="card-header"><div className="card-title">How to Send Money</div></div>
              {[
                { step:'1', icon:<Smartphone size={18}/>, title:'Enter Mobile Number', desc:'Type the recipient\'s 10-digit mobile number registered with NexaBank.' },
                { step:'2', icon:<User size={18}/>,       title:'Confirm Recipient',   desc:'Verify the name before proceeding — no mistakes, ever.' },
                { step:'3', icon:<Send size={18}/>,       title:'Enter Amount',        desc:'Type or pick a quick amount and add an optional note.' },
              ].map(item => (
                <div key={item.step} style={{display:'flex',gap:'0.85rem',marginBottom:'1rem'}}>
                  <div style={{width:36,height:36,borderRadius:8,background:'rgba(59,127,255,0.1)',
                    color:'var(--clr-primary-light)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{fontWeight:600,color:'var(--clr-text)',fontSize:'0.88rem',marginBottom:'0.2rem'}}>{item.title}</div>
                    <div style={{fontSize:'0.8rem',color:'var(--clr-text-muted)'}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* My QR mini card */}
            <div className="card" style={{textAlign:'center'}}>
              <div className="card-header"><div className="card-title">My Receive QR</div></div>
              <div style={{display:'inline-block',padding:'0.85rem',background:'#fff',borderRadius:'var(--radius-md)',marginBottom:'0.75rem'}}>
                <QRCodeSVG value={myQRValue} size={130} level="H"/>
              </div>
              <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--clr-text)'}}>{user?.name}</div>
              <div style={{fontSize:'0.75rem',color:'var(--clr-text-muted)',marginBottom:'0.75rem'}}>{user?.phone}</div>
              <button className="btn btn-ghost btn-sm btn-full" onClick={() => setTab('myqr')}>
                <QrCode size={14}/> View Full QR
              </button>
            </div>

            {/* Security note */}
            <div style={{padding:'1rem',background:'rgba(59,127,255,0.05)',border:'1px solid rgba(59,127,255,0.15)',
              borderRadius:'var(--radius-md)',display:'flex',gap:'0.75rem',alignItems:'flex-start'}}>
              <Shield size={18} style={{color:'var(--clr-primary-light)',flexShrink:0,marginTop:2}}/>
              <div style={{fontSize:'0.8rem',color:'var(--clr-text-muted)'}}>
                <strong style={{color:'var(--clr-text)'}}>100% Secure</strong><br/>
                Every transfer is encrypted and verified. NexaBank will never ask for your password or OTP.
              </div>
            </div>

            {/* Own Accounts transfer link */}
            <div style={{padding:'0.85rem 1rem',background:'rgba(0,212,180,0.06)',border:'1px solid rgba(0,212,180,0.2)',
              borderRadius:'var(--radius-md)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:'0.85rem',fontWeight:600,color:'var(--clr-text)'}}>Transfer Between Own Accounts</div>
                <div style={{fontSize:'0.75rem',color:'var(--clr-text-muted)'}}>Move money between your NexaBank accounts</div>
              </div>
              <a href="/transfer" className="btn btn-ghost btn-sm"><ArrowLeftRight size={14}/></a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        #qr-reader { width:100% !important; }
        #qr-reader video { border-radius: var(--radius-md) !important; }
        #qr-reader__scan_region { border-radius: var(--radius-md) !important; }
        #qr-reader__dashboard_section_swaplink { color: var(--clr-primary-light) !important; }
      `}</style>
    </div>
  );
}
