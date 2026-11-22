import { spawn } from 'child_process';
import path from 'path';

// Support both 'python3' (Linux/Docker standard) and 'python' (Windows standard)
const findPython = () => (process.platform === 'win32' ? 'python' : 'python3');
const SCRIPT_PATH = path.resolve('src/services/visionService.py');

/**
 * Runs automated rectangular contour detection and perspective crop on card image.
 */
export const runAutoCardCrop = (imagePath) => {
  return new Promise((resolve) => {
    const pythonBin = findPython();
    const proc = spawn(pythonBin, [SCRIPT_PATH, 'crop', imagePath]);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code === 0 && stdout) {
        try {
          resolve(JSON.parse(stdout.trim()));
          return;
        } catch (_) {}
      }
      resolve({ success: false, cardDetected: false, error: stderr || 'Execution failed' });
    });

    proc.on('error', (_err) => {
      resolve({ success: false, cardDetected: false, error: 'Python vision service unavailable' });
    });
  });
};

/**
 * Compares portrait on card against live user selfie (eKYC).
 */
export const runFaceComparison = (cardImagePath, selfieImagePath) => {
  return new Promise((resolve) => {
    if (!selfieImagePath) {
      resolve({ match: null, confidenceScore: null, executed: false });
      return;
    }

    const pythonBin = findPython();
    const proc = spawn(pythonBin, [SCRIPT_PATH, 'compare', cardImagePath, selfieImagePath]);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code === 0 && stdout) {
        try {
          const res = JSON.parse(stdout.trim());
          resolve({ ...res, executed: true });
          return;
        } catch (_) {}
      }
      resolve({
        success: false,
        match: false,
        confidenceScore: 0,
        executed: false,
        error: stderr || 'Face comparison unavailable',
      });
    });

    proc.on('error', (_err) => {
      resolve({
        success: false,
        match: false,
        confidenceScore: 0,
        executed: false,
        error: 'Python face matching unavailable',
      });
    });
  });
};
