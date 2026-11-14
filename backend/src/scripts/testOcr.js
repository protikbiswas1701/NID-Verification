import path from 'path';
import { createWorker } from 'tesseract.js';
import fs from 'fs';

async function test() {
  const imagesDir = path.resolve('extracted_database/Database/Adhaar-Card & Pan Card India Database');
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));
  if (files.length === 0) {
    console.log('No images found.');
    return;
  }

  const sampleImage = path.join(imagesDir, files[0]);
  console.log('Testing OCR on sample image:', sampleImage);

  const worker = await createWorker('eng');
  const ret = await worker.recognize(sampleImage);
  console.log('--- OCR Result text ---');
  console.log(ret.data.text.slice(0, 500));
  console.log('--- OCR Confidence ---', ret.data.confidence);
  await worker.terminate();
}

test().catch(console.error);
