# 🔗 UPI Intents

[![CI](https://github.com/shambu2k/upi-intent/actions/workflows/ci.yml/badge.svg)](https://github.com/shambu2k/upi-intent/actions/workflows/ci.yml)
[![Coverage](https://github.com/shambu2k/upi-intent/actions/workflows/coverage.yml/badge.svg)](https://github.com/shambu2k/upi-intent/actions/workflows/coverage.yml)
[![Bundle Size](https://github.com/shambu2k/upi-intent/actions/workflows/bundle-size.yml/badge.svg)](https://github.com/shambu2k/upi-intent/actions/workflows/bundle-size.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

> Framework-agnostic TypeScript library for UPI deep-linking across Android and iOS platforms with robust fallbacks and NPCI compliance.

## ✨ Features

- 🎯 **Universal UPI Links** - Generate payment and mandate links that work across all UPI apps
- 📱 **Platform Optimized** - Android Intent URLs and iOS scheme URLs with proper fallbacks
- ✅ **NPCI Compliant** - Full compliance with NPCI's UPI deep-linking specification
- 🔧 **Framework Agnostic** - Works with vanilla JS, React, Vue, Angular, and any web framework
- 📊 **QR Code Support** - Generate QR codes for desktop/fallback scenarios
- 🎨 **UI Components** - Ready-to-use button components with official app branding
- 📦 **Tree Shakeable** - ESM modules with TypeScript declarations
- 🧪 **100% Tested** - Comprehensive test suite with 46 passing tests

## 🚀 Quick Start

### Installation

```bash
npm install upi-intents
# or
yarn add upi-intents
# or
bun add upi-intents
```

### Basic Usage

```typescript
import { createPaymentUri, buildAppLink, detectPlatform } from 'upi-intents';

// Create a UPI payment link
const upiUri = createPaymentUri(
  'merchant@paytm',     // Payee VPA
  'Demo Merchant',      // Payee name
  '99.50',              // Amount
  'Payment for goods'   // Transaction note
);

// Generate app-specific links
const platform = detectPlatform(); // 'android' | 'ios'
const gpayLink = buildAppLink({
  appId: 'gpay',
  upiUri,
  platform
});

// Open Google Pay
window.location.href = gpayLink.url;
```

## 📖 API Reference

### Core Functions

#### `createPaymentUri(pa, pn, am?, tn?)`
Creates a standard UPI payment URI.

```typescript
const uri = createPaymentUri(
  'merchant@paytm',     // pa: Payee address (required)
  'Demo Merchant',      // pn: Payee name (required)  
  '100.00',             // am: Amount (optional)
  'Payment note'        // tn: Transaction note (optional)
);
// Returns: "upi://pay?pa=merchant@paytm&pn=Demo%20Merchant&am=100.00&cu=INR&tn=Payment%20note"
```

#### `createMandateUri(pa, pn, am?, tn?, tr?)`
Creates a UPI mandate/subscription URI.

```typescript
const uri = createMandateUri(
  'merchant@paytm',
  'Demo Merchant', 
  '50.00',
  'Monthly subscription',
  'MANDATE-123'
);
```

#### `buildAppLink(options)`
Generates platform-specific deep links for UPI apps.

```typescript
const link = buildAppLink({
  appId: 'gpay',        // 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'amazonpay' | 'generic'
  upiUri: 'upi://pay?...',
  platform: 'android'   // 'android' | 'ios' | auto-detected
});

// Returns:
{
  url: "intent://pay?pa=...",           // Platform-specific URL
  fallbackUrl: "https://play.google...", // App store URL
  app: { id: 'gpay', label: 'Google Pay', verified: true },
  platform: 'android',
  action: 'pay'
}
```

#### `detectPlatform()`
Detects the current platform from user agent.

```typescript
const platform = detectPlatform(); // 'android' | 'ios'
```

### Utility Functions

#### `generateQRCode(upiUri)`
Generates QR codes for desktop fallback.

```typescript
const qr = generateQRCode(upiUri);
console.log(qr.svg);     // SVG string
console.log(qr.dataUrl); // Data URL for downloads
```

#### App Registry
```typescript
import { getAllApps, getApp, getVerifiedApps } from 'upi-intents';

const allApps = getAllApps();           // All registered UPI apps
const gpay = getApp('gpay');            // Specific app details
const verified = getVerifiedApps();     // Only verified apps
```

## 🏗️ Framework Integration

### React Component

```jsx
import React from 'react';
import { createPaymentUri, buildAppLink, detectPlatform } from 'upi-intents';

const UPIPaymentButton = ({ payeeAddress, payeeName, amount, note }) => {
  const handlePayment = (appId) => {
    const upiUri = createPaymentUri(payeeAddress, payeeName, amount, note);
    const platform = detectPlatform();
    const link = buildAppLink({ appId, upiUri, platform });
    
    window.location.href = link.url;
  };

  return (
    <div className="upi-buttons">
      <button onClick={() => handlePayment('gpay')}>
        Pay with Google Pay
      </button>
      <button onClick={() => handlePayment('phonepe')}>
        Pay with PhonePe
      </button>
    </div>
  );
};
```

### Vue.js Integration

```vue
<template>
  <div class="upi-payment">
    <button @click="payWithApp('gpay')">Google Pay</button>
    <button @click="payWithApp('phonepe')">PhonePe</button>
  </div>
</template>

<script>
import { createPaymentUri, buildAppLink, detectPlatform } from 'upi-intents';

export default {
  methods: {
    payWithApp(appId) {
      const upiUri = createPaymentUri(
        this.payeeAddress,
        this.payeeName,
        this.amount,
        this.note
      );
      
      const link = buildAppLink({
        appId,
        upiUri,
        platform: detectPlatform()
      });
      
      window.location.href = link.url;
    }
  }
};
</script>
```

## 🎯 Supported UPI Apps

| App | Status | Android | iOS | Package/Scheme |
|-----|--------|---------|-----|----------------|
| **Google Pay** | ✅ Verified | ✅ | ✅ | `com.google.android.apps.nbu.paisa.user` |
| **PhonePe** | ⚠️ Community | ✅ | ✅ | `com.phonepe.app` |
| **Paytm** | ⚠️ Community | ✅ | ✅ | `net.one97.paytm` |
| **BHIM** | ✅ Verified | ✅ | ✅ | `in.org.npci.upiapp` |
| **Amazon Pay** | ⚠️ Community | ✅ | ✅ | `in.amazon.mShop.android.shopping` |
| **Generic UPI** | ✅ Universal | ✅ | ✅ | `upi://` |

## 📱 Platform Support

### Android
- **Intent URLs** with Chrome fallback handling
- **Package targeting** for specific app launches
- **Play Store fallbacks** for uninstalled apps
- **Generic UPI** handling via system chooser

### iOS  
- **Custom URL schemes** for direct app launching
- **App Store fallbacks** for uninstalled apps
- **Universal UPI** support where available
- **Graceful degradation** for unsupported schemes

## 🔧 Development

### Setup

```bash
git clone https://github.com/shambu2k/upi-intent.git
cd upi-intent
bun install
```

### Available Scripts

```bash
bun run test          # Run test suite
bun run test:watch    # Run tests in watch mode  
bun run build         # Build for production
bun run lint          # Run ESLint
bun run typecheck     # Run TypeScript checks
```

### Testing

```bash
bun run test --run    # Run all 55 tests
```

Current test coverage will be shown in the coverage badge above.

## 📋 Examples

Check out the [`examples/`](./examples) directory for complete working examples:

- **[Vanilla JavaScript](./examples/vanilla/)** - Pure HTML/CSS/JS implementation
- **[React](./examples/react/)** - Component-based React integration

### Live Demo

Open `examples/vanilla/index.html` in your browser to see the library in action with:
- Interactive payment form
- Platform-specific app buttons  
- QR code generation
- Real-time validation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Adding New UPI Apps

1. Update `src/data/apps.json` with app details
2. Include verification status and sources
3. Add tests for the new app integration
4. Update documentation

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NPCI](https://www.npci.org.in/) for the UPI specification
- [Chrome Intent URLs](https://developer.chrome.com/docs/android/intents) documentation  
- Community contributors for iOS scheme research
- UPI app developers for deep-linking support

## 📞 Support

- 📖 [Documentation](./docs)
- 🐛 [Issue Tracker](https://github.com/shambu2k/upi-intent/issues)
- 💬 [Discussions](https://github.com/shambu2k/upi-intent/discussions)
- 📧 [Email Support](mailto:shambu@duck.com?subject="upi-intents lib query")

---

Made with ❤️ for the Indian payments ecosystem
