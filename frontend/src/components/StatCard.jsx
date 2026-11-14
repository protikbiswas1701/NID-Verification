export default function StatCard({ label, value, icon: Icon, tone = 'navy' }) {
  const tones = {
    navy: 'bg-navy-50 text-navy-700',
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <div className="panel flex items-center gap-4 p-5">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tones[tone]}`}><Icon size={22} /></span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none text-navy-950">{value ?? '—'}</p>
        <p className="mt-1.5 truncate text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
