/**
 * UPI Parameter Types and Validation
 * Based on NPCI UPI Linking Specification v1.6
 */

export interface UpiParams {
  /** Payee Address (Virtual Payment Address) - REQUIRED */
  pa: string;
  
  /** Payee Name - REQUIRED */
  pn: string;
  
  /** Amount in INR - OPTIONAL for discovery, REQUIRED for payment */
  am?: string;
  
  /** Currency Code (always INR for UPI) - REQUIRED */
  cu?: string;
  
  /** Transaction Reference ID - OPTIONAL */
  tr?: string;
  
  /** Transaction Note/Description - OPTIONAL */
  tn?: string;
  
  /** URL for additional information - OPTIONAL */
  url?: string;
  
  /** Mode of transaction - OPTIONAL */
  mode?: string;
  
  /** Organization ID for merchant transactions - OPTIONAL */
  orgid?: string;
  
  /** Digital signature - OPTIONAL */
  sign?: string;
  
  /** Merchant Category Code - OPTIONAL */
  mc?: string;
  
  /** Transaction ID - OPTIONAL */
  tid?: string;
  
  /** Additional parameters for future extensions */
  [key: string]: string | undefined;
}

export interface PartialUpiParams {
  /** Payee Address (Virtual Payment Address) - REQUIRED */
  pa?: string;
  
  /** Payee Name - REQUIRED */
  pn?: string;
  
  /** Amount in INR - OPTIONAL for discovery, REQUIRED for payment */
  am?: string;
  
  /** Currency Code (always INR for UPI) - REQUIRED */
  cu?: string;
  
  /** Transaction Reference ID - OPTIONAL */
  tr?: string;
  
  /** Transaction Note/Description - OPTIONAL */
  tn?: string;
  
  /** URL for additional information - OPTIONAL */
  url?: string;
  
  /** Mode of transaction - OPTIONAL */
  mode?: string;
  
  /** Organization ID for merchant transactions - OPTIONAL */
  orgid?: string;
  
  /** Digital signature - OPTIONAL */
  sign?: string;
  
  /** Merchant Category Code - OPTIONAL */
  mc?: string;
  
  /** Transaction ID - OPTIONAL */
  tid?: string;
  
  /** Additional parameters for future extensions */
  [key: string]: string | undefined;
}

export interface UpiValidationResult {
  isValid: boolean;
  errors: string[];
  normalizedParams: PartialUpiParams;
}

export type UpiAction = 'pay' | 'mandate';

interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  pattern?: RegExp;
  allowedValues?: readonly string[];
  description: string;
}

/**
 * NPCI UPI Parameter validation rules
 */
const VALIDATION_RULES: Record<string, ValidationRule> = {
  pa: {
    required: true,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/,
    description: 'Valid VPA format (user@psp)'
  },
  pn: {
    required: true,
    maxLength: 99,
    description: 'Payee name'
  },
  am: {
    required: false,
    pattern: /^\d+(\.\d{1,2})?$/,
    maxLength: 18,
    description: 'Amount in INR (up to 2 decimal places)'
  },
  cu: {
    required: false,
    allowedValues: ['INR'] as const,
    description: 'Currency code (must be INR)'
  },
  tr: {
    required: false,
    maxLength: 35,
    pattern: /^[a-zA-Z0-9\-]+$/,
    description: 'Transaction reference (alphanumeric with hyphens)'
  },
  tn: {
    required: false,
    maxLength: 100,
    description: 'Transaction note'
  },
  url: {
    required: false,
    maxLength: 200,
    pattern: /^https?:\/\/.+/,
    description: 'Valid HTTP/HTTPS URL'
  },
  mode: {
    required: false,
    maxLength: 20,
    description: 'Transaction mode'
  },
  orgid: {
    required: false,
    maxLength: 20,
    description: 'Organization ID'
  },
  sign: {
    required: false,
    maxLength: 500,
    description: 'Digital signature'
  },
  mc: {
    required: false,
    maxLength: 4,
    pattern: /^\d{4}$/,
    description: 'Merchant Category Code (4 digits)'
  },
  tid: {
    required: false,
    maxLength: 35,
    description: 'Transaction ID'
  }
};

/**
 * Validates UPI parameters according to NPCI specification
 */
