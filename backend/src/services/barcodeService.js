import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from '@zxing/library';
import { Jimp } from 'jimp';

/**
 * Scans an image (specifically NID card back) for 2D PDF417 or QR barcodes.
 * Returns decoded raw text, extracted NID/demographic parameters if found,
 * and whether a barcode was detected.
 */
export const scanCardBarcode = async (imagePath) => {
  try {
    const img = await Jimp.read(imagePath);
    const width = img.bitmap.width;
    const height = img.bitmap.height;
    const len = width * height;

    const luminancesUint8Array = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      const idx = i * 4;
      const r = img.bitmap.data[idx];
      const g = img.bitmap.data[idx + 1];
      const b = img.bitmap.data[idx + 2];
      // Standard luminance
      luminancesUint8Array[i] = (r * 306 + g * 601 + b * 117) >> 10;
    }

    const luminanceSource = new RGBLuminanceSource(luminancesUint8Array, width, height);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.PDF_417,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_128,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new MultiFormatReader();
    reader.setHints(hints);

    const result = reader.decode(binaryBitmap);
    const rawText = result.getText();
    const format = result.getBarcodeFormat();

    // Extract NID number from barcode data if structured
    // In BD NIDs, PDF417 often contains <pin>...</pin> or NID/DOB structures
    let barcodeNid = null;
    const pinMatch = rawText.match(/<pin>(\d+)<\/pin>/i)
      || rawText.match(/(?:NID|PIN)[:\s]*(\d{10,17})/i)
      || rawText.match(/\b\d{10}\b/)
      || rawText.match(/\b\d{17}\b/);
    if (pinMatch) {
      barcodeNid = pinMatch[1] || pinMatch[0];
    }

    return {
      detected: true,
      format: format ? String(format) : 'PDF417',
      rawText,
      barcodeNid,
    };
  } catch (err) {
    // No barcode found or unreadable
    return {
      detected: false,
      format: null,
      rawText: null,
      barcodeNid: null,
      error: err.message,
    };
  }
};
