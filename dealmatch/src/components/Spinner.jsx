export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-navy-600 border-t-gold-500" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
