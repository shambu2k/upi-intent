/**
 * UPI App Registry Types and Utilities
 */

import appsData from './apps.json';
import type { UpiAction } from '../core/params.js';

export type UpiAppId = 'generic' | 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'amazonpay';

export type Platform = 'android' | 'ios';

export type VerificationStatus = 'verified' | 'community-observed';

export interface UpiApp {
  id: UpiAppId;
  label: string;
  androidPackage?: string;
  android: {
    pay: string;
    mandate: string;
  };
  ios: {
    pay: string;
    mandate: string;
  };
  stores?: {
    play?: string;
    app?: string;
  };
  brand: {
    iconSvg: string;
  };
  verification: {
    status: VerificationStatus;
    sources: string[];
    notes?: string;
  };
}

/**
 * Get all available UPI apps
 */
export function getAllApps(): UpiApp[] {
  return appsData as UpiApp[];
}

/**
 * Get a specific UPI app by ID
 */
export function getApp(appId: UpiAppId): UpiApp | undefined {
  return getAllApps().find(app => app.id === appId);
}

/**
 * Get verified apps only (excludes community-observed)
 */
export function getVerifiedApps(): UpiApp[] {
  return getAllApps().filter(app => app.verification.status === 'verified');
}

/**
 * Get apps that support a specific platform
 */
export function getAppsForPlatform(platform: Platform): UpiApp[] {
  return getAllApps().filter(app => {
    if (platform === 'android') {
      return app.androidPackage || app.android;
    }
    return app.ios;
  });
}

/**
 * Get the link template for a specific app, platform, and action
 */
export function getAppLinkTemplate(appId: UpiAppId, platform: Platform, action: UpiAction): string | undefined {
  const app = getApp(appId);
  if (!app) {
    return undefined;
  }

  return app[platform][action];
}

/**
 * Get app store URL for a specific app and platform
 */
export function getStoreUrl(appId: UpiAppId, platform: Platform): string | undefined {
  const app = getApp(appId);
  if (!app?.stores) {
    return undefined;
  }

  if (platform === 'android') {
    return app.stores.play;
  }
  return app.stores.app;
}

/**
 * Check if an app is verified (not community-observed)
 */
export function isAppVerified(appId: UpiAppId): boolean {
  const app = getApp(appId);
  return app ? app.verification.status === 'verified' : false;
}

/**
 * Get all app IDs
 */
export function getAllAppIds(): UpiAppId[] {
  return getAllApps().map(app => app.id);
}

/**
 * Get only verified app IDs
 */
export function getVerifiedAppIds(): UpiAppId[] {
  return getVerifiedApps().map(app => app.id);
}

/**
 * Get default app IDs for UI (verified + most popular community-observed)
 */
export function getDefaultAppIds(): UpiAppId[] {
  const verified = getVerifiedAppIds();
  const popular = ['gpay', 'phonepe', 'paytm', 'bhim'] as UpiAppId[];
  
  // Return verified apps plus popular ones (deduped)
  const defaultApps = [...new Set([...verified, ...popular])];
  
  // Ensure generic is last if present
  const withoutGeneric = defaultApps.filter(id => id !== 'generic');
  const hasGeneric = defaultApps.includes('generic');
  
  return hasGeneric ? [...withoutGeneric, 'generic'] : withoutGeneric;
}