import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import Alert from '../../components/Alert';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import { PanelLoader } from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { getErrorMessage } from '../../services/api';
import { adminApi } from '../../services';
import { formatDate, formatDay } from '../../utils/format';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const [detailId, setDetailId] = useState(null);
  const [toggle, setToggle] = useState(null); // user awaiting confirmation
  const [busy, setBusy] = useState(false);

  useEffect(() => setPage(1), [debounced]);

  const { data, loading, error, reload } = useApi(() => adminApi.users({ search: debounced || undefined, page, limit: 10 }), [debounced, page]);
  const detail = useApi(() => (detailId ? adminApi.user(detailId) : Promise.resolve({ data: null })), [detailId]);

  const confirmToggle = async () => {
    setBusy(true);
    try {
      await adminApi.setUserActive(toggle._id, !toggle.isActive);
      toast.success(toggle.isActive ? 'Account deactivated.' : 'Account activated.');
      setToggle(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Users" subtitle="Registered accounts." />
      <div className="panel">
        <div className="border-b border-slate-100 p-4">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="field-input pl-10" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
          </div>
        </div>

        {error ? <div className="p-5"><Alert tone="error">{error}</Alert></div> : loading && !data ? <PanelLoader /> : data.items.length === 0 ? (
          <EmptyState icon={Users} title="No users found" text="Try a different search." />
        ) : (
          <div className={loading ? 'opacity-60 transition' : 'transition'}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-slate-100 bg-slate-50/60">
                  <tr><th className="th">User</th><th className="th">Role</th><th className="th">Joined</th><th className="th">Account</th><th className="th" /></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((u) => {
                    const locked = u.role === 'admin' || u._id === me._id;
                    return (
                      <tr key={u._id} className="hover:bg-slate-50/60">
                        <td className="td"><p className="font-medium text-navy-900">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                        <td className="td capitalize">{u.role}</td>
                        <td className="td">{formatDay(u.createdAt)}</td>
                        <td className="td"><span className={`text-xs font-semibold ${u.isActive ? 'text-emerald-700' : 'text-rose-700'}`}>{u.isActive ? 'Active' : 'Deactivated'}</span></td>
                        <td className="td">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setDetailId(u._id)}>Details</Button>
                            {!locked && <Button size="sm" variant={u.isActive ? 'secondary' : 'primary'} onClick={() => setToggle(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</Button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onPage={setPage} />
          </div>
        )}
      </div>

      <Modal open={Boolean(detailId)} title="User details" onClose={() => setDetailId(null)}>
        {detail.loading ? <PanelLoader /> : detail.error ? <Alert tone="error">{detail.error}</Alert> : detail.data && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3">
              <div><dt className="text-xs text-slate-500">Name</dt><dd className="font-medium text-slate-900">{detail.data.user.name}</dd></div>
              <div><dt className="text-xs text-slate-500">Email</dt><dd className="break-all font-medium text-slate-900">{detail.data.user.email}</dd></div>
              <div><dt className="text-xs text-slate-500">Role</dt><dd className="font-medium capitalize text-slate-900">{detail.data.user.role}</dd></div>
              <div><dt className="text-xs text-slate-500">Requests submitted</dt><dd className="font-medium text-slate-900">{detail.data.verificationCount}</dd></div>
            </dl>
            <div>
              <p className="mb-2 text-xs text-slate-500">Latest requests</p>
              {detail.data.recent.length === 0 ? <p>No requests yet.</p> : (
                <ul className="space-y-2">
                  {detail.data.recent.map((r) => (
                    <li key={r._id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <span><span className="font-medium text-slate-900">{r.requestId}</span> <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span></span>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(toggle)}
        title={toggle?.isActive ? 'Deactivate account?' : 'Activate account?'}
        onClose={() => !busy && setToggle(null)}
        footer={<><Button variant="secondary" onClick={() => setToggle(null)} disabled={busy}>Cancel</Button><Button variant={toggle?.isActive ? 'danger' : 'primary'} loading={busy} onClick={confirmToggle}>{toggle?.isActive ? 'Deactivate' : 'Activate'}</Button></>}
      >
        {toggle?.isActive ? `${toggle?.name} will no longer be able to log in or use the API until the account is activated again.` : `${toggle?.name} will be able to log in again.`}
      </Modal>
    </>
  );
}
