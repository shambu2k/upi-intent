/**
 * UPI Link Generation Core
 * Handles Android Intent URLs and iOS scheme URLs with proper fallbacks
 */

import type { UpiAction, PartialUpiParams } from './params.js';
import type { UpiAppId, Platform } from '../data/registry.js';
import { getApp, getAppLinkTemplate, getStoreUrl } from '../data/registry.js';
import { buildUpiUri, parseUpiUri } from './params.js';

// Re-export Platform type for convenience
export type { Platform } from '../data/registry.js';

export interface AppLinkOptions {
  /** UPI app ID to target */
  appId: UpiAppId;
  
  /** UPI URI or parameters to convert */
  upiUri?: string;
  upiParams?: PartialUpiParams;
  
  /** Target platform */
  platform: Platform;
  
  /** UPI action type */
  action?: UpiAction;
  
  /** Custom fallback URL (overrides default store URL) */
  fallbackUrl?: string;
  
  /** Include store fallback for Android Intent URLs */
  includeFallback?: boolean;
}

export interface GeneratedLink {
  /** The generated app-specific link */
  url: string;
  
  /** Fallback URL (app store or custom) */
  fallbackUrl?: string;
  
  /** App information */
  app: {
    id: UpiAppId;
    label: string;
    verified: boolean;
  };
  
  /** Platform and action used */
  platform: Platform;
  action: UpiAction;
}

/**
 * Detect the current platform based on user agent
 */
export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') {
    return 'android'; // Default to android for server-side
  }

  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  
  return 'android';
}

/**
 * Build an Android Chrome Intent URL with fallback
 */
function buildAndroidIntentUrl(
  appId: UpiAppId, 
  upiQuery: string, 
  action: UpiAction, 
  fallbackUrl?: string
): string {
  const app = getApp(appId);
  
  if (!app?.androidPackage) {
    // No specific package, return generic UPI URI
    return `upi://${action}?${upiQuery}`;
  }

  let intentUrl = `intent://${action}?${upiQuery}#Intent;scheme=upi;package=${app.androidPackage}`;
  
  if (fallbackUrl) {
    // Encode the fallback URL to prevent issues with special characters
    const encodedFallback = encodeURIComponent(fallbackUrl);
    intentUrl += `;S.browser_fallback_url=${encodedFallback}`;
  }
  
  intentUrl += ';end';
  
  return intentUrl;
}

/**
 * Build an iOS app-specific URL scheme
 */
function buildIosSchemeUrl(appId: UpiAppId, upiQuery: string, action: UpiAction): string {
  const template = getAppLinkTemplate(appId, 'ios', action);
  
  if (!template) {
    // No specific scheme, return generic UPI URI
    return `upi://${action}?${upiQuery}`;
  }

  // Replace {query} placeholder with actual query parameters
  return template.replace('{query}', upiQuery);
}

/**
 * Extract query parameters from UPI URI
 */
function extractQueryFromUri(upiUri: string): string {
  try {
    const parsed = parseUpiUri(upiUri);
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(parsed.params)) {
      if (value !== undefined && value !== '') {
        params.append(key, value);
      }
    }
    
    return params.toString();
  } catch (error) {
    throw new Error(`Invalid UPI URI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate an app-specific link from UPI parameters or URI
 */
export function buildAppLink(options: AppLinkOptions): GeneratedLink {
  const {
    appId,
    upiUri,
    upiParams,
    platform,
    action = 'pay',
    fallbackUrl,
    includeFallback = true
  } = options;

  // Validate that we have either upiUri or upiParams
  if (!upiUri && !upiParams) {
    throw new Error('Either upiUri or upiParams must be provided');
  }

  // Get app information
  const app = getApp(appId);
  if (!app) {
    throw new Error(`Unknown app ID: ${appId}`);
  }

  // Build the base UPI URI if not provided
  let baseUri: string;
  if (upiUri) {
    baseUri = upiUri;
  } else if (upiParams) {
    baseUri = buildUpiUri(upiParams, action);
  } else {
    throw new Error('Either upiUri or upiParams must be provided');
  }

  // Extract query parameters
  const upiQuery = extractQueryFromUri(baseUri);

  // Generate platform-specific URL
  let url: string;
  let resolvedFallbackUrl: string | undefined;

  if (platform === 'android') {
    // Determine fallback URL
    if (includeFallback) {
      resolvedFallbackUrl = fallbackUrl || getStoreUrl(appId, 'android');
    }
    
    url = buildAndroidIntentUrl(appId, upiQuery, action, resolvedFallbackUrl);
  } else {
    // iOS
    url = buildIosSchemeUrl(appId, upiQuery, action);
    
    // For iOS, always provide store fallback (can't detect installed apps)
    resolvedFallbackUrl = fallbackUrl || getStoreUrl(appId, 'ios');
  }

  return {
    url,
    fallbackUrl: resolvedFallbackUrl,
    app: {
      id: appId,
      label: app.label,
      verified: app.verification.status === 'verified'
    },
    platform,
    action
  };
}

/**
 * Generate links for multiple apps
 */
export function buildMultipleAppLinks(
  upiUri: string,
  appIds: UpiAppId[],
  platform?: Platform,
  action: UpiAction = 'pay'
): GeneratedLink[] {
  const targetPlatform = platform || detectPlatform();
  
  return appIds.map(appId => 
    buildAppLink({
      appId,
      upiUri,
      platform: targetPlatform,
      action
    })
  );
}

/**
 * Utility to build a generic UPI link (not app-specific)
 */
export function buildGenericUpiLink(
  upiParams: PartialUpiParams,
  action: UpiAction = 'pay'
): string {
  return buildUpiUri(upiParams, action);
}

/**
 * Check if a platform supports Intent URLs (Android Chrome/Chromium)
 */
export function supportsIntentUrls(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for Chrome/Chromium on Android
  return /android/.test(userAgent) && 
         (/chrome|chromium/.test(userAgent) || /crios/.test(userAgent));
}

/**
 * Get the best link type for current environment
 */
export function getBestLinkStrategy(): {
  platform: Platform;
  supportsIntent: boolean;
  recommendation: 'intent' | 'scheme' | 'generic';
} {
  const platform = detectPlatform();
  const supportsIntent = supportsIntentUrls();
  
  let recommendation: 'intent' | 'scheme' | 'generic';
  
  if (platform === 'android' && supportsIntent) {
    recommendation = 'intent';
  } else if (platform === 'ios') {
    recommendation = 'scheme';
  } else {
    recommendation = 'generic';
  }
  
  return {
    platform,
    supportsIntent,
    recommendation
  };
}