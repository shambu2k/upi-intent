/**
 * UPI App Registry Types and Utilities
 */
import type { UpiAction } from '../core/params.js';
export type UpiAppId = 'generic' | 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'amazonpay' | 'cred' | 'navi' | 'supermoney' | 'kotak' | 'hdfc' | 'whatsapp' | 'mobikwik' | 'icici' | 'sbi' | 'axis' | 'slice' | 'idfcfirst' | 'jupiter' | 'fampay' | 'airtel' | 'kiwi' | 'shriramone' | 'omnicard' | 'freecharge' | 'tataneu' | 'indusind' | 'bob' | 'postpe' | 'simplypay' | 'onecard' | 'rbl' | 'dbs' | 'canara' | 'pnb' | 'jiopay' | 'flipkart' | 'fi';
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
export declare function getAllApps(): UpiApp[];
/**
 * Get a specific UPI app by ID
 */
export declare function getApp(appId: UpiAppId): UpiApp | undefined;
/**
 * Get verified apps only (excludes community-observed)
 */
export declare function getVerifiedApps(): UpiApp[];
/**
 * Get apps that support a specific platform
 */
export declare function getAppsForPlatform(platform: Platform): UpiApp[];
/**
 * Get the link template for a specific app, platform, and action
 */
export declare function getAppLinkTemplate(appId: UpiAppId, platform: Platform, action: UpiAction): string | undefined;
/**
 * Get app store URL for a specific app and platform
 */
export declare function getStoreUrl(appId: UpiAppId, platform: Platform): string | undefined;
/**
 * Check if an app is verified (not community-observed)
 */
export declare function isAppVerified(appId: UpiAppId): boolean;
/**
 * Get all app IDs
 */
export declare function getAllAppIds(): UpiAppId[];
/**
 * Get only verified app IDs
 */
export declare function getVerifiedAppIds(): UpiAppId[];
/**
 * Get default app IDs for UI (verified + most popular community-observed)
 */
export declare function getDefaultAppIds(): UpiAppId[];
