# UPI Intents Examples

This directory contains working examples demonstrating how to use the UPI Intents library in different environments.

## 📁 Directory Structure

```
examples/
├── vanilla/          # Pure HTML/JavaScript example
│   └── index.html    # Complete demo page
└── react/            # React.js example
    ├── package.json  # React dependencies
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js    # Main React component
        ├── App.css   # Component styles
        ├── index.js  # React entry point
        └── index.css # Global styles
```

## 🌐 Vanilla JavaScript Example

The vanilla example demonstrates the library usage without any framework dependencies.

### Features:
- ✅ Pure HTML/CSS/JavaScript implementation
- ✅ Payment and mandate link generation
- ✅ Platform-specific app links (Android Intent URLs, iOS schemes)
- ✅ QR code generation for desktop fallback
- ✅ Responsive design for mobile and desktop
- ✅ Real-time form validation

### Usage:
1. Open `vanilla/index.html` in any modern web browser
2. Fill in payment details (pre-filled with demo data)
3. Click "Generate Payment Links" or "Generate Mandate Links"
4. Test the app buttons (will open respective UPI apps if installed)
5. Use QR code for desktop testing

### Key Implementation Details:
- Mock UPI library functions for demo purposes
- Platform detection (Android/iOS) for appropriate link generation
- Error handling for invalid parameters
- Analytics tracking hooks for production use

## ⚛️ React Example

The React example shows how to integrate UPI Intents in a React application with proper component structure.

### Features:
- ✅ Component-based architecture
- ✅ State management with React hooks
- ✅ Reusable UPI app button components
- ✅ QR code display component
- ✅ Form validation and error handling
- ✅ Responsive design with CSS modules

### Setup:
```bash
cd examples/react
npm install
npm start
```

### Key Components:

#### `UpiAppButton` Component
- Renders individual UPI app buttons
- Handles link generation and error states
- Supports fallback URLs for app installation
- Includes analytics tracking hooks

#### `QRCodeDisplay` Component  
- Generates and displays QR codes
- Provides download functionality
- Handles QR code generation errors

#### `App` Component
- Main form for payment details
- Orchestrates UPI link generation
- Manages application state
- Handles validation and error display

### Integration with Real Library:
To use with the actual npm package, replace the mock functions with:

```javascript
import { 
  createPaymentUri, 
  createMandateUri, 
  buildAppLink, 
  detectPlatform, 
  generateQRCode 
} from 'upi-intents';
```

## 🔗 URL Examples

### Payment URLs:
```
upi://pay?pa=demo@upi&pn=Demo%20Merchant&am=99.50&cu=INR&tn=Test%20payment
```

### Android Intent URLs:
```
intent://pay?pa=demo@upi&pn=Demo%20Merchant&am=99.50&cu=INR&tn=Test%20payment#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end
```

### iOS Scheme URLs:
```
gpay://upi/pay?pa=demo@upi&pn=Demo%20Merchant&am=99.50&cu=INR&tn=Test%20payment
```

## 📱 Testing Guide

### Mobile Testing:
1. **Android**: Intent URLs will open the specific app or show app chooser
2. **iOS**: Scheme URLs will open the app or redirect to App Store
3. **Generic UPI**: `upi://` URLs work across all UPI apps

### Desktop Testing:
1. Use QR codes for testing with mobile devices
2. QR codes contain the same UPI URI as mobile links
3. Download QR codes for integration testing

### App Availability Testing:
- ✅ **Google Pay**: Verified app with robust Intent/scheme support
- ⚠️ **PhonePe**: Unverified - test with actual app installation
- ⚠️ **Paytm**: Unverified - test with actual app installation
- ✅ **Generic UPI**: Works with any UPI-enabled app

## 🎨 Customization

### Styling:
- Modify CSS files for custom branding
- Update app icons and verification badges
- Customize button layouts and colors

### Functionality:
- Add custom validation rules
- Implement analytics tracking
- Add support for additional UPI apps
- Customize QR code appearance

### Error Handling:
- Customize error messages
- Add retry mechanisms
- Implement fallback strategies

## 🔧 Production Considerations

### Security:
- Validate all UPI parameters on server-side
- Sanitize user inputs to prevent XSS
- Use HTTPS for all payment-related pages

### Analytics:
- Track button clicks and conversion rates
- Monitor app availability and success rates
- A/B test different UPI app arrangements

### Performance:
- Lazy load QR code generation
- Cache app registry data
- Optimize for mobile networks

### Accessibility:
- Add proper ARIA labels for screen readers
- Ensure keyboard navigation support
- Use semantic HTML elements

## 🐛 Troubleshooting

### Common Issues:

1. **Links not working on mobile**:
   - Ensure testing on actual devices, not emulators
   - Check if UPI apps are installed
   - Verify network connectivity

2. **QR codes not scanning**:
   - Test with different UPI apps
   - Ensure QR code is high contrast
   - Check for proper UPI URI formatting

3. **React build errors**:
   - Ensure all dependencies are installed
   - Check Node.js version compatibility
   - Clear node_modules and reinstall if needed

### Debug Mode:
Both examples include console logging for debugging:
- Check browser console for error messages
- Monitor network requests for failed app launches
- Use React DevTools for component state inspection