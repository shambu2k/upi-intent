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
/**
 * Validates UPI parameters according to NPCI specification
 */
export declare function validateUpiParams(params: PartialUpiParams): UpiValidationResult;
/**
 * Builds a UPI URI from validated parameters
 */
export declare function buildUpiUri(params: PartialUpiParams, action?: UpiAction): string;
/**
 * Parses a UPI URI and extracts parameters
 */
export declare function parseUpiUri(upiUri: string): {
    action: UpiAction;
    params: PartialUpiParams;
};
/**
 * Utility function to create a UPI payment URI with basic validation
 */
export declare function createPaymentUri(payeeAddress: string, payeeName: string, amount?: string, note?: string): string;
/**
 * Utility function to create a UPI mandate URI for recurring payments
 */
export declare function createMandateUri(payeeAddress: string, payeeName: string, amount?: string, note?: string, transactionRef?: string): string;
