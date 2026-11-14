import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, FileText, HelpCircle, History, Upload, XCircle } from 'lucide-react';
import Alert from '../components/Alert';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { PanelLoader } from '../components/Spinner';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { verificationApi } from '../services';
import { formatDate } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const stats = useApi(() => verificationApi.stats());
  const recent = useApi(() => verificationApi.list({ limit: 5 }));
  const s = stats.data;

  // Compute verdict counts from stats if available
  const genuine = s?.byVerdict?.VERIFIED_GENUINE ?? s?.completed ?? 0;
  const fake = s?.byVerdict?.SUSPECTED_FAKE ?? 0;
  const unregistered = s?.byVerdict?.UNVERIFIED_UNREGISTERED ?? 0;
  const pending = s?.pending ?? s?.byStatus?.PENDING_ANALYSIS ?? 0;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(' ')[0]}`}
        subtitle="Here is where your NID verification requests stand."
        actions={<Link to="/app/upload"><Button icon={Upload}>Verify NID</Button></Link>}
      />
      {stats.error && <Alert tone="error" className="mb-4">{stats.error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total verifications" value={s?.total} icon={FileText} />
        <StatCard label="Genuine" value={genuine} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Suspected fake" value={fake} icon={XCircle} tone="rose" />
        <StatCard label="Pending / Unregistered" value={pending + unregistered} icon={Clock} tone="amber" />
      </div>

      {/* Fraud alert if any fake cards detected */}
      {fake > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            <strong>{fake} suspected fake</strong> {fake === 1 ? 'card has' : 'cards have'} been detected in your submissions. Review the details below.
          </span>
        </div>
      )}

      <section className="panel mt-6">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold">Recent activity</h2>
          <Link to="/app/verifications" className="text-sm font-semibold text-navy-700 hover:underline">View all</Link>
        </div>
        {recent.loading && !recent.data ? <PanelLoader /> : recent.error ? (
          <div className="p-5"><Alert tone="error">{recent.error}</Alert></div>
        ) : recent.data?.items?.length === 0 ? (
          <EmptyState
            icon={History}
            title="No verifications yet"
            text="Upload a photo of an NID card to run your first fraud check."
            action={<Link to="/app/upload"><Button icon={Upload}>Verify NID</Button></Link>}
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.data.items.map((v) => (
              <li key={v._id}>
                <Link
                  to={`/app/verifications/${v._id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 transition hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{v.requestId}</p>
                    <p className="text-xs text-slate-500">{formatDate(v.createdAt)}</p>
                    {v.aiResult?.extractedData?.nidNumber && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5">NID: {v.aiResult.extractedData.nidNumber}</p>
                    )}
                  </div>
                  <StatusBadge status={v.aiResult?.verdict || v.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Verified genuine</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Suspected fake</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-400" />Unregistered</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Pending analysis</span>
        <HelpCircle size={12} className="text-slate-400" />
        <span>Verdicts are automated estimates, not official government verification.</span>
      </div>
    </>
  );
}
