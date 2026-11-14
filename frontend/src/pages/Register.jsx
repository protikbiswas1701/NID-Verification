import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Input from '../components/Input';
import { homeFor, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (form.password.length < 8) next.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) next.password = 'Include at least one letter and one number';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setServerError('');
    try {
      const user = await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast.success('Account created. Welcome to NID Verify.');
      navigate(homeFor(user), { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes a minute. You can upload your first document right after."
      footer={<>Already registered? <Link to="/login" className="font-semibold text-navy-700 hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <Input label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" />
        <Input label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="8+ characters with a letter and a number" />
        <Input label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        <Button type="submit" loading={loading} className="w-full" size="lg">Create account</Button>
      </form>
    </AuthShell>
  );
}
