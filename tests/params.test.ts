/**
 * Tests for UPI parameter validation and URI building
 */

import { describe, it, expect } from 'vitest';
import {
  validateUpiParams,
  buildUpiUri,
  parseUpiUri,
  createPaymentUri,
  createMandateUri,
  type PartialUpiParams
} from '../src/core/params.js';

describe('UPI Parameter Validation', () => {
  it('should validate required fields', () => {
    const result = validateUpiParams({
      pa: 'test@upi',
      pn: 'Test User'
    });
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.normalizedParams.pa).toBe('test@upi');
    expect(result.normalizedParams.pn).toBe('Test User');
  });

  it('should reject missing required fields', () => {
    const result = validateUpiParams({});
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Payee Address (pa) is required');
    expect(result.errors).toContain('Payee Name (pn) is required');
  });

  it('should validate VPA format', () => {
    const result = validateUpiParams({
      pa: 'invalid-vpa',
      pn: 'Test User'
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('pa: invalid format. Valid VPA format (user@psp)');
  });

  it('should validate amount format', () => {
    const result = validateUpiParams({
      pa: 'test@upi',
      pn: 'Test User',
      am: 'invalid-amount'
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('am: invalid format. Amount in INR (up to 2 decimal places)');
  });

  it('should accept valid amount formats', () => {
    const validAmounts = ['100', '100.00', '999.99', '1'];
    
    validAmounts.forEach(amount => {
      const result = validateUpiParams({
        pa: 'test@upi',
        pn: 'Test User',
        am: amount
      });
      
      expect(result.isValid).toBe(true);
      expect(result.normalizedParams.am).toBe(amount);
    });
  });

  it('should set default currency when amount is provided', () => {
    const result = validateUpiParams({
      pa: 'test@upi',
      pn: 'Test User',
      am: '100'
    });
    
    expect(result.isValid).toBe(true);
    expect(result.normalizedParams.cu).toBe('INR');
  });

  it('should validate currency code', () => {
    const result = validateUpiParams({
      pa: 'test@upi',
      pn: 'Test User',
      cu: 'USD'
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('cu: must be one of INR');
  });
});

describe('UPI URI Building', () => {
  it('should build basic payment URI', () => {
    const params: PartialUpiParams = {
      pa: 'test@upi',
      pn: 'Test User'
    };
    
    const uri = buildUpiUri(params, 'pay');
    expect(uri).toBe('upi://pay?pa=test%40upi&pn=Test+User');
  });

  it('should build payment URI with amount', () => {
    const params: PartialUpiParams = {
      pa: 'merchant@paytm',
      pn: 'Test Merchant',
      am: '100.50',
      tn: 'Test payment'
    };
    
    const uri = buildUpiUri(params, 'pay');
    expect(uri).toContain('pa=merchant%40paytm');
    expect(uri).toContain('pn=Test+Merchant');
    expect(uri).toContain('am=100.50');
    expect(uri).toContain('tn=Test+payment');
    expect(uri).toContain('cu=INR');
  });

  it('should build mandate URI', () => {
    const params: PartialUpiParams = {
      pa: 'merchant@upi',
      pn: 'Subscription Service',
      am: '99.00',
      tr: 'SUB123'
    };
    
    const uri = buildUpiUri(params, 'mandate');
    expect(uri).toMatch(/^upi:\/\/mandate\?/);
    expect(uri).toContain('tr=SUB123');
  });

  it('should handle special characters in parameters', () => {
    const params: PartialUpiParams = {
      pa: 'test@upi',
      pn: 'Test & Co.',
      tn: 'Payment for goods & services'
    };
    
    const uri = buildUpiUri(params, 'pay');
    expect(uri).toContain('pn=Test+%26+Co.');
    expect(uri).toContain('tn=Payment+for+goods+%26+services');
  });
});

describe('UPI URI Parsing', () => {
  it('should parse valid payment URI', () => {
    const uri = 'upi://pay?pa=test%40upi&pn=Test+User&am=100&cu=INR';
    const parsed = parseUpiUri(uri);
    
    expect(parsed.action).toBe('pay');
    expect(parsed.params.pa).toBe('test@upi');
    expect(parsed.params.pn).toBe('Test User');
    expect(parsed.params.am).toBe('100');
    expect(parsed.params.cu).toBe('INR');
  });

  it('should parse mandate URI', () => {
    const uri = 'upi://mandate?pa=merchant%40upi&pn=Service&tr=ABC123';
    const parsed = parseUpiUri(uri);
    
    expect(parsed.action).toBe('mandate');
    expect(parsed.params.tr).toBe('ABC123');
  });

  it('should reject invalid URI scheme', () => {
    expect(() => {
      parseUpiUri('http://example.com/pay?pa=test@upi');
    }).toThrow('Invalid UPI URI: must start with upi://');
  });

  it('should reject invalid action', () => {
    expect(() => {
      parseUpiUri('upi://invalid?pa=test@upi&pn=Test');
    }).toThrow('Invalid UPI action: must be "pay" or "mandate"');
  });
});

describe('Utility Functions', () => {
  it('should create payment URI with convenience function', () => {
    const uri = createPaymentUri('merchant@gpay', 'Test Merchant', '250.00', 'Purchase');
    
    expect(uri).toContain('pa=merchant%40gpay');
    expect(uri).toContain('pn=Test+Merchant');
    expect(uri).toContain('am=250.00');
    expect(uri).toContain('tn=Purchase');
    expect(uri).toContain('cu=INR');
  });

  it('should create mandate URI with convenience function', () => {
    const uri = createMandateUri(
      'service@upi',
      'Subscription Service',
      '99.99',
      'Monthly subscription',
      'SUB-001'
    );
    
    expect(uri).toMatch(/^upi:\/\/mandate\?/);
    expect(uri).toContain('tr=SUB-001');
    expect(uri).toContain('am=99.99');
  });

  it('should create payment URI without optional parameters', () => {
    const uri = createPaymentUri('test@upi', 'Test User');
    
    expect(uri).toContain('pa=test%40upi');
    expect(uri).toContain('pn=Test+User');
    expect(uri).toContain('cu=INR');
    expect(uri).not.toContain('am=');
    expect(uri).not.toContain('tn=');
  });
});

describe('Edge Cases', () => {
  it('should handle empty string parameters', () => {
    const result = validateUpiParams({
      pa: 'test@upi',
      pn: 'Test User',
      am: '',
      tn: '   '
    });
    
    expect(result.isValid).toBe(true);
    expect(result.normalizedParams.am).toBeUndefined();
    expect(result.normalizedParams.tn).toBeUndefined();
  });

  it('should preserve unknown parameters', () => {
    const result = validateUpiParams({
      pa: 'test@upi',
      pn: 'Test User',
      customField: 'custom-value'
    });
    
    expect(result.isValid).toBe(true);
    expect(result.normalizedParams.customField).toBe('custom-value');
  });

  it('should trim whitespace from parameters', () => {
    const result = validateUpiParams({
      pa: '  test@upi  ',
      pn: '  Test User  '
    });
    
    expect(result.isValid).toBe(true);
    expect(result.normalizedParams.pa).toBe('test@upi');
    expect(result.normalizedParams.pn).toBe('Test User');
  });
});