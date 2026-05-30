import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Spinner from '../components/Spinner'

export default function Chat() {
  const { matchId } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const otherRole = profile?.role === 'founder' ? 'investor' : 'founder'

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('Chat')
  const [valid, setValid] = useState(true)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const scrollToBottom = () =>
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }))

  const init = useCallback(async () => {
    setLoading(true)
    const { data: match } = await supabase
      .from('matches')
      .select('id, user_low, user_high')
      .eq('id', matchId)
      .maybeSingle()

    if (!match) {
      setValid(false)
      setLoading(false)
      return
    }

    const otherId = match.user_low === user.id ? match.user_high : match.user_low
    if (otherRole === 'investor') {
      const { data } = await supabase
        .from('investor_profiles')
        .select('name')
        .eq('id', otherId)
        .maybeSingle()
      setTitle(data?.name ?? 'Investor')
    } else {
      const { data } = await supabase
        .from('founder_profiles')
        .select('company_name')
        .eq('id', otherId)
        .maybeSingle()
      setTitle(data?.company_name ?? 'Founder')
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_id, body, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    setMessages(msgs ?? [])
    setLoading(false)
    scrollToBottom()
  }, [matchId, user, otherRole])

  useEffect(() => {
    if (user) init()
  }, [init, user])

  // Realtime subscription for new messages in this match.
  useEffect(() => {
    if (!matchId) return
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new],
          )
          scrollToBottom()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId])

  async function send(e) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setSending(true)
    setDraft('')
    const { data, error } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: user.id, body })
      .select('id, sender_id, body, created_at')
      .single()
    setSending(false)
    if (error) {
      setDraft(body)
      return
    }
    // Optimistically add (realtime echo is de-duped by id).
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]))
    scrollToBottom()
  }

  if (!valid) {
    return (
      <div className="mx-auto grid min-h-full max-w-app place-items-center p-6 text-center">
        <div>
          <p className="text-slate-300">This conversation isn't available.</p>
          <button onClick={() => navigate('/matches')} className="btn-outline mt-4">
            Back to matches
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-full max-w-app flex-col bg-navy-950">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-navy-700 bg-navy-900/95 px-3 py-3 backdrop-blur">
        <button onClick={() => navigate('/matches')} className="p-1 text-slate-300" aria-label="Back">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-navy-700 font-bold text-gold-500">
          {title.charAt(0).toUpperCase()}
        </div>
        <h1 className="truncate text-base font-bold">{title}</h1>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {loading ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-500">
            You matched! Say hello 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user.id
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? 'rounded-br-sm bg-gold-500 text-navy-950'
                      : 'rounded-bl-sm bg-navy-700 text-slate-100'
                  }`}
                >
                  {m.body}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={send} className="sticky bottom-0 flex items-center gap-2 border-t border-navy-700 bg-navy-900/95 px-3 py-3 backdrop-blur">
        <input
          className="input flex-1"
          placeholder="Write a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
        />
        <button type="submit" className="btn-gold px-4" disabled={sending || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
