import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Search, Upload } from 'lucide-react';
import Alert from '../components/Alert';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import { PanelLoader } from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import { useApi } from '../hooks/useApi';
import { useDebounce } from '../hooks/useDebounce';
import { verificationApi } from '../services';
import { STATUS, STATUS_KEYS } from '../utils/constants';
import { formatDate } from '../utils/format';

export default function History() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  useEffect(() => setPage(1), [debounced, status]);

  const { data, loading, error } = useApi(
    () => verificationApi.list({ search: debounced || undefined, status: status || undefined, page, limit: 10 }),
    [debounced, status, page]
  );

  return (
    <>
      <PageHeader title="My requests" subtitle="Every document you have submitted." actions={<Link to="/app/upload"><Button icon={Upload}>Upload NID</Button></Link>} />

      <div className="panel">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="field-input pl-10" placeholder="Search by request ID" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search by request ID" />
          </div>
          <select className="field-input sm:w-52" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUS_KEYS.map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
          </select>
        </div>

        {error ? <div className="p-5"><Alert tone="error">{error}</Alert></div> : loading && !data ? <PanelLoader /> : data.items.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title={debounced || status ? 'No matching requests' : 'No requests yet'}
            text={debounced || status ? 'Try a different search or clear the status filter.' : 'Your submitted documents will appear here.'}
          />
        ) : (
          <div className={loading ? 'opacity-60 transition' : 'transition'}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="border-b border-slate-100 bg-slate-50/60">
                  <tr><th className="th">Request ID</th><th className="th">Submitted</th><th className="th">Document</th><th className="th">Status</th><th className="th" /></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50/60">
                      <td className="td font-semibold text-navy-900">
                        {v.requestId}
                        {v.aiResult?.extractedData?.nidNumber && v.aiResult.extractedData.nidNumber !== 'Not detected' && (
                          <div className="font-mono text-xs font-normal text-slate-500">NID: {v.aiResult.extractedData.nidNumber}</div>
                        )}
                      </td>
                      <td className="td">{formatDate(v.createdAt)}</td>
                      <td className="td">{v.documentType}{v.backImage ? ' · front + back' : ' · front only'}</td>
                      <td className="td"><StatusBadge status={v.aiResult?.verdict || v.status} /></td>
                      <td className="td text-right"><Link to={`/app/verifications/${v._id}`}><Button size="sm" variant="secondary">Details</Button></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onPage={setPage} />
          </div>
        )}
      </div>
    </>
  );
}
