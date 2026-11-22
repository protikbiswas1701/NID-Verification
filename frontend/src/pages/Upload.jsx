import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ShieldAlert, CheckCircle2, FileArchive, Upload as UploadIcon } from 'lucide-react';
import Alert from '../components/Alert';
import Button from '../components/Button';
import NidImageInput from '../components/NidImageInput';
import PageHeader from '../components/PageHeader';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { verificationApi } from '../services';

export default function Upload() {
  const navigate = useNavigate();
  const toast = useToast();
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'batch'
  const [zipFile, setZipFile] = useState(null);
  const [batchSummary, setBatchSummary] = useState(null);
  const zipInputRef = useRef(null);

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (!zipFile) {
      setServerError('Please select a .zip archive containing card images.');
      return;
    }
    setSubmitting(true);
    setProgress(0);
    setServerError('');
    setBatchSummary(null);

    const formData = new FormData();
    formData.append('zipFile', zipFile);

    try {
      const { data } = await verificationApi.batchZip(formData, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total));
      });
      setBatchSummary(data.summary);
      toast.success(`Batch processed: ${data.summary.totalProcessed} card(s) analyzed.`);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const next = {};
    if (!front) next.front = 'The front side is required.';
    if (!consent) next.consent = 'Please confirm before submitting.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const formData = new FormData();
    formData.append('frontImage', front);
    if (back) formData.append('backImage', back);
    if (selfie) formData.append('selfieImage', selfie);

    setSubmitting(true);
    setProgress(0);
    setServerError('');
    try {
      const { data } = await verificationApi.create(formData, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total));
      });
      toast.success(`Verification complete for ${data.verification.requestId}.`);
      navigate(`/app/verifications/${data.verification._id}`, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Upload & Verify NID"
        subtitle="Capture or choose photos of the card to run automated authenticity verification and fraud detection."
      />

      {/* Mode Switcher Tabs */}
      <div className="mb-6 flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('single')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            activeTab === 'single'
              ? 'border-navy-700 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UploadIcon size={16} />
          Single Card Verification
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('batch')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            activeTab === 'batch'
              ? 'border-navy-700 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileArchive size={16} />
          Batch Verification (ZIP)
        </button>
      </div>

      {activeTab === 'batch' ? (
        <form onSubmit={handleBatchSubmit} className="space-y-6">
          {serverError && <Alert tone="error">{serverError}</Alert>}

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) setZipFile(e.dataTransfer.files[0]);
            }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <FileArchive size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900">Upload ZIP Archive of NID Photos</h4>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Include multiple card photos (up to 30 images). The automated engine will verify each card and generate audit records.
            </p>

            <input
              ref={zipInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => setZipFile(e.target.files?.[0] || null)}
            />

            <div className="mt-5 flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() => zipInputRef.current?.click()}
              >
                {zipFile ? 'Change ZIP Archive' : 'Browse Files'}
              </Button>
              {zipFile && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  {zipFile.name} ({(zipFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              )}
            </div>
          </div>

          {submitting && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span className="font-medium">Processing batch verification queue…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-navy-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {batchSummary && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <h4 className="font-bold text-emerald-950 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Batch Verification Complete!
              </h4>
              <div className="mt-3 grid grid-cols-4 gap-3 text-center">
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <div className="text-lg font-black text-slate-900">{batchSummary.totalProcessed}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Total Cards</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <div className="text-lg font-black text-emerald-700">{batchSummary.genuineCount}</div>
                  <div className="text-[10px] uppercase font-bold text-emerald-600">Genuine</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <div className="text-lg font-black text-rose-700">{batchSummary.fakeCount}</div>
                  <div className="text-[10px] uppercase font-bold text-rose-600">Suspected Fake</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <div className="text-lg font-black text-amber-700">{batchSummary.unregisteredCount}</div>
                  <div className="text-[10px] uppercase font-bold text-amber-600">Unregistered</div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={() => navigate('/app/verifications')}>
                  View In History
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="lg" icon={Send} loading={submitting} disabled={!zipFile}>
              Run Batch Ingestion
            </Button>
          </div>
        </form>
      ) : (
        <>
          <form onSubmit={submit} noValidate className="space-y-6">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <div className="grid gap-6 md:grid-cols-3">
          <NidImageInput
            label="Front side"
            required
            file={front}
            onChange={setFront}
            disabled={submitting}
            error={errors.front}
          />
          <NidImageInput
            label="Back side"
            file={back}
            onChange={setBack}
            disabled={submitting}
          />
          <NidImageInput
            label="Live selfie (eKYC)"
            file={selfie}
            onChange={setSelfie}
            disabled={submitting}
          />
        </div>

        <Alert tone="warning">
          <span className="flex items-start gap-2">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span>
              National ID cards contain sensitive personal data. Use sample cards or your authorized personal document.
              All submitted images are processed privately and never indexed publicly.
            </span>
          </span>
        </Alert>

        <div>
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-navy-700"
            />
            <span>
              I am authorized to submit this document for automated verification against the national citizen database and fraud detection analysis.
            </span>
          </label>
          {errors.consent && (
            <p className="mt-1.5 text-xs text-rose-600" role="alert">
              {errors.consent}
            </p>
          )}
        </div>

        {submitting && (
          <div aria-live="polite" className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span className="font-medium">
                {progress < 100
                  ? 'Uploading card photos…'
                  : 'Running OCR, national database cross-check & ELA forensic analysis…'}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-navy-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" icon={Send} loading={submitting}>
            Verify Document Authenticity
          </Button>
        </div>
      </form>
      </>
      )}
    </>
  );
}
