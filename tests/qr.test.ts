/**
 * QR Code Generation Tests
 * Tests for the QR code generation functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateQRCode, generateQRCanvas, downloadQRCode, generateQRCodeServer } from '../src/qr/encoder.js';

// Mock qr-creator for testing
vi.mock('qr-creator', () => ({
  default: {
    render: vi.fn((config, element) => {
      // Mock the render method
      if (element.tagName === 'CANVAS') {
        // Mock canvas rendering
        const ctx = element.getContext('2d');
        if (ctx) {
          ctx.fillStyle = config.background || 'white';
          ctx.fillRect(0, 0, config.size, config.size);
          ctx.fillStyle = config.fill || 'black';
          // Draw a simple test pattern
          ctx.fillRect(10, 10, 20, 20);
        }
      } else if (element.tagName === 'DIV') {
        // Mock SVG creation
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', config.size.toString());
        svg.setAttribute('height', config.size.toString());
        svg.innerHTML = `<rect width="${config.size}" height="${config.size}" fill="${config.background || 'white'}"/>`;
        element.appendChild(svg);
      }
    })
  }
}));

// Mock DOM methods
beforeEach(() => {
  global.document = {
    createElement: vi.fn((tagName) => {
      if (tagName === 'canvas') {
        const canvas = {
          tagName: 'CANVAS',
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage: vi.fn()
          })),
          toDataURL: vi.fn(() => 'data:image/png;base64,mock-data-url')
        };
        return canvas;
      } else if (tagName === 'div') {
        const div = {
          tagName: 'DIV',
          appendChild: vi.fn(),
          querySelector: vi.fn(() => ({
            outerHTML: '<svg width="200" height="200"><rect width="200" height="200" fill="white"/></svg>'
          }))
        };
        return div;
      } else if (tagName === 'a') {
        return {
          download: '',
          href: '',
          click: vi.fn()
        };
      }
      return {};
    }),
    createElementNS: vi.fn(() => ({
      setAttribute: vi.fn(),
      innerHTML: ''
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  } as any;

  global.btoa = vi.fn((str) => Buffer.from(str).toString('base64'));
});

describe('QR Code Generation', () => {
  const testUpiUri = 'upi://pay?pa=test@upi&pn=Test&am=100&cu=INR';

  it('should generate QR code with default options', () => {
    const result = generateQRCode(testUpiUri);
    
    expect(result).toBeDefined();
    expect(result.text).toBe(testUpiUri);
    expect(result.size).toBe(200); // default size
    expect(result.dataUrl).toContain('data:image/png;base64,');
    expect(result.svg).toContain('<svg');
  });

  it('should generate QR code with custom options', () => {
    const options = {
      size: 300,
      errorCorrectionLevel: 'H' as const,
      backgroundColor: '#ffffff',
      foregroundColor: '#000000',
      radius: 0.2
    };

    const result = generateQRCode(testUpiUri, options);
    
    expect(result.size).toBe(300);
    expect(result.text).toBe(testUpiUri);
    expect(result.dataUrl).toBeDefined();
    expect(result.svg).toBeDefined();
  });

  it('should generate QR canvas for download', () => {
    const canvas = generateQRCanvas(testUpiUri);
    
    expect(canvas).toBeDefined();
    expect(canvas?.width).toBe(200);
    expect(canvas?.height).toBe(200);
  });

  it('should return null for generateQRCanvas in server environment', () => {
    // Temporarily remove document to simulate server environment
    const originalDocument = global.document;
    delete (global as any).document;
    
    const canvas = generateQRCanvas(testUpiUri);
    expect(canvas).toBeNull();
    
    // Restore document
    global.document = originalDocument;
  });

  it('should handle download QR code', () => {
    // Mock canvas with proper methods
    const mockCanvas = {
      width: 200,
      height: 200,
      toDataURL: vi.fn(() => 'data:image/png;base64,mock-canvas-data')
    };

    vi.mocked(global.document.createElement).mockReturnValueOnce(mockCanvas as any);

    downloadQRCode(testUpiUri, 'test-qr.png');
    
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
  });

  it('should generate server-safe QR code', () => {
    const result = generateQRCodeServer(testUpiUri, { size: 150 });
    
    expect(result.text).toBe(testUpiUri);
    expect(result.size).toBe(150);
    expect(result.dataUrl).toContain('data:image/svg+xml;base64,');
  });

  it('should handle QR code with transparent background', () => {
    const result = generateQRCode(testUpiUri, {
      backgroundColor: null,
      foregroundColor: '#ff0000'
    });
    
    expect(result).toBeDefined();
    expect(result.text).toBe(testUpiUri);
  });

  it('should validate error correction levels', () => {
    const levels: Array<'L' | 'M' | 'Q' | 'H'> = ['L', 'M', 'Q', 'H'];
    
    levels.forEach(level => {
      const result = generateQRCode(testUpiUri, {
        errorCorrectionLevel: level
      });
      
      expect(result).toBeDefined();
      expect(result.text).toBe(testUpiUri);
    });
  });

  it('should handle different UPI URI formats', () => {
    const testUris = [
      'upi://pay?pa=test@upi&pn=Test',
      'upi://mandate?pa=test@upi&pn=Test&am=100&tr=MANDATE123',
      'upi://pay?pa=merchant@paytm&pn=Merchant&am=99.50&cu=INR&tn=Payment'
    ];

    testUris.forEach(uri => {
      const result = generateQRCode(uri);
      expect(result.text).toBe(uri);
      expect(result.dataUrl).toBeDefined();
      expect(result.svg).toBeDefined();
    });
  });
});