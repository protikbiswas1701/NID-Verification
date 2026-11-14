export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-navy-50 text-navy-600"><Icon size={24} /></span>}
      <h3 className="text-base font-bold">{title}</h3>
      {text && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
