import { storedPath } from '../utils/files.js';
import { evaluateNidCard } from './verificationService.js';

export const isAiServiceEnabled = () => true;

/**
 * Analyzes an uploaded NID verification request
 * Runs OCR, national registry cross-matching, mathematical checksums,
 * and Error Level Analysis (ELA) forensics.
 */
export const analyzeVerification = async (verification) => {
  try {
    const frontPath = storedPath(verification.frontImage.filename);
    const backPath = verification.backImage ? storedPath(verification.backImage.filename) : null;
    const selfiePath = verification.selfieImage ? storedPath(verification.selfieImage.filename) : null;

    const result = await evaluateNidCard(frontPath, backPath, selfiePath);

    return {
      implemented: true,
      success: true,
      analysis: result,
    };
  } catch (err) {
    console.error('AI Verification analysis failed:', err);
    return {
      implemented: true,
      success: false,
      error: err.message,
      analysis: {
        isGenuine: false,
        verdict: 'ANALYSIS_ERROR',
        confidenceScore: 0,
        checks: [{
          title: 'Automated Analysis Engine',
          status: 'FAILED',
          details: `Error executing image recognition pipeline: ${err.message}`,
        }],
        fraudIndicators: ['Image could not be processed by OCR / analysis engine.'],
        analyzedAt: new Date().toISOString(),
      },
    };
  }
};
