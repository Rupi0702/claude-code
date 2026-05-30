import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import Logo from '../components/Logo'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/feed', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-full max-w-app flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Logo size="lg" />
        <p className="max-w-xs text-sm text-slate-400">
          Where DACH founders meet angel investors.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-4 rounded-xl border border-gold-600/40 bg-gold-500/10 px-4 py-3 text-xs text-gold-400">
          Supabase isn't configured yet. Add your keys to <code>.env</code> to enable login.
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
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
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" className="btn-gold w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-gold-500">
          Create an account
        </Link>
      </p>
    </div>
  )
}
