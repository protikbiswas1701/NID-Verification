import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Alert from '../../components/Alert';
import Button from '../../components/Button';
import DocumentCard from '../../components/DocumentCard';
import { PanelLoader } from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';
import VerificationReport from '../../components/VerificationReport';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { getErrorMessage } from '../../services/api';
import { adminApi } from '../../services';
import { STATUS, STATUS_KEYS } from '../../utils/constants';
import { formatDate } from '../../utils/format';

export default function AdminVerificationDetails() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => adminApi.verification(id), [id]);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    if (data) {
      setStatus(data.verification.status);
      setNotes(data.verification.reviewNotes || '');
    }
  }, [data]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await adminApi.updateVerificationStatus(id, { status, reviewNotes: notes });
      toast.success('Review saved.');
      reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await adminApi.analyze(id);
      toast.success('Automated verification re-run completed.');
      if (reload) reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading && !data) return <PanelLoader />;
  if (error) return (
    <>
      <Link to="/admin/verifications" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-700">
        <ArrowLeft size={16} /> Back to requests
      </Link>
      <Alert tone="error">{error}</Alert>
    </>
  );

  const v = data.verification;
  return (
    <>
      <Link to="/admin/verifications" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 hover:underline">
        <ArrowLeft size={16} /> Back to requests
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{v.requestId}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Submitted {formatDate(v.createdAt)} by {v.user?.name || 'a deleted user'}
            {v.user?.email && ` (${v.user.email})`}
          </p>
        </div>
        <StatusBadge status={v.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="mb-4 text-base font-bold">NID Authenticity Verification Report</h2>
            <VerificationReport
              verification={v}
              analysis={v.aiResult || v.analysis}
              onReanalyze={handleReanalyze}
              reanalyzing={reanalyzing}
            />
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 text-base font-bold">Submitted Documents & Selfie</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <DocumentCard title="Front side" file={v.frontImage} loader={() => adminApi.file(id, 'front')} />
              <DocumentCard title="Back side" file={v.backImage} loader={() => adminApi.file(id, 'back')} />
              {v.selfieImage && (
                <DocumentCard title="Live selfie (eKYC)" file={v.selfieImage} loader={() => adminApi.file(id, 'selfie')} />
              )}
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 text-base font-bold">Request Timeline</h2>
            <Timeline history={v.history} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="mb-1 text-base font-bold">Review & Decision</h2>
            <p className="mb-4 text-xs text-slate-500">
              Admin decision workflow override.{v.reviewedBy?.name && ` Last updated by ${v.reviewedBy.name}.`}
            </p>
            <form onSubmit={save} className="space-y-4">
              {saveError && <Alert tone="error">{saveError}</Alert>}
              <div>
                <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                <select id="status" className="field-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_KEYS.map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-slate-700">Review Notes</label>
                <textarea
                  id="notes"
                  rows={4}
                  className="field-input"
                  placeholder="Add notes explaining manual verification decision or audit trail..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" icon={Save} loading={saving}>Save Review</Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
