/**
 * Automated Verification Pipeline Unit Tests
 * Tests genuine cards, database DOB mismatches, 17-digit checksum mismatches,
 * and unregistered IDs without needing server runtimes.
 */
import path from 'path';
import { evaluateNidCard, verifyAgainstDatabase, normalizeDob } from '../services/verificationService.js';

let passedCount = 0;
let failedCount = 0;

const assert = (condition, description) => {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failedCount++;
  }
};

const runTests = async () => {
  console.log('\n========================================');
  console.log(' RUNNING NID VERIFICATION TEST SUITE');
  console.log('========================================\n');

  // Test 1: Date Normalization Unit Tests
  console.log('Suite 1: DOB Normalization Utility');
  assert(normalizeDob('1992-05-14') === '1992-05-14', 'Parses ISO format (YYYY-MM-DD)');
  assert(normalizeDob('14/05/1992') === '1992-05-14', 'Parses Slash format (DD/MM/YYYY)');
  assert(normalizeDob('19 Apr 1969') === '1969-04-19', 'Parses Month String (DD Mon YYYY)');
  assert(normalizeDob('১৯-০৪-১৯৬৯') === '1969-04-19', 'Converts Bengali numerals to YYYY-MM-DD');

  // Test 2: Database Registry Lookup
  console.log('\nSuite 2: 113k Citizen Registry Cross-Check');
  const genuineMatch = verifyAgainstDatabase('7756684226', '1969-04-19');
  assert(genuineMatch.found === true, 'Finds genuine 10-digit NID in registry');
  assert(genuineMatch.matchedDob === true, 'Confirms matching DOB with registry record');

  const dobMismatch = verifyAgainstDatabase('7756684226', '1999-01-01');
  assert(dobMismatch.found === true, 'Finds NID record');
  assert(dobMismatch.matchedDob === false, 'Correctly flags DOB mismatch against registry');

  const unregMatch = verifyAgainstDatabase('1122334455', '1990-01-01');
  assert(unregMatch.found === false, 'Correctly reports unregistered NID number');

  // Test 3: Sample Card Image Verification Pipeline
  console.log('\nSuite 3: OCR & Fraud Evaluation Pipeline');
  const samplesDir = path.resolve('../frontend/public/samples');

  const card1 = path.join(samplesDir, '1_genuine_smart_card.jpg');
  console.log(`Testing genuine card: ${path.basename(card1)}...`);
  const res1 = await evaluateNidCard(card1);
  assert(res1.verdict === 'VERIFIED_GENUINE', 'Card 1 is VERIFIED_GENUINE');
  assert(res1.isGenuine === true, 'Card 1 is marked genuine');
  assert(res1.confidenceScore >= 80, `Card 1 confidence score high (${res1.confidenceScore}%)`);

  const card3 = path.join(samplesDir, '3_fake_tampered_dob.jpg');
  console.log(`Testing tampered DOB card: ${path.basename(card3)}...`);
  const res3 = await evaluateNidCard(card3);
  assert(res3.verdict === 'SUSPECTED_FAKE', 'Card 3 is SUSPECTED_FAKE');
  assert(res3.isGenuine === false, 'Card 3 is marked non-genuine');
  assert(res3.fraudIndicators.length > 0, 'Card 3 flagged with fraud indicators');
  assert(typeof res3.forensics?.elaHeatmapBase64 === 'string' && res3.forensics.elaHeatmapBase64.length > 1000, 'Card 3 generates ELA forensic heatmap preview');

  const card4 = path.join(samplesDir, '4_fake_year_prefix_mismatch.jpg');
  console.log(`Testing 17-digit prefix mismatch card: ${path.basename(card4)}...`);
  const res4 = await evaluateNidCard(card4);
  assert(res4.verdict === 'SUSPECTED_FAKE', 'Card 4 is SUSPECTED_FAKE (17-digit prefix failure)');
  assert(res4.isGenuine === false, 'Card 4 is marked non-genuine');

  const card5 = path.join(samplesDir, '5_fake_unregistered_card.jpg');
  console.log(`Testing unregistered card: ${path.basename(card5)}...`);
  const res5 = await evaluateNidCard(card5);
  assert(res5.verdict === 'UNVERIFIED_UNREGISTERED', 'Card 5 is UNVERIFIED_UNREGISTERED');

  console.log('\n========================================');
  console.log(` RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('========================================\n');

  if (failedCount > 0) process.exit(1);
  process.exit(0);
};

runTests().catch((err) => {
  console.error('Test runner encountered fatal error:', err);
  process.exit(1);
});
