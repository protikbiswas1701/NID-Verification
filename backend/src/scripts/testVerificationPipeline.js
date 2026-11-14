import path from 'path';
import fs from 'fs';
import { evaluateNidCard, getRegistry } from '../services/verificationService.js';

async function test() {
  console.log('Testing full Verification Pipeline...');
  
  // 1. Check registry
  const reg = getRegistry();
  const sampleNid = Object.keys(reg)[0];
  console.log(`Sample Registry Record -> NID: ${sampleNid}, Data:`, reg[sampleNid]);

  // 2. Test an image from dataset
  const imagesDir = path.resolve('../../../extracted_database/Database/Adhaar-Card & Pan Card India Database');
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg'));
  const testImg = path.join(imagesDir, files[0]);

  console.log(`Running evaluation on: ${testImg}`);
  const result = await evaluateNidCard(testImg);

  console.log('\n--- VERIFICATION RESULT ---');
  console.log(`Verdict: ${result.verdict} (Genuine: ${result.isGenuine})`);
  console.log(`Confidence Score: ${result.confidenceScore}%`);
  console.log('Extracted Data:', result.extractedData);
  console.log('Database Match:', result.databaseMatch);
  console.log('Security Checks:');
  result.checks.forEach(c => console.log(`  [${c.status}] ${c.title}: ${c.details}`));
  console.log('Fraud Indicators:', result.fraudIndicators);
}

test().catch(console.error);
