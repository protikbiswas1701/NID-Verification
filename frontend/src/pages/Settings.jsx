import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogOut } from 'lucide-react';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { authApi } from '../services';
import { formatDay } from '../utils/format';

export default function Settings() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.currentPassword) next.currentPassword = 'Enter your current password';
    if (form.newPassword.length < 8) next.newPassword = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) next.newPassword = 'Include at least one letter and one number';
    if (form.confirm !== form.newPassword) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setServerError('');
    try {
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password updated.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account and security." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-4 text-base font-bold">Account</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-slate-500">Name</dt><dd className="font-medium">{user.name}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="font-medium">{user.email}</dd></div>
            <div><dt className="text-slate-500">Account type</dt><dd className="font-medium capitalize">{user.role}</dd></div>
            <div><dt className="text-slate-500">Member since</dt><dd className="font-medium">{formatDay(user.createdAt)}</dd></div>
          </dl>
          <Button variant="secondary" icon={LogOut} className="mt-6" onClick={() => { logout(); navigate('/login', { replace: true }); }}>Log out</Button>
        </section>

        <section className="panel p-5">
          <h2 className="mb-4 text-base font-bold">Change password</h2>
          <form onSubmit={submit} className="space-y-4" noValidate>
            {serverError && <Alert tone="error">{serverError}</Alert>}
            <Input label="Current password" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} />
            <Input label="New password" type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword} hint="8+ characters with a letter and a number" />
            <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
            <Button type="submit" loading={saving}>Update password</Button>
          </form>
        </section>

        <section className="panel p-5 lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold"><Lock size={18} className="text-navy-600" /> Security and privacy</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
            <li>Uploaded NID images are stored privately and are never available through a public link.</li>
            <li>Only you and authorised administrators can open your images. You can delete a request, and its images, at any time.</li>
            <li>NID Verify is an independent document-review tool. It is not connected to any government database.</li>
            <li>Never share your password. Log out when using a shared device.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
