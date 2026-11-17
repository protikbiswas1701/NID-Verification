import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Database,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  Search,
  User,
  Calendar,
  CreditCard,
  Droplet,
  Download,
  ScanFace,
  QrCode,
  Eye,
  Activity,
  Sparkles,
} from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import { exportVerificationPdf } from '../utils/pdfExport';

export default function VerificationReport({ verification, analysis, onReanalyze, reanalyzing }) {
  const [copied, setCopied] = useState(false);
  const [showElaModal, setShowElaModal] = useState(false);

  const activeAnalysis = analysis || verification?.aiResult || verification?.analysis;

  if (!activeAnalysis) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
        <p className="text-sm font-medium">No automated analysis recorded yet.</p>
        {onReanalyze && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            icon={RefreshCw}
            loading={reanalyzing}
            onClick={onReanalyze}
          >
            Run Verification Now
          </Button>
        )}
      </div>
    );
  }

  const {
    isGenuine,
    verdict,
    confidenceScore = 0,
    extractedData = {},
    databaseMatch = {},
    forensics = {},
    checks = [],
    fraudIndicators = [],
    analyzedAt,
  } = activeAnalysis;

  const copyNid = () => {
    if (extractedData.nidNumber && extractedData.nidNumber !== 'Not detected') {
      navigator.clipboard.writeText(extractedData.nidNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Verdict Theme Styles
  let theme = {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    badge: 'bg-emerald-600 text-white',
    icon: ShieldCheck,
    title: 'GENUINE DOCUMENT VERIFIED',
    subtitle: 'NID card structure, national registry, and visual integrity authenticated.',
  };

  if (verdict === 'SUSPECTED_FAKE') {
    theme = {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-900',
      badge: 'bg-rose-600 text-white',
      icon: ShieldAlert,
      title: 'SUSPECTED FAKE / FORGERY DETECTED',
      subtitle: 'Critical discrepancies, checksum contradictions, or tampering indicators flagged.',
    };
  } else if (verdict === 'UNVERIFIED_UNREGISTERED') {
    theme = {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      badge: 'bg-amber-600 text-white',
      icon: AlertTriangle,
      title: 'UNREGISTERED IN CITIZEN DATABASE',
      subtitle: 'NID format is valid, but record was not found in the national registry batch.',
    };
  } else if (verdict === 'INVALID_DOCUMENT') {
    theme = {
      bg: 'bg-slate-50',
      border: 'border-slate-300',
      text: 'text-slate-900',
      badge: 'bg-slate-700 text-white',
      icon: AlertCircle,
      title: 'INVALID DOCUMENT / UNREADABLE',
      subtitle: 'Could not extract valid Bangladesh NID number or required security fields.',
    };
  }

  const VerdictIcon = theme.icon;

  return (
    <div className="space-y-5">
      {/* 1. Verdict Banner */}
      <div className={`rounded-xl border ${theme.border} ${theme.bg} p-5 shadow-xs transition-all`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.badge}`}>
              <VerdictIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${theme.badge}`}>
                  {verdict.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-500">
                  {analyzedAt ? new Date(analyzedAt).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
              <h3 className={`mt-1 text-lg font-black tracking-tight ${theme.text}`}>{theme.title}</h3>
              <p className="mt-0.5 text-xs text-slate-600">{theme.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-black text-slate-900">{confidenceScore}%</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Confidence Score</div>
            </div>
            {verification && (
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={() => exportVerificationPdf(verification)}
                title="Download printable PDF verification certificate"
              >
                Export PDF
              </Button>
            )}
            {onReanalyze && (
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                loading={reanalyzing}
                onClick={onReanalyze}
                title="Re-run image OCR and database cross-check"
              >
                Re-Analyze
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full transition-all duration-700 ${
                isGenuine ? 'bg-emerald-500' : verdict === 'UNVERIFIED_UNREGISTERED' ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${confidenceScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Fraud Warnings (if flagged) */}
      {fraudIndicators.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-rose-900">
            <AlertTriangle size={17} className="text-rose-600" />
            Detected Fraud & Tampering Flags ({fraudIndicators.length})
          </h4>
          <ul className="mt-2 space-y-1 text-xs text-rose-800">
            {fraudIndicators.map((reason, i) => (
              <li key={i} className="flex items-start gap-1.5 font-medium">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Extracted Card Data Grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="mb-3.5 flex items-center justify-between text-sm font-bold text-slate-900">
          <span className="flex items-center gap-2">
            <CreditCard size={16} className="text-navy-600" />
            Extracted Card Credentials (OCR)
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {extractedData.nidType || 'Auto-Detected'}
          </span>
        </h4>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* NID Number */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">NID Number</span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-base font-extrabold text-navy-950">
                {extractedData.nidNumber || 'Not detected'}
              </span>
              {extractedData.nidNumber && extractedData.nidNumber !== 'Not detected' && (
                <button
                  type="button"
                  onClick={copyNid}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  title="Copy NID"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Date of Birth */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date of Birth</span>
            <div className="mt-1 flex items-center gap-2">
              <Calendar size={15} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-900">{extractedData.dob || 'Not detected'}</span>
            </div>
          </div>

          {/* Citizen Name */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Citizen Name</span>
            <div className="mt-1 flex items-center gap-2">
              <User size={15} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-900">{extractedData.name || 'Not detected'}</span>
            </div>
          </div>

          {/* Blood Group */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Blood Group</span>
            <div className="mt-1 flex items-center gap-2">
              <Droplet size={15} className="text-rose-500" />
              <span className="text-sm font-bold text-slate-900">{extractedData.bloodGroup || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* Registry Match Insight */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Database size={14} className="text-navy-600" />
              Citizen Registry Database Status
            </span>
            {databaseMatch.isRegistered ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 size={12} />
                Found in Registry
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                <AlertCircle size={12} />
                Not in 113k Database
              </span>
            )}
          </div>
          {databaseMatch.isRegistered && databaseMatch.registryDetails && (
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">Registered DOB: </span>
                <span className="font-semibold text-slate-800">{databaseMatch.registryDetails.dob || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">Registered Mobile: </span>
                <span className="font-semibold text-slate-800">{databaseMatch.registryDetails.phoneMasked || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Forensic ELA & Biometric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Error Level Analysis (ELA) Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Activity size={15} className="text-purple-600" />
              Forensic Tampering (ELA)
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                forensics.isTampered
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {forensics.isTampered ? 'Tampering Detected' : 'Authentic Compression'}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              <div>Tampering Risk Score: <span className="font-bold text-slate-900">{forensics.elaScore ?? 0}/100</span></div>
              <div className="text-[10px] text-slate-400">Differential JPEG artifact variance analysis</div>
            </div>
            {forensics.elaHeatmapBase64 && (
              <Button
                size="sm"
                variant="secondary"
                icon={Eye}
                onClick={() => setShowElaModal(true)}
              >
                Inspect Heatmap
              </Button>
            )}
          </div>
        </div>

        {/* Facial eKYC Match Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ScanFace size={15} className="text-indigo-600" />
              Facial eKYC Biometric Match
            </span>
            {extractedData.faceMatch && extractedData.faceMatch.success ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  extractedData.faceMatch.isMatch || extractedData.faceMatch.match
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {extractedData.faceMatch.isMatch || extractedData.faceMatch.match ? 'Identity Verified' : 'Face Mismatch'}
              </span>
            ) : extractedData.faceMatch && !extractedData.faceMatch.success ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                Selfie Bypassed
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                Selfie Not Provided
              </span>
            )}
          </div>

          <div className="mt-3 text-xs text-slate-600">
            {extractedData.faceMatch && extractedData.faceMatch.success ? (
              <div className="flex items-center justify-between">
                <div>
                  <div>Biometric Similarity: <span className="font-bold text-slate-900">{extractedData.faceMatch.similarityScore ?? extractedData.faceMatch.confidenceScore ?? 0}%</span></div>
                  <div className="text-[10px] text-slate-400">Card portrait vs live selfie correlation</div>
                </div>
                <div className="text-right text-[11px] font-semibold text-indigo-700">
                  {extractedData.faceMatch.isMatch || extractedData.faceMatch.match ? '✓ Confirmed Citizen' : '⚠ Non-matching Face'}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Upload a live selfie on the verification submission page to activate automated portrait-to-selfie facial cross-checking.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 5. Security Checks Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <Cpu size={16} className="text-navy-600" />
          Security & Authenticity Checks Checklist ({checks.filter((c) => c.status === 'PASSED').length}/{checks.length})
        </h4>

        <div className="divide-y divide-slate-100">
          {checks.map((c, idx) => {
            const isPass = c.status === 'PASSED';
            const isFail = c.status === 'FAILED';
            return (
              <div key={idx} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                {isPass ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                ) : isFail ? (
                  <XCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
                ) : (
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-500" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{c.title}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isPass ? 'text-emerald-600' : isFail ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{c.details}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ELA Heatmap Modal */}
      {showElaModal && forensics.elaHeatmapBase64 && (
        <Modal
          open={showElaModal}
          title="Digital Forensics: Error Level Analysis (ELA) Heatmap"
          onClose={() => setShowElaModal(false)}
          footer={
            <Button variant="secondary" onClick={() => setShowElaModal(false)}>
              Close Inspector
            </Button>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Error Level Analysis (ELA) highlights differences in compression levels across the image. Regions with bright, irregular noise patterns indicate potential digital splicing, cloned patches, or modified text.
            </p>
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2 text-center">
              <img
                src={forensics.elaHeatmapBase64}
                alt="ELA Forensic Heatmap"
                className="mx-auto max-h-96 rounded-lg object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Risk Score: <strong className="text-slate-800">{forensics.elaScore}/100</strong></span>
              <span>Status: <strong className={forensics.isTampered ? 'text-rose-600' : 'text-emerald-600'}>{forensics.isTampered ? 'Tampering Detected' : 'Clean / Uniform'}</strong></span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
