import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import Verification from '../models/Verification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { generateRequestId } from '../utils/requestId.js';
import { evaluateNidCard } from '../services/verificationService.js';
import { persistFilesToDb } from '../utils/files.js';
import { env } from '../config/env.js';

/**
 * POST /api/verifications/batch-zip
 * Accepts a ZIP archive containing multiple NID card images.
 * Extracts, creates a Verification for each image, runs fraud evaluation,
 * and returns summary metrics with per-item outcomes.
 */
export const processBatchZip = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, 'Please upload a ZIP file.');
  }

  const zipPath = req.file.path;
  const tempExtractDir = path.join(env.uploadDir, `batch_${Date.now()}`);

  try {
    fs.mkdirSync(tempExtractDir, { recursive: true });
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempExtractDir, true);

    // Collect all valid image files recursively
    const findImages = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(findImages(fullPath));
        } else {
          const ext = path.extname(file).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            results.push({ name: file, path: fullPath, size: stat.size });
          }
        }
      }
      return results;
    };

    const imageFiles = findImages(tempExtractDir);
    if (imageFiles.length === 0) {
      throw new HttpError(400, 'No supported images (JPG, PNG, WEBP) found inside the ZIP archive.');
    }

    const batchResults = [];
    let genuineCount = 0;
    let fakeCount = 0;
    let unregisteredCount = 0;

    // Process each image (limit max 30 per batch to prevent server exhaustion)
    const toProcess = imageFiles.slice(0, 30);

    for (const item of toProcess) {
      try {
        // Move file into permanent private_uploads
        const targetFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}${path.extname(item.name)}`;
        const targetPath = path.join(env.uploadDir, targetFilename);
        fs.copyFileSync(item.path, targetPath);
        await persistFilesToDb([{ filename: targetFilename, path: targetPath, mimeType: item.mimeType || 'image/jpeg' }]);

        // Run evaluation pipeline
        const analysis = await evaluateNidCard(targetPath, null);

        const status = analysis.isGenuine
          ? 'COMPLETED'
          : analysis.verdict === 'SUSPECTED_FAKE'
          ? 'MANUAL_REVIEW'
          : 'MANUAL_REVIEW';

        if (analysis.isGenuine) genuineCount++;
        else if (analysis.verdict === 'SUSPECTED_FAKE') fakeCount++;
        else unregisteredCount++;

        // Save DB record
        const doc = await Verification.create({
          user: req.user._id,
          requestId: generateRequestId(),
          frontImage: {
            filename: targetFilename,
            originalName: item.name,
            mimeType: item.name.endsWith('.png') ? 'image/png' : 'image/jpeg',
            size: item.size,
          },
          status,
          aiResult: analysis,
          analysis,
          history: [
            {
              status,
              note: `Batch ZIP ingestion: ${analysis.verdict} (${analysis.confidenceScore}% confidence).`,
            },
          ],
        });

        batchResults.push({
          id: doc._id,
          requestId: doc.requestId,
          originalName: item.name,
          verdict: analysis.verdict,
          confidenceScore: analysis.confidenceScore,
          nidNumber: analysis.extractedData?.nidNumber || null,
          isGenuine: analysis.isGenuine,
        });
      } catch (itemErr) {
        console.error(`Batch item failed (${item.name}):`, itemErr.message);
        batchResults.push({
          originalName: item.name,
          error: itemErr.message,
          verdict: 'FAILED',
        });
      }
    }

    res.json({
      success: true,
      summary: {
        totalProcessed: batchResults.length,
        genuineCount,
        fakeCount,
        unregisteredCount,
      },
      items: batchResults,
    });
  } finally {
    // Cleanup temporary extraction folder and uploaded zip file
    try {
      if (fs.existsSync(tempExtractDir)) {
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
      }
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }
    } catch (cleanupErr) {
      console.warn('Batch cleanup warning:', cleanupErr.message);
    }
  }
});
