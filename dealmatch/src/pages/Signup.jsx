import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import Logo from '../components/Logo'

const ROLES = [
  {
    value: 'founder',
    title: "I'm a Founder",
    desc: 'Raising Pre-Seed or Seed for my startup.',
  },
  {
    value: 'investor',
    title: "I'm an Investor",
    desc: 'Looking to back early-stage DACH teams.',
  },
]

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('founder')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { data, error } = await signUp(email.trim(), password, role)
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    // If email confirmation is disabled, a session exists immediately.
    if (data.session) {
      navigate('/onboarding', { replace: true })
    } else {
      navigate('/login', {
        replace: true,
        state: { notice: 'Check your inbox to confirm your email, then log in.' },
      })
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-app flex-col justify-center px-6 py-10">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <Logo size="lg" />
        <p className="text-sm text-slate-400">Create your account in seconds.</p>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-4 rounded-xl border border-gold-600/40 bg-gold-500/10 px-4 py-3 text-xs text-gold-400">
          Supabase isn't configured yet. Add your keys to <code>.env</code> to enable signup.
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5 p-5">
        <div>
          <label className="label">I am a…</label>
          <div className="grid grid-cols-1 gap-2">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  role === r.value
                    ? 'border-gold-500 bg-gold-500/10'
                    : 'border-navy-600 bg-navy-800 hover:border-navy-500'
                }`}
              >
                <div className="font-semibold">{r.title}</div>
                <div className="text-xs text-slate-400">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@startup.com"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" className="btn-gold w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-gold-500">
          Log in
        </Link>
      </p>
    </div>
  )
}
