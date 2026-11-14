import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Alert from '../components/Alert';
import Button from '../components/Button';
import DocumentCard from '../components/DocumentCard';
import Modal from '../components/Modal';
import { PanelLoader } from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import VerificationReport from '../components/VerificationReport';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { getErrorMessage } from '../services/api';
import { verificationApi } from '../services';
import { formatDate } from '../utils/format';

export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => verificationApi.get(id), [id]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const remove = async () => {
    setDeleting(true);
    try {
      await verificationApi.remove(id);
      toast.success('Request and its images were deleted.');
      navigate('/app/verifications', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await verificationApi.analyze(id);
      toast.success('Verification analysis updated.');
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
      <Link to="/app/verifications" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-700">
        <ArrowLeft size={16} /> Back to requests
      </Link>
      <Alert tone="error">{error}</Alert>
    </>
  );

  const v = data.verification;
  return (
    <>
      <Link to="/app/verifications" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 hover:underline">
        <ArrowLeft size={16} /> Back to requests
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{v.requestId}</h1>
          <p className="mt-1 text-sm text-slate-500">Submitted {formatDate(v.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={v.aiResult?.verdict || v.status} />
          <Button variant="secondary" size="sm" icon={Trash2} onClick={() => setConfirmOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Automated Verification Report */}
          <section className="panel p-5">
            <h2 className="mb-4 text-base font-bold">NID Authenticity Verification Report</h2>
            <VerificationReport
              verification={v}
              analysis={v.aiResult || v.analysis}
              onReanalyze={handleReanalyze}
              reanalyzing={reanalyzing}
            />
          </section>

          {/* Submitted Documents */}
          <section className="panel p-5">
            <h2 className="mb-4 text-base font-bold">Submitted Document Images & Selfie</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <DocumentCard title="Front side" file={v.frontImage} loader={() => verificationApi.file(id, 'front')} />
              <DocumentCard title="Back side" file={v.backImage} loader={() => verificationApi.file(id, 'back')} />
              {v.selfieImage && (
                <DocumentCard title="Live selfie (eKYC)" file={v.selfieImage} loader={() => verificationApi.file(id, 'selfie')} />
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="mb-3 text-base font-bold">Review Status</h2>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-slate-500">Document type</dt><dd className="font-medium">{v.documentType}</dd></div>
              <div><dt className="text-slate-500">Workflow status</dt><dd className="font-medium">{v.status}</dd></div>
              <div><dt className="text-slate-500">Last reviewed</dt><dd className="font-medium">{formatDate(v.reviewedAt)}</dd></div>
              <div><dt className="text-slate-500">Reviewer notes</dt><dd className="whitespace-pre-wrap font-medium">{v.reviewNotes || 'No notes yet.'}</dd></div>
            </dl>
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 text-base font-bold">Request Timeline</h2>
            <Timeline history={v.history} />
          </section>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title="Delete this request?"
        onClose={() => !deleting && setConfirmOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Keep request
            </Button>
            <Button variant="danger" loading={deleting} onClick={remove}>
              Delete permanently
            </Button>
          </>
        }
      >
        {v.requestId} and its uploaded images will be permanently removed. This cannot be undone.
      </Modal>
    </>
  );
}
