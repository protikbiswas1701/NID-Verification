import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({ label, error, hint, type = 'text', className = '', ...props }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`field-input ${error ? 'has-error' : ''} ${isPassword ? 'pr-11' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error ? <p id={`${id}-err`} className="mt-1.5 text-xs text-rose-600">{error}</p> : hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
