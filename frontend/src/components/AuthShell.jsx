import { Link } from 'react-router-dom';
import { Lock, ScanLine } from 'lucide-react';
import Logo from './Logo';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-navy-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo light />
        <div className="relative z-10 max-w-md">
          <div className="mb-8 grid aspect-[1.586] w-72 grid-rows-[auto_1fr] gap-3 rounded-2xl border border-white/15 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-xs text-ice-200"><ScanLine size={16} /> Front side · received</div>
            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <div className="rounded-lg bg-white/10" />
              <div className="space-y-2.5 pt-1"><div className="h-2.5 w-4/5 rounded bg-white/15" /><div className="h-2.5 w-3/5 rounded bg-white/15" /><div className="h-2.5 w-2/3 rounded bg-white/15" /></div>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight text-white">Every NID request, stored privately and tracked end to end.</h2>
          <p className="mt-4 text-sm leading-relaxed text-navy-200">Images are kept in private storage and are only visible to you and authorised reviewers.</p>
        </div>
        <p className="relative z-10 flex items-center gap-2 text-xs text-navy-300"><Lock size={14} /> Independent document-review tool. Not a government service.</p>
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-navy-700/40" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-navy-800/60" aria-hidden="true" />
      </aside>

      <main className="flex items-center justify-center bg-white px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="mb-7 mt-1.5 text-sm text-slate-500">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
          <p className="mt-8 text-center text-xs text-slate-400"><Link to="/" className="hover:text-navy-700">Back to home</Link></p>
        </div>
      </main>
    </div>
  );
}
