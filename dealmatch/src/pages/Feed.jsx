import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  getExcludedIds,
  getServedTodayIds,
  logServed,
  sendMatchRequest,
} from '../lib/matching'
import { INDUSTRIES, TICKET_SIZES, FREE_DAILY_LIMIT } from '../lib/constants'
import AppShell from '../components/AppShell'
import ProfileCard from '../components/ProfileCard'
import Spinner from '../components/Spinner'

export default function Feed() {
  const { user, profile, refreshProfile } = useAuth()
  const viewerRole = profile?.role
  const targetKind = viewerRole === 'founder' ? 'investor' : 'founder'
  const isPremium = !!profile?.is_premium

  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [limitReached, setLimitReached] = useState(false)
  const [industry, setIndustry] = useState('')
  const [ticket, setTicket] = useState('')
  const [pending, setPending] = useState({}) // id -> 'busy' | 'requested' | 'matched'
  const [toast, setToast] = useState('')

  const fetchCandidates = useCallback(async () => {
    if (targetKind === 'investor') {
      let q = supabase
        .from('investor_profiles')
        .select('id, name, background, focus, ticket_min, ticket_max, stage_prefs, profiles!inner(verified)')
      if (industry) q = q.contains('focus', [industry])
      if (ticket) q = q.lte('ticket_min', Number(ticket)).gte('ticket_max', Number(ticket))
      const { data, error } = await q.order('id')
      if (error) throw error
      return (data ?? []).map((r) => ({ ...r, verified: r.profiles?.verified }))
    } else {
      let q = supabase
        .from('founder_profiles')
        .select('id, company_name, one_liner, funding_stage, ticket_size, industry')
      if (industry) q = q.eq('industry', industry)
      if (ticket) q = q.eq('ticket_size', Number(ticket))
      const { data, error } = await q.order('id')
      if (error) throw error
      return data ?? []
    }
  }, [targetKind, industry, ticket])

  const loadFeed = useCallback(async () => {
    setLoading(true)
    setLimitReached(false)
    try {
      const [candidates, excluded] = await Promise.all([
        fetchCandidates(),
        getExcludedIds(user.id),
      ])
      const visible = candidates.filter((c) => !excluded.has(c.id))

      if (isPremium) {
        setCards(visible)
        return
      }

      // Free tier: at most FREE_DAILY_LIMIT distinct profiles revealed per day.
      const servedIds = await getServedTodayIds(user.id)
      const alreadyServed = visible.filter((c) => servedIds.has(c.id))
      const fresh = visible.filter((c) => !servedIds.has(c.id))
      const remaining = Math.max(0, FREE_DAILY_LIMIT - servedIds.size)
      const topUp = fresh.slice(0, remaining)

      if (topUp.length) await logServed(user.id, topUp.map((c) => c.id))

      setCards([...alreadyServed, ...topUp])
      // The cap is biting only if there are more fresh profiles we couldn't show.
      setLimitReached(fresh.length > topUp.length)
    } catch (err) {
      setToast(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetchCandidates, user, isPremium])

  useEffect(() => {
    if (user) loadFeed()
  }, [loadFeed, user])

  async function handleRequest(targetId) {
    setPending((p) => ({ ...p, [targetId]: 'busy' }))
    try {
      const { matched } = await sendMatchRequest(user.id, targetId)
      setPending((p) => ({ ...p, [targetId]: 'requested' }))
      setToast(matched ? "It's a match! 🎉 Find them under Matches." : 'Match request sent.')
      // Remove the card shortly after so the feed stays clean.
      setTimeout(() => setCards((cs) => cs.filter((c) => c.id !== targetId)), 900)
    } catch (err) {
      setPending((p) => ({ ...p, [targetId]: undefined }))
      setToast(err.message)
    }
  }

  // Surface premium changes (e.g. returning from Stripe checkout).
  useEffect(() => {
    refreshProfile?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const resetFilters = () => {
    setIndustry('')
    setTicket('')
  }

  return (
    <AppShell
      title="Discover"
      right={
        isPremium ? (
          <span className="chip chip-active">Premium</span>
        ) : (
          <Link to="/premium" className="text-xs font-semibold text-gold-500">
            Go Premium
          </Link>
        )
      }
    >
      {/* Filters */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-500">Industry:</span>
          <button onClick={() => setIndustry('')}
            className={`chip ${industry === '' ? 'chip-active' : ''}`}>All</button>
          {INDUSTRIES.map((i) => (
            <button key={i} onClick={() => setIndustry(i)}
              className={`chip whitespace-nowrap ${industry === i ? 'chip-active' : ''}`}>{i}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-500">Ticket:</span>
          <button onClick={() => setTicket('')}
            className={`chip ${ticket === '' ? 'chip-active' : ''}`}>Any</button>
          {TICKET_SIZES.map((t) => (
            <button key={t.value} onClick={() => setTicket(String(t.value))}
              className={`chip whitespace-nowrap ${ticket === String(t.value) ? 'chip-active' : ''}`}>{t.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner label="Finding matches…" />
      ) : cards.length === 0 ? (
        <EmptyState onReset={resetFilters} hasFilters={!!(industry || ticket)} />
      ) : (
        <div className="space-y-4">
          {cards.map((c) => (
            <ProfileCard
              key={c.id}
              kind={targetKind}
              data={c}
              busy={pending[c.id] === 'busy'}
              requested={pending[c.id] === 'requested'}
              onRequest={handleRequest}
            />
          ))}

          {!isPremium && limitReached && <DailyLimitCard />}
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-20 z-30 mx-auto w-fit max-w-app rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 shadow-lg">
          {toast}
        </div>
      )}
    </AppShell>
  )
}

function EmptyState({ onReset, hasFilters }) {
  return (
    <div className="card mt-6 p-6 text-center">
      <p className="text-sm text-slate-300">
        {hasFilters
          ? 'No profiles match these filters right now.'
          : "You're all caught up — no new profiles to show."}
      </p>
      {hasFilters && (
        <button onClick={onReset} className="btn-outline mt-4">
          Clear filters
        </button>
      )}
    </div>
  )
}

function DailyLimitCard() {
  return (
    <div className="card border-gold-600/40 bg-gold-500/5 p-6 text-center">
      <h3 className="text-base font-bold text-gold-400">You've seen today's {FREE_DAILY_LIMIT} matches</h3>
      <p className="mt-1 text-sm text-slate-300">
        Upgrade to Premium for unlimited matches and a verified badge.
      </p>
      <Link to="/premium" className="btn-gold mt-4 w-full">
        Unlock unlimited — 99€/month
      </Link>
    </div>
  )
}
