import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import AppShell from '../components/AppShell'
import Spinner from '../components/Spinner'
import VerifiedBadge from '../components/VerifiedBadge'

// Fetches a display name (+ verified flag) for a set of users of the opposite
// role to the viewer. Returns a map: id -> { name, verified }.
async function fetchDisplayInfo(ids, otherRole) {
  if (!ids.length) return {}
  const map = {}
  if (otherRole === 'investor') {
    const { data } = await supabase
      .from('investor_profiles')
      .select('id, name, profiles!inner(verified)')
      .in('id', ids)
    data?.forEach((r) => (map[r.id] = { name: r.name, verified: r.profiles?.verified }))
  } else {
    const { data } = await supabase
      .from('founder_profiles')
      .select('id, company_name')
      .in('id', ids)
    data?.forEach((r) => (map[r.id] = { name: r.company_name, verified: false }))
  }
  return map
}

export default function Matches() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const otherRole = profile?.role === 'founder' ? 'investor' : 'founder'

  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [matches, setMatches] = useState([])
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: reqs } = await supabase
        .from('match_requests')
        .select('id, from_user, created_at')
        .eq('to_user', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      const { data: ms } = await supabase
        .from('matches')
        .select('id, user_low, user_high, created_at')
        .or(`user_low.eq.${user.id},user_high.eq.${user.id}`)
        .order('created_at', { ascending: false })

      const reqIds = (reqs ?? []).map((r) => r.from_user)
      const matchOtherIds = (ms ?? []).map((m) =>
        m.user_low === user.id ? m.user_high : m.user_low,
      )

      const info = await fetchDisplayInfo(
        [...new Set([...reqIds, ...matchOtherIds])],
        otherRole,
      )

      setRequests((reqs ?? []).map((r) => ({ ...r, info: info[r.from_user] })))
      setMatches(
        (ms ?? []).map((m) => {
          const otherId = m.user_low === user.id ? m.user_high : m.user_low
          return { id: m.id, otherId, info: info[otherId] }
        }),
      )
    } finally {
      setLoading(false)
    }
  }, [user, otherRole])

  useEffect(() => {
    if (user) load()
  }, [load, user])

  async function accept(requestId) {
    setBusyId(requestId)
    try {
      await supabase.rpc('accept_match_request', { request_id: requestId })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function decline(requestId) {
    setBusyId(requestId)
    try {
      await supabase.from('match_requests').update({ status: 'declined' }).eq('id', requestId)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AppShell title="Matches">
      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          {/* Incoming requests */}
          {requests.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Match requests ({requests.length})
              </h2>
              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r.id} className="card flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold">
                          {r.info?.name ?? 'Someone'}
                        </span>
                        {r.info?.verified && <VerifiedBadge />}
                      </div>
                      <p className="text-xs text-slate-400">wants to connect</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => decline(r.id)} disabled={busyId === r.id}
                        className="btn-ghost px-3 py-2 text-xs">Decline</button>
                      <button onClick={() => accept(r.id)} disabled={busyId === r.id}
                        className="btn-gold px-3 py-2 text-xs">Accept</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Conversations */}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Conversations
            </h2>
            {matches.length === 0 ? (
              <div className="card p-6 text-center text-sm text-slate-400">
                No matches yet. Send requests from the Discover tab to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/chat/${m.id}`)}
                    className="card flex w-full items-center gap-3 p-4 text-left transition-colors hover:border-gold-500"
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy-700 font-bold text-gold-500">
                      {(m.info?.name ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold">{m.info?.name ?? 'Match'}</span>
                        {m.info?.verified && <VerifiedBadge />}
                      </div>
                      <p className="truncate text-xs text-slate-400">Tap to open chat</p>
                    </div>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  )
}
