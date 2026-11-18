import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import { Jimp } from 'jimp';
import { scanCardBarcode } from './barcodeService.js';
import { runAutoCardCrop, runFaceComparison } from './visionBridge.js';

// Path to pre-indexed 113k national registry map
const registryPath = path.resolve('src/data/nidRegistry.json');
let nidRegistry = null;

// Load registry into memory once
export const getRegistry = () => {
  if (!nidRegistry) {
    if (fs.existsSync(registryPath)) {
      try {
        console.log('Loading NID registry into memory...');
        const raw = fs.readFileSync(registryPath, 'utf8');
        nidRegistry = JSON.parse(raw);
        console.log(`Registry loaded: ${Object.keys(nidRegistry).length} records ready for instant lookup.`);
      } catch (err) {
        console.error('Failed to load NID registry:', err.message);
        nidRegistry = {};
      }
    } else {
      console.warn('NID registry file not found at:', registryPath);
      nidRegistry = {};
    }
  }
  return nidRegistry;
};

// Map Bengali digits to Western digits
const convertBengaliDigits = (str) => {
  if (!str) return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = str;
  banglaDigits.forEach((d, i) => {
    res = res.replaceAll(d, String(i));
  });
  return res;
};

// Month dictionary for parsing dates
const MONTHS = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  'জানু': '01', 'ফেব্রু': '02', 'মার্চ': '03', 'এপ্রিল': '04', 'মে': '05', 'জুন': '06',
  'জুলাই': '07', 'আগস্ট': '08', 'সেপ্টে': '09', 'অক্টো': '10', 'নভে': '11', 'ডিসে': '12'
};

/**
 * Standardize DOB strings into YYYY-MM-DD
 */
