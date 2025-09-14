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
  vi.stubGlobal('navigator', mockNavigator);
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
    vi.stubGlobal('navigator', undefined);
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