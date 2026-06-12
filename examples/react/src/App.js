import React, { useState, useEffect, useCallback } from 'react';
import {
  createPaymentUri,
  createMandateUri,
  buildAppLink,
  detectPlatform,
  generateQRCode,
  generateQRCanvas,
} from './upi-intents.js';
import './App.css';

const POPULAR_APPS = ['gpay', 'phonepe', 'paytm', 'bhim', 'amazonpay', 'cred', 'whatsapp', 'generic'];

const APP_DOMAINS = {
  gpay: 'pay.google.com', phonepe: 'phonepe.com', paytm: 'paytm.com',
  bhim: 'bhimupi.org.in', amazonpay: 'amazon.in', cred: 'cred.club',
  whatsapp: 'whatsapp.com', generic: 'npci.org.in',
};

function UpiAppButton({ appId, upiUri, platform }) {
  const [link, setLink] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      setLink(buildAppLink({ appId, upiUri, platform }));
    } catch (e) {
      setError(e.message);
    }
  }, [appId, upiUri, platform]);

  if (error) return <span className="app-btn app-btn-error">!</span>;
  if (!link) return <span className="app-btn app-btn-loading">...</span>;

  const domain = APP_DOMAINS[appId] || '';
  const favicon = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : '';
  const badge = link.app.verified
    ? <span className="badge badge-ok">VERIFIED</span>
    : <span className="badge badge-cm">COMMUNITY</span>;

  return (
    <a className="app-btn" href={link.url} target="_blank" rel="noopener">
      {favicon && <img src={favicon} alt="" width="20" height="20" onError={e => e.target.remove()} />}
      {link.app.label} {badge}
    </a>
  );
}

function QRCodeDisplay({ upiUri }) {
  const [svg, setSvg] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    if (!upiUri) return;
    try {
      const qr = generateQRCode(upiUri, { size: 150 });
      if (qr.svg && qr.svg.length > 0) {
        setSvg(qr.svg);
      } else {
        const canvas = generateQRCanvas(upiUri, { size: 150 });
        if (canvas) setImgSrc(canvas.toDataURL('image/png'));
      }
    } catch (e) { /* QR unavailable */ }
  }, [upiUri]);

  if (!svg && !imgSrc) return null;

  return (
    <div className="qr-section">
      <strong>QR Code (Desktop fallback)</strong>
      {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : null}
      {imgSrc ? <img src={imgSrc} width="150" height="150" alt="UPI QR" /> : null}
    </div>
  );
}

function App() {
  const [form, setForm] = useState({ pa: 'demo@upi', pn: 'Demo Merchant', am: '99.50', tn: 'Test payment' });
  const [upiUri, setUpiUri] = useState(null);
  const [action, setAction] = useState('pay');
  const [platform] = useState(() => detectPlatform());
  const [error, setError] = useState(null);

  const update = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const generate = useCallback((act) => {
    setError(null);
    const { pa, pn, am, tn } = form;
    if (!pa.trim() || !pn.trim()) { setError('Payee VPA and Name are required.'); return; }
    try {
      const uri = act === 'pay'
        ? createPaymentUri(pa.trim(), pn.trim(), am.trim(), tn.trim())
        : createMandateUri(pa.trim(), pn.trim(), am.trim(), tn.trim(), 'MANDATE-' + Date.now());
      setUpiUri(uri);
      setAction(act);
    } catch (e) { setError(e.message); }
  }, [form]);

  useEffect(() => { generate('pay'); }, []);

  return (
    <div className="App">
      <div className="container">
        <h1>UPI Intents Library Demo</h1>
        <p className="subtitle">React Integration — importing from upi-intents</p>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="pa">Payee VPA</label>
            <input id="pa" name="pa" value={form.pa} onChange={update} placeholder="merchant@paytm" />
          </div>
          <div className="form-group">
            <label htmlFor="pn">Payee Name</label>
            <input id="pn" name="pn" value={form.pn} onChange={update} />
          </div>
          <div className="form-group">
            <label htmlFor="am">Amount (INR)</label>
            <input id="am" name="am" type="number" value={form.am} onChange={update} />
          </div>
          <div className="form-group">
            <label htmlFor="tn">Transaction Note</label>
            <input id="tn" name="tn" value={form.tn} onChange={update} />
          </div>
          <div className="button-group">
            <button onClick={() => generate('pay')}>Generate Payment Links</button>
            <button onClick={() => generate('mandate')}>Generate Mandate Links</button>
            <button className="secondary" onClick={() => setUpiUri(null)}>Clear</button>
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {upiUri && (
          <div className="results-section">
            <p className="uri-display">{upiUri}</p>
            <p className="meta">Platform: {platform.toUpperCase()} &middot; Action: {action.toUpperCase()}</p>
            <div className="app-list">
              {POPULAR_APPS.map(id => (
                <UpiAppButton key={id} appId={id} upiUri={upiUri} platform={platform} />
              ))}
            </div>
            <QRCodeDisplay upiUri={upiUri} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
