/**
 * UPI Intents Library - Source API
 * A framework-agnostic library for generating UPI app-specific deep links
 */
export { type UpiParams, type PartialUpiParams, type UpiAction, type UpiValidationResult, validateUpiParams, buildUpiUri, parseUpiUri, createPaymentUri, createMandateUri } from './core/params.js';
export { type AppLinkOptions, type GeneratedLink, type Platform, buildAppLink, buildMultipleAppLinks, buildGenericUpiLink, detectPlatform, supportsIntentUrls, getBestLinkStrategy } from './core/linkers.js';
export { type UpiApp, type UpiAppId, type VerificationStatus, getAllApps, getApp, getVerifiedApps, getAppsForPlatform, getAppLinkTemplate, getStoreUrl, isAppVerified, getAllAppIds, getVerifiedAppIds, getDefaultAppIds } from './data/registry.js';
export { type QRCodeOptions, type QRCodeResult, generateQRCode, generateQRCanvas, downloadQRCode } from './qr/encoder';
export { default as appsData } from './data/apps.json';