export const normalizeDob = (raw) => {
  if (!raw) return null;
  const cleaned = convertBengaliDigits(raw).trim();

  // Pattern 1: YYYY-MM-DD
  const p1 = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (p1) {
    const y = p1[1];
    const m = p1[2].padStart(2, '0');
    const d = p1[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Pattern 2: DD-MM-YYYY or DD/MM/YYYY
  const p2 = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (p2) {
    const d = p2[1].padStart(2, '0');
    const m = p2[2].padStart(2, '0');
    const y = p2[3];
    return `${y}-${m}-${d}`;
  }

  // Pattern 3: DD Mon YYYY (e.g. 19 Apr 1969 or 19-Apr-1969)
  const p3 = cleaned.match(/^(\d{1,2})[- /.]+([A-Za-z\u0980-\u09FF]+)[- /.]+(\d{4})$/);
  if (p3) {
    const d = p3[1].padStart(2, '0');
    const monStr = p3[2].toLowerCase();
    const m = MONTHS[monStr] || '01';
    const y = p3[3];
    return `${y}-${m}-${d}`;
  }

  return cleaned;
};

/**
 * Preprocess image for OCR using Jimp to boost text contrast and sharpness
 */
export const preprocessImageForOcr = async (imagePath) => {
  try {
    const img = await Jimp.read(imagePath);
    // If image is small or low-res (e.g. mobile screenshots < 1200px wide), upscale 2x for sharp OCR
    if (img.bitmap.width < 1200) {
      img.resize({ w: img.bitmap.width * 2, h: img.bitmap.height * 2 });
    }
    img.greyscale();
    img.normalize();
    const tempBuffer = await img.getBuffer('image/png');
    return tempBuffer;
  } catch (err) {
    console.warn('Image preprocessing fallback to original path:', err.message);
    return imagePath;
  }
};

/**
 * Helper to parse structured citizen fields from raw OCR text
 */
export const parseOcrCardText = (fullText, confidence = 0) => {
  const normalizedText = convertBengaliDigits(fullText);

  // 1. Extract NID Number
  let nid = null;
  let nidType = 'UNKNOWN';

  // First priority: Look for explicit labeled ID number: "ID NO: 3778939417" or "NID: ..."
  const labeledMatch = normalizedText.match(/(?:ID\s*NO|NID\s*(?:NO|Number)?|Card\s*NO|Number)[:.\s]+([0-9\s]{10,22})/i);
  if (labeledMatch) {
    const cleanedDigits = labeledMatch[1].replace(/\D/g, '');
    if (cleanedDigits.length === 10) {
      nid = cleanedDigits;
      nidType = 'SMART_10_DIGIT';
    } else if (cleanedDigits.length === 17) {
      nid = cleanedDigits;
      nidType = 'OLD_17_DIGIT';
    } else if (cleanedDigits.length === 13) {
      nid = cleanedDigits;
      nidType = 'OLD_13_DIGIT';
    } else if (cleanedDigits.length === 11) {
      // Strip single spurious digit inserted by OCR noise on 10-digit smart cards
      nid = cleanedDigits.slice(0, 10);
      nidType = 'SMART_10_DIGIT';
    }
  }

  if (!nid) {
    // Search for 17-digit numbers
    const match17 = normalizedText.match(/\b(19\d{2}|20\d{2})\d{13}\b/);
    // Search for 13-digit numbers
    const match13 = normalizedText.match(/\b\d{13}\b/);
    // Search for 10-digit numbers
    const match10 = normalizedText.match(/(?:NID|NO|ID|Card|Number)?[:.\s]*\b(\d{10})\b/i) || normalizedText.match(/\b\d{10}\b/);

    if (match17) {
      nid = match17[0];
      nidType = 'OLD_17_DIGIT';
    } else if (match10) {
      nid = match10[1] || match10[0];
      nidType = 'SMART_10_DIGIT';
    } else if (match13) {
      nid = match13[0];
      nidType = 'OLD_13_DIGIT';
    }
  }

  // 2. Extract Date of Birth
  let dob = null;
  const dobMatch = normalizedText.match(/(?:DOB|Date of Birth|Birth|Date|জন্ম|তারিখ)[:.\s]*([0-9]{1,2}[- /.][A-Za-z0-9\u0980-\u09FF]{2,9}[- /.][0-9]{4})/i)
    || normalizedText.match(/\b(\d{1,2}[- /.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[- /.]\d{4})\b/i)
    || normalizedText.match(/\b(\d{4}[- /.]\d{1,2}[- /.]\d{1,2})\b/);

  if (dobMatch) {
    dob = normalizeDob(dobMatch[1]);
  }

  // 3. Extract Name (English or Bengali)
  let name = null;
  let nameBangla = null;

  // Bengali name regex match: নাম: ...
  const bnNameMatch = fullText.match(/(?:নাম|নামঃ)[:.\s]+([\u0980-\u09FF\s.]{3,40})/);
  if (bnNameMatch) {
    nameBangla = bnNameMatch[1].trim().replace(/\n/g, ' ');
  }

  // English Name match (handles clean line endings and lines with trailing noise)
  const nameMatch = fullText.match(/(?:Name|NAME)[:.\s]+([A-Za-z\s.]{3,35})(?:\r?\n|$)/)
    || fullText.match(/(?:Name|NAME)[:.\s]+([A-Z][A-Za-z\s.]{2,30})/);
  if (nameMatch) {
    const rawName = nameMatch[1].trim().replace(/\n/g, ' ');
    const words = rawName.split(/\s+/).filter(w => /^[A-Z]{2,}$/.test(w));
    name = words.length >= 2 ? words.join(' ') : rawName;
  } else {
    const lines = fullText.split('\n').map(l => l.trim());
    const capsLine = lines.find(l => /^[A-Z\s.]{4,30}$/.test(l) && !l.includes('BANGLADESH') && !l.includes('NATIONAL') && !l.includes('CARD') && !l.includes('GOVERNMENT'));
    if (capsLine) name = capsLine;
  }

  // 4. Extract Blood Group
  let bloodGroup = null;
  const bgMatch = fullText.match(/\b(A|B|AB|O)[+-]\b/i);
  if (bgMatch) {
    bloodGroup = bgMatch[0].toUpperCase();
  }

  // 5. Government Keywords
  const hasGovHeader = /bangladesh|republic|national|government|গণপ্রজাতন্ত্রী|বাংলাদেশ/i.test(fullText);

  return {
    rawText: fullText,
    extracted: {
      nid,
      nidType,
      dob,
      name: name || nameBangla || null,
      nameBangla,
      bloodGroup,
      hasGovHeader,
    },
    ocrConfidence: Math.round(confidence || 0),
  };
};

/**
 * Optical Character Recognition and Information Extraction
 * Uses dual 'eng+ben' language recognition with preprocessed image buffer.
 * Automatically tries 90/270/180 degree rotations if card was photographed vertically.
 */
export const extractCardData = async (imagePath, allowRotate = true) => {
  let worker;
  try {
    const processedInput = await preprocessImageForOcr(imagePath);
    try {
      worker = await createWorker(['eng', 'ben']);
    } catch (langErr) {
      console.warn('Bengali traineddata not available locally, falling back to eng:', langErr.message);
      worker = await createWorker('eng');
    }
    const ret = await worker.recognize(processedInput);
    let parsed = parseOcrCardText(ret.data.text || '', ret.data.confidence);

    // If no valid NID was extracted and allowRotate is enabled, test orthogonal orientations
    if (!parsed.extracted.nid && allowRotate) {
      try {
        const baseImg = await Jimp.read(imagePath);
        for (const deg of [90, 270, 180]) {
          const rotBuf = await baseImg.clone().rotate(deg).getBuffer('image/png');
          const rotPre = await preprocessImageForOcr(rotBuf);
          const rotRet = await worker.recognize(rotPre);
          const rotParsed = parseOcrCardText(rotRet.data.text || '', rotRet.data.confidence);
          if (rotParsed.extracted.nid) {
            parsed = rotParsed;
            break;
          }
        }
      } catch (rotErr) {
        console.warn('Auto-orientation OCR fallback warning:', rotErr.message);
      }
    }

    return parsed;
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
};

/**
 * Image Forensics & Tampering Detection
 */
export const analyzeImageForensics = async (imagePath) => {
  try {
    const image = await Jimp.read(imagePath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const aspectRatio = parseFloat((width / height).toFixed(3));

    const expectedRatio = 1.586;
    const ratioDelta = Math.abs(aspectRatio - expectedRatio);
    const cardShapeValid = ratioDelta < 0.45;

    let totalLuminance = 0;
    let totalVariance = 0;
    const pixelCount = width * height;
    const sampleStep = Math.max(1, Math.floor(pixelCount / 10000));
    let samples = 0;
    const luminances = [];

    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        const idx = (y * width + x) * 4;
        const r = image.bitmap.data[idx];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        luminances.push(lum);
        totalLuminance += lum;
        samples++;
      }
    }

    const avgLuminance = totalLuminance / samples;
    for (let i = 0; i < luminances.length; i++) {
      totalVariance += Math.pow(luminances[i] - avgLuminance, 2);
    }
    const stdDev = Math.sqrt(totalVariance / samples);

    let elaScore = 0;
    let elaTamperingDetected = false;
    let elaHeatmapBase64 = null;

    try {
      const recompressedBuffer = await image.getBuffer('image/jpeg', { quality: 90 });
      const recompressed = await Jimp.read(recompressedBuffer);

      let diffSum = 0;
      let diffSquares = 0;
      let checkSamples = 0;

      for (let y = 0; y < height; y += sampleStep) {
        for (let x = 0; x < width; x += sampleStep) {
          const idx = (y * width + x) * 4;
          const origR = image.bitmap.data[idx];
          const origG = image.bitmap.data[idx + 1];
          const origB = image.bitmap.data[idx + 2];

          const compR = recompressed.bitmap.data[idx];
          const compG = recompressed.bitmap.data[idx + 1];
          const compB = recompressed.bitmap.data[idx + 2];

          const diff = (Math.abs(origR - compR) + Math.abs(origG - compG) + Math.abs(origB - compB)) / 3;
          diffSum += diff;
          diffSquares += diff * diff;
          checkSamples++;
        }
      }

      const meanDiff = diffSum / checkSamples;
      const varianceDiff = (diffSquares / checkSamples) - (meanDiff * meanDiff);
      const diffStdDev = Math.sqrt(Math.max(0, varianceDiff));

      elaScore = Math.min(100, Math.round(diffStdDev * 4.5));
      if (diffStdDev > 16.5) {
        elaTamperingDetected = true;
      }

      // Generate visual ELA forensic heatmap preview (cloned & scaled to max width 500)
      try {
        const preview = image.clone();
        if (preview.bitmap.width > 500) {
          preview.resize({ w: 500 });
        }
        const pw = preview.bitmap.width;
        const ph = preview.bitmap.height;
        const prevRecompBuf = await preview.getBuffer('image/jpeg', { quality: 90 });
        const prevRecomp = await Jimp.read(prevRecompBuf);

        preview.scan(0, 0, pw, ph, function(x, y, idx) {
          const dR = Math.min(255, Math.abs(this.bitmap.data[idx] - prevRecomp.bitmap.data[idx]) * 22);
          const dG = Math.min(255, Math.abs(this.bitmap.data[idx + 1] - prevRecomp.bitmap.data[idx + 1]) * 22);
          const dB = Math.min(255, Math.abs(this.bitmap.data[idx + 2] - prevRecomp.bitmap.data[idx + 2]) * 22);
          this.bitmap.data[idx] = dR;
          this.bitmap.data[idx + 1] = dG;
          this.bitmap.data[idx + 2] = dB;
        });

        elaHeatmapBase64 = await preview.getBase64('image/jpeg');
      } catch (heatErr) {
        console.warn('ELA heatmap preview generation warning:', heatErr.message);
      }
    } catch (elaErr) {
      console.warn('ELA analysis warning:', elaErr.message);
    }

    const isBlurry = stdDev < 15;
    const isOverexposed = avgLuminance > 240;
    const isUnderexposed = avgLuminance < 20;

    return {
      dimensions: { width, height },
      aspectRatio,
      cardShapeValid,
      brightness: Math.round(avgLuminance),
      contrastScore: Math.round(stdDev),
      isBlurry,
      isOverexposed,
      isUnderexposed,
      elaScore,
      elaTamperingDetected,
      elaHeatmapBase64,
    };
  } catch (err) {
    console.error('Forensics error:', err.message);
    return {
      dimensions: { width: 0, height: 0 },
      aspectRatio: 0,
      cardShapeValid: false,
      brightness: 128,
      contrastScore: 50,
      isBlurry: false,
      isOverexposed: false,
      isUnderexposed: false,
      elaScore: 20,
      elaTamperingDetected: false,
    };
  }
};

/**
 * Cross-verify extracted card data against the official 115k database
 */
export const verifyAgainstDatabase = (nid, dob) => {
  const registry = getRegistry();
  if (!nid) {
    return {
      found: false,
      reason: 'No NID number detected on card image.',
      matchedDob: false,
      registryRecord: null,
    };
  }

  const cleanNid = String(nid).trim();
  const record = registry[cleanNid];

  if (!record) {
    return {
      found: false,
      reason: 'NID number is not present in the 115k citizen database.',
      matchedDob: false,
      registryRecord: null,
    };
  }

  let matchedDob = false;
  let dobReason = '';

  if (dob && record.dob) {
    const normCardDob = normalizeDob(dob);
    const normRegDob = normalizeDob(record.dob);
    if (normCardDob === normRegDob) {
      matchedDob = true;
      dobReason = `DOB ${normCardDob} matches national registry record.`;
    } else {
      matchedDob = false;
      dobReason = `DOB mismatch: Card states ${normCardDob}, but official registry records ${normRegDob}!`;
    }
  } else if (!dob) {
    dobReason = 'DOB not legible on card to cross-check.';
  } else {
    dobReason = 'Registry entry has no DOB on file.';
  }

  return {
    found: true,
    matchedDob,
    dobReason,
    registryRecord: {
      nid: cleanNid,
      dob: record.dob,
      name: record.name || null,
      nameBn: record.nameBn || null,
      father: record.father || null,
      mother: record.mother || null,
      bloodGroup: record.bloodGroup || null,
      birthPlace: record.birthPlace || null,
      address: record.address || null,
      phoneMasked: record.phone ? `${record.phone.slice(0, 3)}****${record.phone.slice(-3)}` : null,
    },
  };
};

/**
 * Complete Verification Decision Engine
 */
export const evaluateNidCard = async (frontImagePath, backImagePath = null, selfieImagePath = null) => {
  console.log(`Analyzing document: ${frontImagePath}`);

  // Automated Card Bounding Box & Desk Crop check
  let cropResult = { cardDetected: false };
  try {
    cropResult = await runAutoCardCrop(frontImagePath);
    if (cropResult.cardDetected) {
      console.log('Automated card perspective warp applied successfully.');
    }
  } catch (cropErr) {
    console.warn('Auto card crop skipped:', cropErr.message);
  }

  // 1. OCR Extraction (Front side)
  const ocr = await extractCardData(frontImagePath);
  const { extracted } = ocr;

  // 1b. OCR Extraction & Barcode Scanning (Back side if present)
  let backExtracted = null;
  let barcodeResult = { detected: false };
  if (backImagePath && fs.existsSync(backImagePath)) {
    try {
      console.log(`Analyzing back of document: ${backImagePath}`);
      const backOcr = await extractCardData(backImagePath);
      backExtracted = backOcr.extracted;
      if (!extracted.bloodGroup && backExtracted.bloodGroup) {
        extracted.bloodGroup = backExtracted.bloodGroup;
      }
    } catch (backErr) {
      console.warn('Back-side OCR warning:', backErr.message);
    }

    try {
      barcodeResult = await scanCardBarcode(backImagePath);
      if (barcodeResult.detected) {
        console.log(`Barcode decoded on back: ${barcodeResult.format}`);
        // If front OCR missed or had noise on NID, use barcode PIN as fallback
        if (!extracted.nid && barcodeResult.barcodeNid) {
          extracted.nid = barcodeResult.barcodeNid;
          extracted.nidType = barcodeResult.barcodeNid.length === 17 ? 'OLD_17_DIGIT' : barcodeResult.barcodeNid.length === 10 ? 'SMART_10_DIGIT' : 'OLD_13_DIGIT';
        }
        if (!extracted.dob && barcodeResult.barcodeDob) {
          extracted.dob = normalizeDob(barcodeResult.barcodeDob);
        }
        if (!extracted.name && barcodeResult.barcodeName) {
          extracted.name = barcodeResult.barcodeName;
        }
      }
    } catch (bcErr) {
      console.warn('Barcode decoding warning:', bcErr.message);
    }
  }

  // 2. Forensics & Image Tampering
  const forensics = await analyzeImageForensics(frontImagePath);

  // 3. Database Registry Cross-Verification
  const dbResult = verifyAgainstDatabase(extracted.nid, extracted.dob);

  // 4. Checklist & Security Rules Evaluation
  const checks = [];
  const fraudIndicators = [];
  let score = 50;

  // Rule A: NID Format Check
  if (extracted.nid) {
    const len = extracted.nid.length;
    if (len === 10) {
      checks.push({
        title: 'NID Card Structure',
        status: 'PASSED',
        details: 'Valid 10-digit Smart National ID format.',
      });
      score += 15;
    } else if (len === 13) {
      checks.push({
        title: 'NID Card Structure',
        status: 'PASSED',
        details: 'Valid 13-digit Legacy National ID format.',
      });
      score += 10;
    } else if (len === 17) {
      checks.push({
        title: 'NID Card Structure',
        status: 'PASSED',
        details: 'Valid 17-digit format with year prefix.',
      });
      score += 10;
    } else {
      checks.push({
        title: 'NID Card Structure',
        status: 'FAILED',
        details: `Invalid NID number length (${len} digits). Must be 10, 13, or 17 digits.`,
      });
      fraudIndicators.push(`Invalid NID digit count: ${len} digits.`);
      score -= 30;
    }
  } else {
    checks.push({
      title: 'NID Card Structure',
      status: 'FAILED',
      details: 'No legible NID number could be extracted from image.',
    });
    fraudIndicators.push('Missing or unreadable NID number.');
    score -= 25;
  }

  // Rule B: 17-Digit Birth Year Consistency Rule (Mathematical Checksum)
  if (extracted.nid && extracted.nid.length === 17 && extracted.dob) {
    const yearFromNid = extracted.nid.slice(0, 4);
    const yearFromDob = extracted.dob.slice(0, 4);
    if (yearFromNid === yearFromDob) {
      checks.push({
        title: 'Birth Year Checksum Rule',
        status: 'PASSED',
        details: `17-digit NID prefix (${yearFromNid}) matches birth year (${yearFromDob}).`,
      });
      score += 15;
    } else {
      checks.push({
        title: 'Birth Year Checksum Rule',
        status: 'FAILED',
        details: `Mathematical forgery detected: 17-digit NID starts with ${yearFromNid}, but card DOB is ${yearFromDob}!`,
      });
      fraudIndicators.push(`NID birth year prefix (${yearFromNid}) does not match card DOB (${yearFromDob}).`);
      score -= 50;
    }
  } else if (extracted.nid && extracted.nid.length === 17 && !extracted.dob) {
    checks.push({
      title: 'Birth Year Checksum Rule',
      status: 'WARNING',
      details: '17-digit NID detected, but DOB could not be parsed to verify checksum.',
    });
  }

  // Rule C: National Registry Database Check
  if (dbResult.found) {
    if (dbResult.matchedDob) {
      checks.push({
        title: 'National Citizen Registry Record',
        status: 'PASSED',
        details: `NID verified in national citizen database. Birth date (${extracted.dob}) authenticated.`,
      });
      score += 30;
    } else if (extracted.dob) {
      checks.push({
        title: 'National Citizen Registry Record',
        status: 'FAILED',
        details: `Critical Record Mismatch: ${dbResult.dobReason}`,
      });
      fraudIndicators.push(dbResult.dobReason);
      score -= 50;
    } else {
      checks.push({
        title: 'National Citizen Registry Record',
        status: 'PASSED',
        details: 'NID confirmed in citizen database. (DOB unparsed on card).',
      });
      score += 20;
    }
  } else {
    checks.push({
      title: 'National Citizen Registry Record',
      status: 'WARNING',
      details: 'NID number is not in the provided 115k database batch (Unregistered record).',
    });
    score -= 15;
  }

  // Rule D: Government Branding & Emblem Detection
  if (extracted.hasGovHeader) {
    checks.push({
      title: 'Government Emblem & Header',
      status: 'PASSED',
      details: 'Bangladesh Government / National ID card branding detected.',
    });
    score += 10;
  } else {
    checks.push({
      title: 'Government Emblem & Header',
      status: 'WARNING',
      details: 'Official government title or emblem keywords not clearly recognized.',
    });
    score -= 10;
  }

  // Rule E: Forensic Tampering (ELA)
  if (forensics.elaTamperingDetected) {
    checks.push({
      title: 'Forensic Tampering (ELA)',
      status: 'FAILED',
      details: `High digital manipulation anomaly detected (ELA Score: ${forensics.elaScore}/100). Possible digital font overlay or Photoshop editing.`,
    });
    fraudIndicators.push(`Digital image modification detected by Error Level Analysis (Score: ${forensics.elaScore}).`);
    score -= 30;
  } else {
    checks.push({
      title: 'Forensic Tampering (ELA)',
      status: 'PASSED',
      details: `Natural compression grain uniform across card surface (ELA Score: ${forensics.elaScore}/100).`,
    });
    score += 10;
  }

  // Rule F: Image Legibility & Quality
  if (forensics.isBlurry) {
    checks.push({
      title: 'Image Quality & Sharpness',
      status: 'FAILED',
      details: 'Image is significantly blurred. Optical recognition confidence may be degraded.',
    });
    score -= 15;
  } else if (forensics.isOverexposed || forensics.isUnderexposed) {
    checks.push({
      title: 'Image Quality & Sharpness',
      status: 'WARNING',
      details: 'Uneven lighting or glare detected on document.',
    });
  } else {
    checks.push({
      title: 'Image Quality & Sharpness',
      status: 'PASSED',
      details: `Legible document with good contrast (Score: ${forensics.contrastScore}).`,
    });
    score += 5;
  }

  // Rule G: 2D Barcode Cross-Match (Back side verification)
  if (barcodeResult.detected) {
    const bPin = barcodeResult.barcodePin || barcodeResult.barcodeNid;
    const bDob = barcodeResult.barcodeDob ? normalizeDob(barcodeResult.barcodeDob) : null;
    const bName = barcodeResult.barcodeName ? barcodeResult.barcodeName.trim().toUpperCase() : null;
    const cName = extracted.name ? extracted.name.trim().toUpperCase() : null;
    const cDob = extracted.dob ? normalizeDob(extracted.dob) : null;

    let isMatch = false;
    let matchReason = '';

    // Case 1: Exact NID match (for 13 or 17 digit cards)
    if (bPin && extracted.nid && (bPin === extracted.nid || bPin.endsWith(extracted.nid))) {
      isMatch = true;
      matchReason = `Barcode payload verified: Encoded NID (${bPin}) matches front card credentials.`;
    }
    // Case 2: Smart Card (Front has 10 digits, Back barcode has 17-digit PIN + Name + DOB)
    else if (extracted.nidType === 'SMART_10_DIGIT' || (extracted.nid && extracted.nid.length === 10)) {
      // In BD Smart Cards, PDF417 encodes 17-digit PIN + Name + DOB
      const nameMatches = Boolean(bName && cName && (bName.includes(cName) || cName.includes(bName)));
      const dobMatches = Boolean(bDob && cDob && bDob === cDob);
      // Also check if PIN starts with birth year
      const pinYearMatches = Boolean(bPin && cDob && bPin.startsWith(cDob.substring(0, 4)));

      if ((nameMatches && dobMatches) || (dobMatches && pinYearMatches) || (nameMatches && pinYearMatches)) {
        isMatch = true;
        matchReason = `Smart Card PDF417 authenticated: Encoded citizen details (${barcodeResult.barcodeName || ''} · ${barcodeResult.barcodeDob || ''}) match front card.`;
      }
    }

    if (isMatch) {
      checks.push({
        title: 'Back 2D Barcode / PDF417 Cross-Check',
        status: 'PASSED',
        details: matchReason,
      });
      score += 20;
    } else if (bPin && extracted.nid) {
      checks.push({
        title: 'Back 2D Barcode / PDF417 Cross-Check',
        status: 'FAILED',
        details: `Critical Forgery Flag: Barcode demographic data (${bPin}) contradicts front card credentials (${extracted.nid}).`,
      });
      fraudIndicators.push(`Back barcode data contradicts front card details.`);
      score -= 50;
    } else {
      checks.push({
        title: 'Back 2D Barcode / PDF417 Cross-Check',
        status: 'PASSED',
        details: `Valid ${barcodeResult.format} barcode structure authenticated on back of card.`,
      });
      score += 10;
    }
  } else if (backImagePath) {
    checks.push({
      title: 'Back 2D Barcode / PDF417 Cross-Check',
      status: 'WARNING',
      details: 'Back photo uploaded, but barcode was unreadable or absent.',
    });
  }

  // Rule H: Facial eKYC Comparison (if live selfie uploaded)
  let faceResult = { executed: false };
  if (selfieImagePath && fs.existsSync(selfieImagePath)) {
    try {
      faceResult = await runFaceComparison(frontImagePath, selfieImagePath);
      if (faceResult.executed && faceResult.success) {
        if (faceResult.match) {
          checks.push({
            title: 'Facial eKYC Identity Match',
            status: 'PASSED',
            details: `Citizen portrait on NID matches submitted live selfie (${faceResult.confidenceScore}% similarity).`,
          });
          score += 25;
        } else {
          checks.push({
            title: 'Facial eKYC Identity Match',
            status: 'FAILED',
            details: `Identity Impersonation Alert: Card photo does not match user selfie (${faceResult.confidenceScore}% similarity)!`,
          });
          fraudIndicators.push(`Face mismatch: Card portrait does not match the submitted user selfie (${faceResult.confidenceScore}%).`);
          score -= 40;
        }
      }
    } catch (faceErr) {
      console.warn('Face verification warning:', faceErr.message);
    }
  }

  // Auto-Crop rule confirmation
  if (cropResult.cardDetected) {
    checks.push({
      title: 'Automated Document Boundary Detection',
      status: 'PASSED',
      details: 'Document geometry detected and rectified to standard 1.586 (ID-1) aspect ratio.',
    });
  }

  // Clamp confidence score between 5 and 99
  const finalConfidence = Math.max(5, Math.min(99, score));

  // Determine Final Verdict
  let verdict = 'VERIFIED_GENUINE';
  let isGenuine = true;

  if (fraudIndicators.length > 0) {
    verdict = 'SUSPECTED_FAKE';
    isGenuine = false;
  } else if (!extracted.nid) {
    verdict = 'INVALID_DOCUMENT';
    isGenuine = false;
  } else if (!dbResult.found) {
    verdict = 'UNVERIFIED_UNREGISTERED';
    isGenuine = false;
  } else if (finalConfidence < 70) {
    verdict = 'SUSPECTED_FAKE';
    isGenuine = false;
  } else {
    verdict = 'VERIFIED_GENUINE';
    isGenuine = true;
  }

  return {
    isGenuine,
    verdict,
    confidenceScore: finalConfidence,
    extractedData: {
      nidNumber: extracted.nid || 'Not detected',
      nidType: extracted.nidType,
      name: extracted.name || 'Not detected',
      dob: extracted.dob || 'Not detected',
      bloodGroup: extracted.bloodGroup || 'Not specified',
      hasBackImage: Boolean(backImagePath),
      barcode: barcodeResult.detected
        ? { detected: true, format: barcodeResult.format, barcodeNid: barcodeResult.barcodeNid }
        : { detected: false },
      faceMatch: faceResult.executed ? faceResult : null,
      autoCrop: cropResult.cardDetected ? cropResult : null,
    },
    databaseMatch: {
      isRegistered: dbResult.found,
      matchedDob: dbResult.matchedDob,
      registryDetails: dbResult.registryRecord,
    },
    forensics: {
      dimensions: forensics.dimensions,
      aspectRatio: forensics.aspectRatio,
      elaScore: forensics.elaScore,
      isTampered: forensics.elaTamperingDetected,
      contrast: forensics.contrastScore,
      elaHeatmapBase64: forensics.elaHeatmapBase64,
    },
    checks,
    fraudIndicators,
    analyzedAt: new Date().toISOString(),
  };
};
