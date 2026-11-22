import { useEffect, useState } from 'react';
import { Database, Plus, Search, Trash2, UserCheck, ShieldCheck, AlertCircle } from 'lucide-react';
import Alert from '../../components/Alert';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import { PanelLoader } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { getErrorMessage } from '../../services/api';
import { adminApi } from '../../services';
import { formatDay } from '../../utils/format';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function AdminRegistry() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const initialForm = {
    nid: '',
    name: '',
    nameBn: '',
    dob: '',
    bloodGroup: 'O+',
    father: '',
    mother: '',
    birthPlace: '',
    phone: '',
    address: '',
    barcodePin: '',
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => setPage(1), [debounced]);

  const { data, loading, error, reload } = useApi(
    () => adminApi.listCitizens({ search: debounced || undefined, page, limit: 10 }),
    [debounced, page]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveCitizen = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.nid.trim() || !formData.name.trim() || !formData.dob.trim()) {
      setFormError('NID Number, Citizen Name, and Date of Birth are required.');
      return;
    }

    const cleanNid = formData.nid.replace(/\D/g, '');
    if (![10, 13, 17].includes(cleanNid.length)) {
      setFormError('NID must be 10, 13, or 17 numeric digits.');
      return;
    }

    setSaving(true);
    try {
      await adminApi.createCitizen(formData);
      toast.success(`Citizen ${cleanNid} registered in database!`);
      setShowAddModal(false);
      setFormData(initialForm);
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCitizen = async () => {
    if (!toDelete) return;
    setSaving(true);
    try {
      await adminApi.deleteCitizen(toDelete._id);
      toast.success(`Record removed from custom registry.`);
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Citizen Registry"
        subtitle="Manage national database records and pre-register test citizens for live demonstrations."
        actions={
          <Button icon={Plus} onClick={() => { setFormError(''); setShowAddModal(true); }}>
            Add Citizen to Registry
          </Button>
        }
      />

      <div className="panel">
        <div className="border-b border-slate-100 p-4">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="field-input pl-10"
              placeholder="Search registry by NID, Name, or 17-digit PIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search registry"
            />
          </div>
        </div>

        {error ? (
          <div className="p-5"><Alert tone="error">{error}</Alert></div>
        ) : loading && !data ? (
          <PanelLoader />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Database}
            title={debounced ? 'No matching citizens found' : 'No custom citizens added yet'}
            text={
              debounced
                ? 'Try searching by a different NID or Name.'
                : 'The system is actively checking the built-in 113,334 citizen records. Click below to add a new citizen.'
            }
            action={
              !debounced ? (
                <Button icon={Plus} onClick={() => { setFormError(''); setShowAddModal(true); }}>
                  Add First Citizen
                </Button>
              ) : null
            }
          />
        ) : (
          <div className={loading ? 'opacity-60 transition' : 'transition'}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="border-b border-slate-100 bg-slate-50/60">
                  <tr>
                    <th className="th">NID Number</th>
                    <th className="th">Citizen Name</th>
                    <th className="th">Date of Birth</th>
                    <th className="th">Blood Group</th>
                    <th className="th">Barcode PIN</th>
                    <th className="th">Added</th>
                    <th className="th" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/60">
                      <td className="td">
                        <span className="font-mono font-bold text-navy-900">{c.nid}</span>
                        <div className="text-[11px] text-slate-400">
                          {c.nid.length === 10 ? 'Smart 10-Digit' : c.nid.length === 17 ? 'Legacy 17-Digit' : '13-Digit'}
                        </div>
                      </td>
                      <td className="td">
                        <p className="font-semibold text-navy-900">{c.name}</p>
                        {c.nameBn && <p className="text-xs text-slate-500">{c.nameBn}</p>}
                      </td>
                      <td className="td font-mono text-xs font-semibold text-slate-700">{c.dob}</td>
                      <td className="td">
                        {c.bloodGroup ? (
                          <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200/60">
                            {c.bloodGroup}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="td font-mono text-xs text-slate-500">
                        {c.barcodePin || '—'}
                      </td>
                      <td className="td text-xs text-slate-500">{formatDay(c.createdAt)}</td>
                      <td className="td text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => setToDelete(c)}
                          title="Remove from custom registry"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 p-4">
              <Pagination pagination={data.pagination} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>

      {/* Add Citizen Modal */}
      {showAddModal && (
        <Modal
          open={showAddModal}
          title="Add Citizen to National Registry"
          onClose={() => !saving && setShowAddModal(false)}
        >
          <form onSubmit={handleSaveCitizen} className="space-y-4">
            {formError && <Alert tone="error">{formError}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  NID Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="nid"
                  required
                  placeholder="e.g. 3778939417 (10, 13, or 17 digits)"
                  value={formData.nid}
                  onChange={handleInputChange}
                  className="field-input font-mono"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Citizen Name (English) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. MD NAZMUL ISLAM TANMOY"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="field-input uppercase"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  required
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="field-input"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  className="field-input font-bold"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Barcode 17-Digit PIN
                </label>
                <input
                  type="text"
                  name="barcodePin"
                  placeholder="Optional (PDF417 PIN)"
                  value={formData.barcodePin}
                  onChange={handleInputChange}
                  className="field-input font-mono"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Name (Bengali)
                </label>
                <input
                  type="text"
                  name="nameBn"
                  placeholder="e.g. মোঃ নাজমুল ইসলাম তন্ময়"
                  value={formData.nameBn}
                  onChange={handleInputChange}
                  className="field-input"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Place of Birth / District
                </label>
                <input
                  type="text"
                  name="birthPlace"
                  placeholder="e.g. ঢাকা, নারায়ণগঞ্জ"
                  value={formData.birthPlace}
                  onChange={handleInputChange}
                  className="field-input"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Father's Name
                </label>
                <input
                  type="text"
                  name="father"
                  placeholder="Father's full name"
                  value={formData.father}
                  onChange={handleInputChange}
                  className="field-input"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Mother's Name
                </label>
                <input
                  type="text"
                  name="mother"
                  placeholder="Mother's full name"
                  value={formData.mother}
                  onChange={handleInputChange}
                  className="field-input"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Registered Address
              </label>
              <textarea
                name="address"
                rows={2}
                placeholder="Full address as printed on the back of the card..."
                value={formData.address}
                onChange={handleInputChange}
                className="field-input"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} icon={ShieldCheck}>
                Save Citizen to Registry
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {toDelete && (
        <Modal
          open={Boolean(toDelete)}
          title="Remove Citizen Record"
          onClose={() => !saving && setToDelete(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to remove citizen <strong className="text-navy-900">{toDelete.name}</strong> ({toDelete.nid}) from the custom registry?
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Future verifications for this card will no longer find this record unless it is also part of the built-in 113k government dataset.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setToDelete(null)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="danger" loading={saving} onClick={handleDeleteCitizen}>
                Yes, Remove Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
