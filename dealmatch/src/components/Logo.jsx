export default function Logo({ size = 'md' }) {
  const text = size === 'lg' ? 'text-3xl' : 'text-xl'
  return (
    <div className={`flex items-center gap-2 font-extrabold tracking-tight ${text}`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-500 text-navy-950">D</span>
      <span className="text-slate-100">
        Deal<span className="text-gold-500">Match</span>
      </span>
    </div>
  )
}
