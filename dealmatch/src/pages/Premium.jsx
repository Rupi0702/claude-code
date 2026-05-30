import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PREMIUM_PRICE_LABEL } from '../lib/constants'
import AppShell from '../components/AppShell'

const BENEFITS = [
  'Unlimited matches every day',
  'Verified investor badge',
  'Priority placement in founder feeds',
  'See who requested to match with you',
]

export default function Premium() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Returning from Stripe Checkout.
  useEffect(() => {
    if (params.get('checkout') === 'success') {
      setNotice('Payment received — your Premium is being activated.')
      refreshProfile?.()
    } else if (params.get('checkout') === 'cancel') {
      setNotice('Checkout cancelled. No charge was made.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function subscribe() {
    setError('')
    setBusy(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID,
          successUrl: `${window.location.origin}/premium?checkout=success`,
          cancelUrl: `${window.location.origin}/premium?checkout=cancel`,
        },
      })
      if (error) throw error
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned. Is the edge function deployed?')
      }
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AppShell title="Investor Premium">
      <div className="space-y-4">
        {notice && (
          <div className="rounded-xl border border-gold-600/40 bg-gold-500/10 px-4 py-3 text-sm text-gold-400">
            {notice}
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-navy-700 to-navy-900 p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-500">
              DealMatch Premium
            </p>
            <p className="mt-2 text-4xl font-extrabold">
              99€<span className="text-base font-medium text-slate-400">/month</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">Cancel anytime.</p>
          </div>

          <ul className="space-y-3 p-6">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-slate-200">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 fill-gold-500" aria-hidden="true">
                  <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0z" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {profile?.is_premium ? (
          <div className="card p-5 text-center">
            <p className="font-semibold text-gold-400">You're a Premium member 🎉</p>
            <button onClick={() => navigate('/feed')} className="btn-outline mt-4 w-full">
              Back to Discover
            </button>
          </div>
        ) : (
          <button onClick={subscribe} className="btn-gold w-full" disabled={busy}>
            {busy ? 'Redirecting to checkout…' : `Subscribe — ${PREMIUM_PRICE_LABEL}`}
          </button>
        )}

        <p className="px-2 text-center text-xs text-slate-500">
          Payments are processed securely by Stripe. Premium is intended for investor accounts.
        </p>
      </div>
    </AppShell>
  )
}
