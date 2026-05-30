export default function VerifiedBadge({ className = '' }) {
  return (
    <span
      title="Verified investor"
      className={`inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[11px] font-semibold text-gold-400 ${className}`}
    >
      <svg viewBox="0 0 20 20" className="h-3 w-3 fill-current" aria-hidden="true">
        <path d="M10 1l2.39 1.74 2.95.02 1.18 2.71 2.5 1.57-.92 2.81.92 2.81-2.5 1.57-1.18 2.71-2.95.02L10 19l-2.39-1.74-2.95-.02-1.18-2.71-2.5-1.57.92-2.81L.98 7.04l2.5-1.57 1.18-2.71 2.95-.02L10 1zm-1 11.5l4.5-4.5-1.06-1.06L9 10.38 7.56 8.94 6.5 10l2.5 2.5z" />
      </svg>
      Verified
    </span>
  )
}
