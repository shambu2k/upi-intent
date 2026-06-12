/**
 * UPI Link Generation Core
 * Handles Android Intent URLs and iOS scheme URLs with proper fallbacks
 */
import type { UpiAction, PartialUpiParams } from './params.js';
import type { UpiAppId, Platform } from '../data/registry.js';
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
export declare function detectPlatform(): Platform;
/**
 * Generate an app-specific link from UPI parameters or URI
 */
export declare function buildAppLink(options: AppLinkOptions): GeneratedLink;
/**
 * Generate links for multiple apps
 */
export declare function buildMultipleAppLinks(upiUri: string, appIds: UpiAppId[], platform?: Platform, action?: UpiAction): GeneratedLink[];
/**
 * Utility to build a generic UPI link (not app-specific)
 */
export declare function buildGenericUpiLink(upiParams: PartialUpiParams, action?: UpiAction): string;
/**
 * Check if a platform supports Intent URLs (Android Chrome/Chromium)
 */
export declare function supportsIntentUrls(): boolean;
/**
 * Get the best link type for current environment
 */
export declare function getBestLinkStrategy(): {
    platform: Platform;
    supportsIntent: boolean;
    recommendation: 'intent' | 'scheme' | 'generic';
};
