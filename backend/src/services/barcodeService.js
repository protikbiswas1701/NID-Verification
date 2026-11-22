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
 * Convert a Jimp image to luminance bytes and attempt barcode decode.
 * Returns the ZXing Result on success, or throws on failure.
 */
const tryDecode = (img, reader) => {
  const width = img.bitmap.width;
  const height = img.bitmap.height;
  const len = width * height;

  const luminancesUint8Array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    const r = img.bitmap.data[idx];
    const g = img.bitmap.data[idx + 1];
    const b = img.bitmap.data[idx + 2];
    luminancesUint8Array[i] = (r * 306 + g * 601 + b * 117) >> 10;
  }

  const luminanceSource = new RGBLuminanceSource(luminancesUint8Array, width, height);
  const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
  return reader.decode(binaryBitmap);
};

/**
 * Scans an image (specifically NID card back) for 2D PDF417 or QR barcodes.
 * Tries multiple rotations (0°, 90°, 180°, 270°) to handle rotated/angled photos.
 * Returns decoded raw text, extracted NID/demographic parameters if found,
 * and whether a barcode was detected.
 */
export const scanCardBarcode = async (imagePath) => {
  try {
    const img = await Jimp.read(imagePath);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.PDF_417,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_128,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new MultiFormatReader();
    reader.setHints(hints);

    // Try original orientation first, then 90°, 180°, 270° rotations
    const rotations = [0, 90, 180, 270];
    let result = null;

    for (const angle of rotations) {
      try {
        const rotated = angle === 0 ? img.clone() : img.clone().rotate(angle);
        result = tryDecode(rotated, reader);
        if (result) {
          console.log(`Barcode decoded at ${angle}° rotation.`);
          break;
        }
      } catch (_rotErr) {
        // Try next rotation
        continue;
      }
    }

    if (!result) {
      // All rotations failed
      return {
        detected: false,
        format: null,
        rawText: null,
        barcodeNid: null,
        error: 'No barcode found at any rotation (0°, 90°, 180°, 270°)',
      };
    }

    const rawText = result.getText();
    const format = result.getBarcodeFormat();

    // Extract NID number and demographic fields from barcode data
    // In BD NIDs, PDF417 contains <pin>...</pin>, <name>...</name>, <DOB>...</DOB>
    let barcodeNid = null;
    let barcodePin = null;
    let barcodeName = null;
    let barcodeDob = null;

    const pinTagMatch = rawText.match(/<pin>(\d+)<\/pin>/i);
    const nameTagMatch = rawText.match(/<name>([^<]+)<\/name>/i);
    const dobTagMatch = rawText.match(/<DOB>([^<]+)<\/DOB>/i);

    if (pinTagMatch) {
      barcodePin = pinTagMatch[1].trim();
      barcodeNid = barcodePin;
    } else {
      const pinMatch = rawText.match(/(?:NID|PIN)[:\s]*(\d{10,17})/i)
        || rawText.match(/\b\d{17}\b/)
        || rawText.match(/\b\d{10}\b/);
      if (pinMatch) {
        barcodeNid = pinMatch[1] || pinMatch[0];
        barcodePin = barcodeNid;
      }
    }

    if (nameTagMatch) {
      barcodeName = nameTagMatch[1].trim();
    }
    if (dobTagMatch) {
      barcodeDob = dobTagMatch[1].trim();
    }

    return {
      detected: true,
      format: format ? String(format) : 'PDF417',
      rawText,
      barcodeNid,
      barcodePin,
      barcodeName,
      barcodeDob,
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
