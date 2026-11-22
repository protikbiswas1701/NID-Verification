import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  GlobalHistogramBinarizer,
} from '@zxing/library';
import { Jimp } from 'jimp';

/**
 * Attempts decoding a Jimp image using both HybridBinarizer and GlobalHistogramBinarizer.
 */
const tryDecodeImage = (img, reader) => {
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

  // 1. Try HybridBinarizer first (clean high-contrast barcodes)
  try {
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    const res = reader.decode(binaryBitmap);
    if (res) return res;
  } catch (_e) {}

  // 2. Try GlobalHistogramBinarizer (resilient against shadows and gradient lighting)
  try {
    const binaryBitmap = new BinaryBitmap(new GlobalHistogramBinarizer(luminanceSource));
    const res = reader.decode(binaryBitmap);
    if (res) return res;
  } catch (_e) {}

  return null;
};

/**
 * Scans an image (specifically NID card back) for 2D PDF417 or QR barcodes.
 * Tries multiple rotations (0°, 90°, 180°, 270°), dual binarizers, and cropped barcode regions.
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
      BarcodeFormat.CODE_39,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new MultiFormatReader();
    reader.setHints(hints);

    // Pass 1: Try all 4 rotations of the full image
    const rotations = [0, 90, 180, 270];
    let result = null;

    for (const angle of rotations) {
      try {
        const rotated = angle === 0 ? img.clone() : img.clone().rotate(angle);
        result = tryDecodeImage(rotated, reader);
        if (result) {
          console.log(`Barcode decoded on full image at ${angle}° rotation.`);
          break;
        }
      } catch (_rotErr) {
        continue;
      }
    }

    // Pass 2: If not found, try candidate barcode crops (bottom 60% on horizontal, sides on vertical)
    if (!result) {
      for (const angle of rotations) {
        try {
          const rotated = angle === 0 ? img.clone() : img.clone().rotate(angle);
          const rw = rotated.bitmap.width;
          const rh = rotated.bitmap.height;

          // Bottom 60% (where PDF417 resides on BD NID card back)
          const bottomCrop = rotated.clone().crop({
            x: 0,
            y: Math.floor(rh * 0.4),
            w: rw,
            h: Math.floor(rh * 0.6),
          });

          result = tryDecodeImage(bottomCrop, reader);
          if (result) {
            console.log(`Barcode decoded on bottom crop at ${angle}° rotation.`);
            break;
          }
        } catch (_cropErr) {
          continue;
        }
      }
    }

    // Pass 3: If image is high resolution (>1400px), downscale to ~1000px and retry
    if (!result && (img.bitmap.width > 1400 || img.bitmap.height > 1400)) {
      try {
        const scaled = img.clone().resize({ w: 1000 });
        for (const angle of rotations) {
          const rotated = angle === 0 ? scaled.clone() : scaled.clone().rotate(angle);
          result = tryDecodeImage(rotated, reader);
          if (result) {
            console.log(`Barcode decoded on scaled image at ${angle}° rotation.`);
            break;
          }
        }
      } catch (_scaleErr) {}
    }

    if (!result) {
      return {
        detected: false,
        format: null,
        rawText: null,
        barcodeNid: null,
        error: 'No barcode found after multi-angle and candidate region scanning',
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
    return {
      detected: false,
      format: null,
      rawText: null,
      barcodeNid: null,
      error: err.message,
    };
  }
};
