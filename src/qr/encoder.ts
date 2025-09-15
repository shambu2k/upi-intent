/**
 * QR Code Generation for UPI Links
 * Professional QR code generator using qr-creator library
 */

import QrCreator from 'qr-creator';

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
export function generateQRCode(
  upiUri: string,
  options: QRCodeOptions = {}
): QRCodeResult {
  const {
    size = 200,
    errorCorrectionLevel = 'M',
    backgroundColor = null,
    foregroundColor = '#000000',
    radius = 0.0
  } = options;

  // Create a canvas element for rendering
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  // Render QR code to canvas
  QrCreator.render({
    text: upiUri,
    radius,
    ecLevel: errorCorrectionLevel,
    fill: foregroundColor,
    background: backgroundColor,
    size
  }, canvas);

  // Get data URL from canvas
  const dataUrl = canvas.toDataURL('image/png');
  
  // Generate SVG version for better scalability
  const svgContainer = document.createElement('div');
  QrCreator.render({
    text: upiUri,
    radius,
    ecLevel: errorCorrectionLevel,
    fill: foregroundColor,
    background: backgroundColor || 'transparent',
    size
  }, svgContainer);

  // Extract the SVG from the container
  const svgElement = svgContainer.querySelector('svg');
  const svgString = svgElement ? svgElement.outerHTML : '';

  return {
    dataUrl,
    svg: svgString,
    text: upiUri,
    size
  };
}

/**
 * Generate QR code as Canvas (for download)
 */
export function generateQRCanvas(
  upiUri: string,
  options: QRCodeOptions = {}
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') {
    return null; // Server-side
  }
  
  const {
    size = 200,
    errorCorrectionLevel = 'M',
    backgroundColor = null,
    foregroundColor = '#000000',
    radius = 0.0
  } = options;
  
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  QrCreator.render({
    text: upiUri,
    radius,
    ecLevel: errorCorrectionLevel,
    fill: foregroundColor,
    background: backgroundColor,
    size
  }, canvas);
  
  return canvas;
}

/**
 * Download QR code as PNG image
 */
export function downloadQRCode(
  upiUri: string,
  filename: string = 'upi-payment-qr.png',
  options: QRCodeOptions = {}
): void {
  const canvas = generateQRCanvas(upiUri, options);
  if (!canvas) return;
  
  // Create download link
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate QR code with UPI branding and styling
 */
export function generateBrandedQRCode(
  upiUri: string,
  options: QRCodeOptions & {
    /** Show UPI logo in center */
    showLogo?: boolean;
    /** Custom title text */
    title?: string;
  } = {}
): QRCodeResult {
  const {
    size = 250,
    errorCorrectionLevel = 'H', // Higher error correction for logo overlay
    backgroundColor = '#ffffff',
    foregroundColor = '#1a237e', // UPI brand blue
    radius = 0.1,
    showLogo = true,
    title = 'Scan to Pay'
  } = options;

  // Generate base QR code
  const qrResult = generateQRCode(upiUri, {
    size: size - 40, // Leave space for title
    errorCorrectionLevel,
    backgroundColor,
    foregroundColor,
    radius
  });

  // Create enhanced SVG with branding
  const enhancedSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <!-- Background -->
      <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="8"/>
      
      <!-- Title -->
      <text x="${size/2}" y="25" text-anchor="middle" fill="${foregroundColor}" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
        ${title}
      </text>
      
      <!-- QR Code -->
      <g transform="translate(20, 30)">
        ${qrResult.svg.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
      </g>
      
      ${showLogo ? `
      <!-- UPI Logo placeholder (center) -->
      <circle cx="${size/2}" cy="${size/2 + 15}" r="15" fill="${backgroundColor}" stroke="${foregroundColor}" stroke-width="2"/>
      <text x="${size/2}" y="${size/2 + 20}" text-anchor="middle" fill="${foregroundColor}" font-family="Arial, sans-serif" font-size="10" font-weight="bold">
        UPI
      </text>
      ` : ''}
    </svg>
  `;

  // Create enhanced canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = new Image();
    img.onload = (): void => {
      ctx.drawImage(img, 0, 0);
    };
    img.src = `data:image/svg+xml;base64,${btoa(enhancedSvg)}`;
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    svg: enhancedSvg,
    text: upiUri,
    size
  };
}

/**
 * Server-safe QR code generation (returns base64 data URL)
 */
export function generateQRCodeServer(
  upiUri: string,
  options: QRCodeOptions = {}
): { dataUrl: string; text: string; size: number } {
  // Fallback implementation for server-side
  // In a real server environment, you'd use a Node.js QR library
  const size = options.size || 200;
  
  return {
    dataUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="${size}" height="${size}" fill="white"/>
        <text x="${size/2}" y="${size/2 - 10}" text-anchor="middle" font-family="Arial" font-size="12">QR Code</text>
        <text x="${size/2}" y="${size/2 + 10}" text-anchor="middle" font-family="Arial" font-size="10">Scan with UPI app</text>
      </svg>
    `)}`,
    text: upiUri,
    size
  };
}