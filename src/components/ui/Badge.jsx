const TONES = {
  slate: 'bg-slate-100 text-slate-800',
  dark: 'bg-slate-900 text-white',
  sky: 'bg-sky-100 text-sky-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  rose: 'bg-rose-100 text-rose-800',
  indigo: 'bg-indigo-100 text-indigo-800',
};

export default function Badge({ tone = 'slate', children }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-sm font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  );
}
