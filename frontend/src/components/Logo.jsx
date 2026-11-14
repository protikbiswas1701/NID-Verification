import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5" aria-label="NID Verify home">
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${light ? 'bg-white/10 text-ice-300' : 'bg-navy-800 text-ice-300'}`}>
        <ShieldCheck size={20} strokeWidth={2.2} />
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy-950'}`}>NID Verify</span>
    </Link>
  );
}
