import { stageLabel, ticketLabel } from '../lib/constants'
import VerifiedBadge from './VerifiedBadge'

// Renders a founder or investor as a feed card. `kind` is the role being shown.
export default function ProfileCard({ kind, data, onRequest, busy, requested }) {
  const isFounder = kind === 'founder'

  return (
    <article className="card overflow-hidden p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold leading-tight">
            {isFounder ? data.company_name : data.name}
          </h2>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-gold-500">
            {isFounder ? 'Founder' : 'Investor'}
          </p>
        </div>
        {!isFounder && data.verified && <VerifiedBadge />}
      </div>

      <p className="mb-4 text-sm leading-relaxed text-slate-300">
        {isFounder ? data.one_liner : data.background}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {isFounder ? (
          <>
            <span className="chip">{stageLabel(data.funding_stage)}</span>
            <span className="chip">{data.industry}</span>
            <span className="chip chip-active">Seeking {ticketLabel(data.ticket_size)}</span>
          </>
        ) : (
          <>
            {data.focus?.map((f) => (
              <span key={f} className="chip">{f}</span>
            ))}
            <span className="chip chip-active">
              {ticketLabel(data.ticket_min)}–{ticketLabel(data.ticket_max)}
            </span>
            {data.stage_prefs?.map((s) => (
              <span key={s} className="chip">{stageLabel(s)}</span>
            ))}
          </>
        )}
      </div>

      <button
        className="btn-gold w-full"
        onClick={() => onRequest(data.id)}
        disabled={busy || requested}
      >
        {requested ? 'Request sent ✓' : busy ? 'Sending…' : 'Send match request'}
      </button>
    </article>
  )
}
