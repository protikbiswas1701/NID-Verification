import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Input from '../components/Input';
import { homeFor, useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setServerError('');
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      const from = location.state?.from?.pathname;
      const allowed = from && (user.role === 'admin' ? from.startsWith('/admin') : from.startsWith('/app'));
      navigate(allowed ? from : homeFor(user), { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to submit documents and follow your requests."
      footer={<>New to NID Verify? <Link to="/register" className="font-semibold text-navy-700 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" />
        <Input label="Password" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} error={errors.password} />
        <Button type="submit" loading={loading} className="w-full" size="lg">Log in</Button>
      </form>
    </AuthShell>
  );
}
