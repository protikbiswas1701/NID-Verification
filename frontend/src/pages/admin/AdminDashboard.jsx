import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, FileText, Inbox, UserSearch, Users } from 'lucide-react';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import { PanelLoader } from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { useApi } from '../../hooks/useApi';
import { adminApi } from '../../services';
import { formatDate } from '../../utils/format';

export default function AdminDashboard() {
  const { data, loading, error } = useApi(() => adminApi.dashboard());
  const s = data?.stats;

  return (
    <>
      <PageHeader title="Overview" subtitle="Activity across all users." />
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Registered users" value={s?.totalUsers} icon={Users} />
        <StatCard label="Total requests" value={s?.totalVerifications} icon={FileText} />
        <StatCard label="Verified Genuine" value={s?.genuineCount} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Suspected Fake" value={s?.fakeCount} icon={Inbox} tone="rose" />
        <StatCard label="Unregistered" value={s?.unregisteredCount} icon={Clock} tone="amber" />
        <StatCard label="Needs manual review" value={s?.manualReview} icon={UserSearch} tone="sky" />
      </div>

      <section className="panel mt-8">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold">Recent submissions</h2>
          <Link to="/admin/verifications" className="text-sm font-semibold text-navy-700 hover:underline">View all</Link>
        </div>
        {loading && !data ? <PanelLoader /> : !data?.recent?.length ? (
          <EmptyState icon={Inbox} title="No submissions yet" text="New requests from users will show up here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.recent.map((v) => (
              <li key={v._id}>
                <Link to={`/admin/verifications/${v._id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{v.requestId}</p>
                    <p className="text-xs text-slate-500">{v.user?.name || 'Deleted user'} · {formatDate(v.createdAt)}</p>
                    {v.aiResult?.extractedData?.nidNumber && v.aiResult.extractedData.nidNumber !== 'Not detected' && (
                      <p className="font-mono text-xs text-slate-400">NID: {v.aiResult.extractedData.nidNumber}</p>
                    )}
                  </div>
                  <StatusBadge status={v.aiResult?.verdict || v.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
