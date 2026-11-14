import path from 'path';
import fs from 'fs';
import { evaluateNidCard, getRegistry } from '../services/verificationService.js';

async function runTests() {
  getRegistry();
  const sampleDir = path.resolve('../../../sample_cards');
  const files = fs.readdirSync(sampleDir).filter(f => f.endsWith('.jpg'));

  for (const f of files) {
    const filePath = path.join(sampleDir, f);
    console.log(`\n========================================`);
    console.log(`Testing: ${f}`);
    const res = await evaluateNidCard(filePath);
    console.log(`Verdict: ${res.verdict} | IsGenuine: ${res.isGenuine} | Confidence: ${res.confidenceScore}%`);
    console.log(`Extracted: NID=${res.extractedData.nidNumber}, DOB=${res.extractedData.dob}, Name=${res.extractedData.name}`);
    console.log(`Registry Match: found=${res.databaseMatch.isRegistered}, matchedDob=${res.databaseMatch.matchedDob}`);
    if (res.fraudIndicators?.length) {
      console.log(`Fraud Flags:`, res.fraudIndicators);
    }
  }
}

runTests().catch(console.error);
