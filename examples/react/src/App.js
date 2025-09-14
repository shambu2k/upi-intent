import React, { useState, useEffect } from 'react';
import QrCreator from 'qr-creator';
import './App.css';

// Import UPI library (when using npm package)
// import { createPaymentUri, createMandateUri, buildAppLink, detectPlatform, generateQRCode } from 'upi-intents';

// Mock UPI library for demo purposes
const UpiIntents = {
  createPaymentUri: (pa, pn, am, tn) => {
    const params = new URLSearchParams();
    params.set('pa', pa);
    params.set('pn', pn);
    if (am) {
      params.set('am', am);
      params.set('cu', 'INR');
    }
    if (tn) params.set('tn', tn);
    return `upi://pay?${params.toString()}`;
  },
  
  createMandateUri: (pa, pn, am, tn, tr) => {
    const params = new URLSearchParams();
    params.set('pa', pa);
    params.set('pn', pn);
    if (am) {
      params.set('am', am);
      params.set('cu', 'INR');
    }
    if (tn) params.set('tn', tn);
    if (tr) params.set('tr', tr);
    return `upi://mandate?${params.toString()}`;
  },
  
  buildAppLink: (options) => {
    const { appId, upiUri, platform } = options;
    const apps = {
      gpay: {
        label: 'Google Pay',
        verified: true,
        android: 'intent://pay?' + new URL(upiUri).search.slice(1) + '#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end',
        ios: 'gpay://upi/pay?' + new URL(upiUri).search.slice(1),
        fallback: platform === 'android' 
          ? 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user'
          : 'https://apps.apple.com/in/app/google-pay-save-pay-manage/id1193357041'
      },
      phonepe: {
        label: 'PhonePe',
        verified: false,
        android: 'intent://pay?' + new URL(upiUri).search.slice(1) + '#Intent;scheme=upi;package=com.phonepe.app;end',
        ios: 'phonepe://pay?' + new URL(upiUri).search.slice(1),
        fallback: platform === 'android' 
          ? 'https://play.google.com/store/apps/details?id=com.phonepe.app'
          : 'https://apps.apple.com/in/app/phonepe-upi-payments-recharge/id1170055821'
      },
      paytm: {
        label: 'Paytm',
        verified: false,
        android: 'intent://pay?' + new URL(upiUri).search.slice(1) + '#Intent;scheme=upi;package=net.one97.paytm;end',
        ios: 'paytmmp://pay?' + new URL(upiUri).search.slice(1),
        fallback: platform === 'android' 
          ? 'https://play.google.com/store/apps/details?id=net.one97.paytm'
          : 'https://apps.apple.com/in/app/paytm-secure-upi-payments/id473941634'
      },
      generic: {
        label: 'Any UPI App',
        verified: true,
        android: upiUri,
        ios: upiUri,
        fallback: null
      }
    };
    
    const app = apps[appId];
    if (!app) throw new Error(`Unknown app: ${appId}`);
    
    return {
      url: platform === 'android' ? app.android : app.ios,
      fallbackUrl: app.fallback,
      app: { id: appId, label: app.label, verified: app.verified },
      platform,
      action: upiUri.includes('mandate') ? 'mandate' : 'pay'
    };
  },
  
  detectPlatform: () => {
    const ua = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) ? 'ios' : 'android';
  },
  
  generateQRCode: (upiUri) => {
    // Create QR code using qr-creator library
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    
    QrCreator.render({
      text: upiUri,
      radius: 0.0,
      ecLevel: 'M',
      fill: '#000000',
      background: '#ffffff',
      size: 150
    }, canvas);
    
    // Also create SVG version
    const svgContainer = document.createElement('div');
    QrCreator.render({
      text: upiUri,
      radius: 0.0,
      ecLevel: 'M',
      fill: '#000000',
      background: '#ffffff',
      size: 150
    }, svgContainer);
    
    const svgElement = svgContainer.querySelector('svg');
    const svgString = svgElement ? svgElement.outerHTML : `
      <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
          <rect width="150" height="150" fill="white"/>
          <text x="75" y="75" text-anchor="middle" font-size="12">QR Code</text>
          <text x="75" y="90" text-anchor="middle" font-size="8">Scan with UPI app</text>
      </svg>
    `;
    
    return {
      svg: svgString,
      dataUrl: canvas.toDataURL('image/png'),
      text: upiUri
    };
  }
};

