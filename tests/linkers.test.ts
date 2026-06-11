/**
 * Tests for UPI link generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildAppLink,
  buildMultipleAppLinks,
  detectPlatform,
  supportsIntentUrls,
  getBestLinkStrategy,
  type AppLinkOptions
} from '../src/core/linkers.js';
import type { UpiAppId } from '../src/data/registry.js';

// Mock navigator for testing
const mockNavigator = {
  userAgent: ''
};

beforeEach(() => {
  Object.defineProperty(globalThis, 'navigator', {
    value: mockNavigator,
    writable: true,
    configurable: true,
  });
});

describe('Platform Detection', () => {
  it('should detect iOS platform', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
    expect(detectPlatform()).toBe('ios');
  });

  it('should detect Android platform', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G973F)';
    expect(detectPlatform()).toBe('android');
  });

  it('should default to Android for unknown platforms', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
    expect(detectPlatform()).toBe('android');
  });

  it('should handle server-side environment', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(detectPlatform()).toBe('android');
  });
});

describe('Intent URL Support Detection', () => {
  it('should detect Chrome on Android', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 Chrome/91.0.4472.120';
    expect(supportsIntentUrls()).toBe(true);
  });

  it('should detect Chromium on Android', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chromium/91.0.4472.120';
    expect(supportsIntentUrls()).toBe(true);
  });

  it('should reject non-Chrome Android browsers', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 Firefox/89.0';
    expect(supportsIntentUrls()).toBe(false);
  });

  it('should reject iOS browsers', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) CriOS/91.0.4472.80';
    expect(supportsIntentUrls()).toBe(false);
  });
});

describe('Link Strategy', () => {
  it('should recommend intent for Chrome on Android', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10) Chrome/91.0.4472.120';
    const strategy = getBestLinkStrategy();
    
    expect(strategy.platform).toBe('android');
    expect(strategy.supportsIntent).toBe(true);
    expect(strategy.recommendation).toBe('intent');
  });

  it('should recommend scheme for iOS', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
    const strategy = getBestLinkStrategy();
    
    expect(strategy.platform).toBe('ios');
    expect(strategy.supportsIntent).toBe(false);
    expect(strategy.recommendation).toBe('scheme');
  });

  it('should recommend generic for unsupported browsers', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10) Firefox/89.0';
    const strategy = getBestLinkStrategy();
    
    expect(strategy.platform).toBe('android');
    expect(strategy.supportsIntent).toBe(false);
    expect(strategy.recommendation).toBe('generic');
  });
});

describe('App Link Generation', () => {
  const testUpiUri = 'upi://pay?pa=test%40upi&pn=Test+User&am=100&cu=INR';

  it('should generate Google Pay Android Intent link', () => {
    const options: AppLinkOptions = {
      appId: 'gpay',
      upiUri: testUpiUri,
      platform: 'android'
    };

    const result = buildAppLink(options);
    
    expect(result.url).toContain('intent://pay?');
    expect(result.url).toContain('package=com.google.android.apps.nbu.paisa.user');
    expect(result.url).toContain('scheme=upi');
    expect(result.url).toContain('#Intent;');
    expect(result.url).toContain(';end');
    expect(result.app.id).toBe('gpay');
    expect(result.app.label).toBe('Google Pay');
    expect(result.platform).toBe('android');
  });

  it('should generate Google Pay iOS scheme link', () => {
    const options: AppLinkOptions = {
      appId: 'gpay',
      upiUri: testUpiUri,
      platform: 'ios'
    };

    const result = buildAppLink(options);
    
    expect(result.url).toBe('gpay://upi/pay?pa=test%40upi&pn=Test+User&am=100&cu=INR');
    expect(result.app.id).toBe('gpay');
    expect(result.platform).toBe('ios');
    expect(result.fallbackUrl).toContain('apps.apple.com');
  });

  it('should generate PhonePe Android Intent link', () => {
    const options: AppLinkOptions = {
      appId: 'phonepe',
      upiUri: testUpiUri,
      platform: 'android'
    };

    const result = buildAppLink(options);
    
    expect(result.url).toContain('package=com.phonepe.app');
    expect(result.app.id).toBe('phonepe');
    expect(result.app.verified).toBe(false); // Community-observed
  });

  it('should generate generic UPI link for unknown app', () => {
    const options: AppLinkOptions = {
      appId: 'generic',
      upiUri: testUpiUri,
      platform: 'android'
    };

    const result = buildAppLink(options);
    
    expect(result.url).toBe(testUpiUri);
    expect(result.app.id).toBe('generic');
  });

  it('should include fallback URL in Android Intent', () => {
    const options: AppLinkOptions = {
      appId: 'gpay',
      upiUri: testUpiUri,
      platform: 'android',
      fallbackUrl: 'https://example.com/fallback'
    };

    const result = buildAppLink(options);
    
    expect(result.url).toContain('S.browser_fallback_url=https%3A%2F%2Fexample.com%2Ffallback');
    expect(result.fallbackUrl).toBe('https://example.com/fallback');
  });

  it('should use store URL as default fallback', () => {
    const options: AppLinkOptions = {
      appId: 'gpay',
      upiUri: testUpiUri,
      platform: 'android'
    };

    const result = buildAppLink(options);
    
    expect(result.fallbackUrl).toContain('play.google.com');
  });

  it('should disable fallback when requested', () => {
    const options: AppLinkOptions = {
      appId: 'gpay',
      upiUri: testUpiUri,
      platform: 'android',
      includeFallback: false
    };

    const result = buildAppLink(options);
    
    expect(result.url).not.toContain('S.browser_fallback_url');
    expect(result.fallbackUrl).toBeUndefined();
  });

  it('should handle mandate action', () => {
    const mandateUri = 'upi://mandate?pa=test%40upi&pn=Test+User&am=100&cu=INR&tr=SUB123';
    const options: AppLinkOptions = {
      appId: 'gpay',
      upiUri: mandateUri,
      platform: 'android',
      action: 'mandate'
    };

    const result = buildAppLink(options);
    
    expect(result.url).toContain('intent://mandate?');
    expect(result.action).toBe('mandate');
  });

  it('should generate link from UPI parameters', () => {
    const options: AppLinkOptions = {
      appId: 'gpay',
      upiParams: {
        pa: 'merchant@paytm',
        pn: 'Test Merchant',
        am: '250.00'
      },
      platform: 'ios'
    };

    const result = buildAppLink(options);
    
    expect(result.url).toContain('gpay://upi/pay?');
    expect(result.url).toContain('pa=merchant%40paytm');
    expect(result.url).toContain('am=250.00');
  });

  it('should throw error for missing required options', () => {
    expect(() => {
      buildAppLink({
        appId: 'gpay',
        platform: 'android'
        // Missing upiUri and upiParams
      });
    }).toThrow('Either upiUri or upiParams must be provided');
  });

  it('should throw error for unknown app ID', () => {
    expect(() => {
      buildAppLink({
        appId: 'unknown' as any,
        upiUri: testUpiUri,
        platform: 'android'
      });
    }).toThrow('Unknown app ID: unknown');
  });
});

describe('Multiple App Links', () => {
  const testUpiUri = 'upi://pay?pa=test%40upi&pn=Test+User&am=100&cu=INR';

  it('should generate links for multiple apps', () => {
    const appIds: UpiAppId[] = ['gpay', 'phonepe', 'paytm'];
    const results = buildMultipleAppLinks(testUpiUri, appIds, 'android');
    
    expect(results).toHaveLength(3);
    expect(results[0]!.app.id).toBe('gpay');
    expect(results[1]!.app.id).toBe('phonepe');
    expect(results[2]!.app.id).toBe('paytm');
    
    results.forEach(result => {
      expect(result.platform).toBe('android');
      expect(result.action).toBe('pay');
    });
  });

  it('should auto-detect platform when not specified', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
    const results = buildMultipleAppLinks(testUpiUri, ['gpay']);
    
    expect(results[0]!.platform).toBe('ios');
  });

  it('should support mandate action for multiple apps', () => {
    const mandateUri = 'upi://mandate?pa=test%40upi&pn=Test+User&tr=SUB123';
    const results = buildMultipleAppLinks(mandateUri, ['gpay', 'phonepe'], 'android', 'mandate');

    results.forEach(result => {
      expect(result.action).toBe('mandate');
      expect(result.url).toContain('mandate');
    });
  });
});

describe('New UPI App Link Generation', () => {
  const testUpiUri = 'upi://pay?pa=test%40upi&pn=Test+User&am=100&cu=INR';

  describe('CRED', () => {
    it('should generate CRED Android Intent link', () => {
      const result = buildAppLink({
        appId: 'cred',
        upiUri: testUpiUri,
        platform: 'android'
      });

      expect(result.url).toContain('intent://pay?');
      expect(result.url).toContain('package=com.dreamplug.androidapp');
      expect(result.app.id).toBe('cred');
      expect(result.app.label).toBe('CRED');
    });

    it('should generate CRED iOS scheme link', () => {
      const result = buildAppLink({
        appId: 'cred',
        upiUri: testUpiUri,
        platform: 'ios'
      });

      expect(result.url).toBe('credpay://upi/pay?pa=test%40upi&pn=Test+User&am=100&cu=INR');
      expect(result.platform).toBe('ios');
    });
  });

  describe('ICICI Bank', () => {
    it('should generate ICICI iMobile Pay Android Intent link', () => {
      const result = buildAppLink({
        appId: 'icici',
        upiUri: testUpiUri,
        platform: 'android'
      });

      expect(result.url).toContain('package=com.csam.icici.bank.imobile');
      expect(result.app.id).toBe('icici');
      expect(result.app.label).toBe('ICICI Bank (iMobile Pay)');
    });

    it('should generate ICICI iOS scheme link', () => {
      const result = buildAppLink({
        appId: 'icici',
        upiUri: testUpiUri,
        platform: 'ios'
      });

      expect(result.url).toBe('imobile://upi/pay?pa=test%40upi&pn=Test+User&am=100&cu=INR');
    });
  });

  describe('Tata Neu', () => {
    it('should generate Tata Neu Android Intent link', () => {
      const result = buildAppLink({
        appId: 'tataneu',
        upiUri: testUpiUri,
        platform: 'android'
      });

      expect(result.url).toContain('package=com.tatadigital.neumoney');
      expect(result.app.id).toBe('tataneu');
    });

    it('should generate Tata Neu iOS scheme link using tnupi://', () => {
      const result = buildAppLink({
        appId: 'tataneu',
        upiUri: testUpiUri,
        platform: 'ios'
      });

      expect(result.url).toBe('tnupi://upi/pay?pa=test%40upi&pn=Test+User&am=100&cu=INR');
    });
  });

  describe('WhatsApp', () => {
    it('should generate WhatsApp Android Intent link', () => {
      const result = buildAppLink({
        appId: 'whatsapp',
        upiUri: testUpiUri,
        platform: 'android'
      });

      expect(result.url).toContain('package=com.whatsapp');
      expect(result.app.id).toBe('whatsapp');
    });
  });

  describe('New apps in multiple app links', () => {
    it('should generate links for new apps alongside existing ones', () => {
      const appIds = ['gpay', 'cred', 'icici', 'tataneu'] as const;
      const results = buildMultipleAppLinks(testUpiUri, [...appIds] as any, 'ios');

      expect(results).toHaveLength(4);
      expect(results[0]!.app.id).toBe('gpay');
      expect(results[0]!.url).toContain('gpay://');
      expect(results[1]!.app.id).toBe('cred');
      expect(results[1]!.url).toContain('credpay://');
      expect(results[2]!.app.id).toBe('icici');
      expect(results[1]!.url).toContain('credpay://');
      expect(results[3]!.app.id).toBe('tataneu');
    });
  });

  describe('New apps mandate action', () => {
    it('should generate mandate links for new apps', () => {
      const mandateUri = 'upi://mandate?pa=test%40upi&pn=Test+User&am=100&cu=INR&tr=SUB123';
      const result = buildAppLink({
        appId: 'cred',
        upiUri: mandateUri,
        platform: 'ios',
        action: 'mandate'
      });

      expect(result.url).toContain('credpay://upi/mandate?');
      expect(result.action).toBe('mandate');
    });
  });

  describe('Store fallback URLs', () => {
    it('should include store fallback for known apps', () => {
      const result = buildAppLink({
        appId: 'gpay',
        upiUri: testUpiUri,
        platform: 'android'
      });

      expect(result.fallbackUrl).toContain('play.google.com');
      expect(result.fallbackUrl).toContain('com.google.android.apps.nbu.paisa.user');
    });

    it('should return undefined fallback for apps without store info', () => {
      const result = buildAppLink({
        appId: 'cred',
        upiUri: testUpiUri,
        platform: 'android'
      });

      expect(result.fallbackUrl).toBeUndefined();
    });
  });
});

describe('App Registry - New Apps', () => {
  it('should include new apps in getAllApps', async () => {
    const { getAllApps } = await import('../src/data/registry.js');
    const apps = getAllApps();

    expect(apps.length).toBeGreaterThanOrEqual(32); // 6 existing + 26+ new
    expect(apps.find(a => a.id === 'cred')).toBeDefined();
    expect(apps.find(a => a.id === 'whatsapp')).toBeDefined();
    expect(apps.find(a => a.id === 'icici')).toBeDefined();
    expect(apps.find(a => a.id === 'tataneu')).toBeDefined();
  });

  it('should find new apps by ID', async () => {
    const { getApp } = await import('../src/data/registry.js');

    const cred = getApp('cred');
    expect(cred).toBeDefined();
    expect(cred!.androidPackage).toBe('com.dreamplug.androidapp');
    expect(cred!.ios.pay).toContain('credpay://');

    const whatsapp = getApp('whatsapp');
    expect(whatsapp).toBeDefined();
    expect(whatsapp!.androidPackage).toBe('com.whatsapp');

    const fi = getApp('fi');
    expect(fi).toBeDefined();
    expect(fi!.androidPackage).toBe('com.fi.money');
  });

  it('should mark new apps as community-observed', async () => {
    const { getVerifiedApps, getAllApps } = await import('../src/data/registry.js');

    const allApps = getAllApps();
    const verified = getVerifiedApps();

    // Only 'generic' and 'gpay' should be verified
    expect(verified.every(a => a.verification.status === 'verified')).toBe(true);

    // New apps should all be community-observed
    const newAppIds = ['cred', 'whatsapp', 'icici', 'tataneu', 'fi'];
    for (const id of newAppIds) {
      const app = allApps.find(a => a.id === id);
      expect(app).toBeDefined();
      expect(app!.verification.status).toBe('community-observed');
    }
  });

  it('should include new popular apps in getDefaultAppIds', async () => {
    const { getDefaultAppIds } = await import('../src/data/registry.js');
    const defaultIds = getDefaultAppIds();

    expect(defaultIds).toContain('cred');
    expect(defaultIds).toContain('whatsapp');
    expect(defaultIds).toContain('icici');
    expect(defaultIds).toContain('mobikwik');
  });
});