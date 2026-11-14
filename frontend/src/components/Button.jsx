import { Spinner } from './Spinner';

const VARIANTS = {
  primary: 'bg-navy-800 text-white hover:bg-navy-700 disabled:bg-navy-300',
  secondary: 'bg-white text-navy-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 disabled:bg-rose-300',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-400',
  light: 'bg-white text-navy-900 hover:bg-ice-100',
};
const SIZES = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3 text-sm' };

export default function Button({ variant = 'primary', size = 'md', loading = false, icon: Icon, children, className = '', disabled, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner size={16} /> : Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