// UPI App Button Component
const UpiAppButton = ({ appId, upiUri, platform, onError }) => {
  const [link, setLink] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const generatedLink = UpiIntents.buildAppLink({ appId, upiUri, platform });
      setLink(generatedLink);
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    }
  }, [appId, upiUri, platform, onError]);

  if (error) {
    return <div className="app-button-error">Error: {error}</div>;
  }

  if (!link) {
    return <div className="app-button-loading">Loading...</div>;
  }

  const handleClick = () => {
    console.log(`Clicked ${appId} on ${platform}`);
    // Analytics tracking would go here
  };

  return (
    <div className="upi-app-button-container">
      <a 
        href={link.url} 
        className="upi-app-button"
        onClick={handleClick}
      >
        <span className="app-icon">
          {link.app.verified ? '✅' : '⚠️'}
        </span>
        <span className="app-label">{link.app.label}</span>
      </a>
      
      {link.fallbackUrl && platform === 'ios' && (
        <a 
          href={link.fallbackUrl} 
          className="upi-app-button fallback"
        >
          <span className="app-icon">📱</span>
          <span className="app-label">Get {link.app.label}</span>
        </a>
      )}
    </div>
  );
};

// QR Code Component
const QRCodeDisplay = ({ upiUri }) => {
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    if (upiUri) {
      const qr = UpiIntents.generateQRCode(upiUri);
      setQrCode(qr);
    }
  }, [upiUri]);

  const downloadQR = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode.dataUrl;
      link.download = 'upi-payment-qr.svg';
      link.click();
    }
  };

  if (!qrCode) return null;

  return (
    <div className="qr-container">
      <h4>QR Code (Desktop/Fallback)</h4>
      <div 
        className="qr-code" 
        dangerouslySetInnerHTML={{ __html: qrCode.svg }}
      />
      <button onClick={downloadQR} className="download-btn">
        Download QR
      </button>
    </div>
  );
};

// Main App Component
function App() {
  const [formData, setFormData] = useState({
    payeeAddress: 'demo@upi',
    payeeName: 'Demo Merchant',
    amount: '99.50',
    note: 'Test payment'
  });
  
  const [upiUri, setUpiUri] = useState(null);
  const [action, setAction] = useState('pay');
  const [platform] = useState(UpiIntents.detectPlatform());
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePaymentLinks = () => {
    try {
      setError(null);
      const { payeeAddress, payeeName, amount, note } = formData;
      
      if (!payeeAddress.trim() || !payeeName.trim()) {
        throw new Error('Payee address and name are required');
      }
      
      const uri = UpiIntents.createPaymentUri(
        payeeAddress.trim(),
        payeeName.trim(),
        amount.trim(),
        note.trim()
      );
      
      setUpiUri(uri);
      setAction('pay');
    } catch (err) {
      setError(err.message);
    }
  };

  const generateMandateLinks = () => {
    try {
      setError(null);
      const { payeeAddress, payeeName, amount, note } = formData;
      
      if (!payeeAddress.trim() || !payeeName.trim()) {
        throw new Error('Payee address and name are required');
      }
      
      const tr = 'MANDATE-' + Date.now();
      const uri = UpiIntents.createMandateUri(
        payeeAddress.trim(),
        payeeName.trim(),
        amount.trim(),
        note.trim(),
        tr
      );
      
      setUpiUri(uri);
      setAction('mandate');
    } catch (err) {
      setError(err.message);
    }
  };

  const clearResults = () => {
    setUpiUri(null);
    setError(null);
  };

  // Auto-generate on component mount for demo
  useEffect(() => {
    generatePaymentLinks();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <h1>🔗 UPI Intents Library Demo</h1>
        <p className="subtitle">React Integration Example</p>
        
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="payeeAddress">Payee Address (VPA):</label>
            <input
              type="text"
              id="payeeAddress"
              name="payeeAddress"
              value={formData.payeeAddress}
              onChange={handleInputChange}
              placeholder="merchant@paytm"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="payeeName">Payee Name:</label>
            <input
              type="text"
              id="payeeName"
              name="payeeName"
              value={formData.payeeName}
              onChange={handleInputChange}
              placeholder="Merchant Name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount (INR):</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="100.00"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="note">Transaction Note:</label>
            <input
              type="text"
              id="note"
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              placeholder="Payment for goods"
            />
          </div>
          
          <div className="button-group">
            <button onClick={generatePaymentLinks} className="primary-btn">
              Generate Payment Links
            </button>
            <button onClick={generateMandateLinks} className="primary-btn">
              Generate Mandate Links
            </button>
            <button onClick={clearResults} className="secondary-btn">
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {upiUri && (
          <div className="results-section">
            <h3>Generated {action.toUpperCase()} Links ({platform.toUpperCase()})</h3>
            
            <div className="uri-display">
              {upiUri}
            </div>
            
            <div className="app-buttons">
              {['gpay', 'phonepe', 'paytm', 'generic'].map(appId => (
                <UpiAppButton
                  key={appId}
                  appId={appId}
                  upiUri={upiUri}
                  platform={platform}
                  onError={setError}
                />
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