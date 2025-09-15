/**
 * UPI Intents Library - Source API
 * A framework-agnostic library for generating UPI app-specific deep links
 */

// Core API exports
export {
  type UpiParams,
  type PartialUpiParams,
  type UpiAction,
  type UpiValidationResult,
  validateUpiParams,
  buildUpiUri,
  parseUpiUri,
  createPaymentUri,
  createMandateUri
} from './core/params.js';

export {
  type AppLinkOptions,
  type GeneratedLink,
  type Platform,
  buildAppLink,
  buildMultipleAppLinks,
  buildGenericUpiLink,
  detectPlatform,
  supportsIntentUrls,
  getBestLinkStrategy
} from './core/linkers.js';

export {
  type UpiApp,
  type UpiAppId,
  type VerificationStatus,
  getAllApps,
  getApp,
  getVerifiedApps,
  getAppsForPlatform,
  getAppLinkTemplate,
  getStoreUrl,
  isAppVerified,
  getAllAppIds,
  getVerifiedAppIds,
  getDefaultAppIds
} from './data/registry.js';

// QR Code generation
export {
  type QRCodeOptions,
  type QRCodeResult,
  generateQRCode,
  generateQRCanvas,
  downloadQRCode
} from './qr/encoder';

// Re-export for convenience
export { default as appsData } from './data/apps.json' assert { type: 'json' };