export function validateUpiParams(params: PartialUpiParams): UpiValidationResult {
  const errors: string[] = [];
  const normalizedParams: PartialUpiParams = {};

  // Check required fields
  if (!params.pa || typeof params.pa !== 'string' || params.pa.trim() === '') {
    errors.push('Payee Address (pa) is required');
  }

  if (!params.pn || typeof params.pn !== 'string' || params.pn.trim() === '') {
    errors.push('Payee Name (pn) is required');
  }

  // Validate each parameter
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const stringValue = String(value).trim();
    if (stringValue === '') {
      continue;
    }

    const rule = VALIDATION_RULES[key];
    
    if (rule) {
      // Check length
      if (rule.maxLength && stringValue.length > rule.maxLength) {
        errors.push(`${key}: exceeds maximum length of ${rule.maxLength} characters`);
        continue;
      }

      // Check pattern
      if (rule.pattern && !rule.pattern.test(stringValue)) {
        errors.push(`${key}: invalid format. ${rule.description}`);
        continue;
      }

      // Check allowed values
      if (rule.allowedValues && !rule.allowedValues.includes(stringValue)) {
        errors.push(`${key}: must be one of ${rule.allowedValues.join(', ')}`);
        continue;
      }

      normalizedParams[key as keyof PartialUpiParams] = stringValue;
    } else {
      // Unknown parameter - include as-is for forward compatibility
      normalizedParams[key] = stringValue;
    }
  }

  // Set default currency only if amount is provided
  if (normalizedParams.am && !normalizedParams.cu) {
    normalizedParams.cu = 'INR';
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedParams
  };
}

/**
 * Builds a UPI URI from validated parameters
 */
export function buildUpiUri(params: PartialUpiParams, action: UpiAction = 'pay'): string {
  const validation = validateUpiParams(params);
  
  if (!validation.isValid) {
    throw new Error(`Invalid UPI parameters: ${validation.errors.join(', ')}`);
  }

  const queryParams = new URLSearchParams();
  
  // Add parameters in a consistent order for better testing/debugging
  const orderedKeys = ['pa', 'pn', 'am', 'cu', 'tr', 'tn', 'url', 'mode', 'orgid', 'mc', 'tid', 'sign'];
  
  // Add ordered parameters first
  for (const key of orderedKeys) {
    const value = validation.normalizedParams[key as keyof PartialUpiParams];
    if (value !== undefined && value !== '') {
      queryParams.append(key, value);
    }
  }
  
  // Add any additional parameters
  for (const [key, value] of Object.entries(validation.normalizedParams)) {
    if (!orderedKeys.includes(key) && value !== undefined && value !== '') {
      queryParams.append(key, value);
    }
  }

  const queryString = queryParams.toString();
  return `upi://${action}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Parses a UPI URI and extracts parameters
 */
export function parseUpiUri(upiUri: string): { action: UpiAction; params: PartialUpiParams } {
  try {
    const url = new URL(upiUri);
    
    if (url.protocol !== 'upi:') {
      throw new Error('Invalid UPI URI: must start with upi://');
    }

    // For UPI URIs like upi://pay?..., the action is the hostname
    const action = url.hostname as UpiAction;
    if (action !== 'pay' && action !== 'mandate') {
      throw new Error('Invalid UPI action: must be "pay" or "mandate"');
    }

    const params: PartialUpiParams = {};
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value;
    }

    const validation = validateUpiParams(params);
    if (!validation.isValid) {
      throw new Error(`Invalid UPI parameters: ${validation.errors.join(', ')}`);
    }

    return {
      action,
      params: validation.normalizedParams
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to parse UPI URI');
  }
}

/**
 * Utility function to create a UPI payment URI with basic validation
 */
export function createPaymentUri(payeeAddress: string, payeeName: string, amount?: string, note?: string): string {
  const params: PartialUpiParams = {
    pa: payeeAddress,
    pn: payeeName,
    cu: 'INR'
  };

  if (amount) {
    params.am = amount;
  }

  if (note) {
    params.tn = note;
  }

  return buildUpiUri(params, 'pay');
}

/**
 * Utility function to create a UPI mandate URI for recurring payments
 */
export function createMandateUri(
  payeeAddress: string, 
  payeeName: string, 
  amount?: string, 
  note?: string,
  transactionRef?: string
): string {
  const params: PartialUpiParams = {
    pa: payeeAddress,
    pn: payeeName,
    cu: 'INR'
  };

  if (amount) {
    params.am = amount;
  }

  if (note) {
    params.tn = note;
  }

  if (transactionRef) {
    params.tr = transactionRef;
  }

  return buildUpiUri(params, 'mandate');
}