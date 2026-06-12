/**
 * QR Code Generation for UPI Links
 * Professional QR code generator using qr-creator library
 */
export interface QRCodeOptions {
    /** Size of the QR code in pixels */
    size?: number;
    /** Error correction level */
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    /** Background color (null for transparent) */
    backgroundColor?: string | null;
    /** Foreground color */
    foregroundColor?: string;
    /** Corner radius (0.0 to 0.5) */
    radius?: number;
}
export interface QRCodeResult {
    /** Data URL for the QR code image */
    dataUrl: string;
    /** SVG string for the QR code */
    svg: string;
    /** Original text that was encoded */
    text: string;
    /** Size of the generated QR code */
    size: number;
}
/**
 * Generate QR code using qr-creator library
 */
export declare function generateQRCode(upiUri: string, options?: QRCodeOptions): QRCodeResult;
/**
 * Generate QR code as Canvas (for download)
 */
export declare function generateQRCanvas(upiUri: string, options?: QRCodeOptions): HTMLCanvasElement | null;
/**
 * Download QR code as PNG image
 */
export declare function downloadQRCode(upiUri: string, filename?: string, options?: QRCodeOptions): void;
/**
 * Generate QR code with UPI branding and styling
 */
export declare function generateBrandedQRCode(upiUri: string, options?: QRCodeOptions & {
    /** Show UPI logo in center */
    showLogo?: boolean;
    /** Custom title text */
    title?: string;
}): QRCodeResult;
/**
 * Server-safe QR code generation (returns base64 data URL)
 */
export declare function generateQRCodeServer(upiUri: string, options?: QRCodeOptions): {
    dataUrl: string;
    text: string;
    size: number;
};
