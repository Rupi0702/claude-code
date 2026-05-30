import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  INDUSTRIES,
  TICKET_SIZES,
  FUNDING_STAGES,
  STAGE_PREFS,
  ticketLabel,
} from '../lib/constants'
import AppShell from '../components/AppShell'
import Spinner from '../components/Spinner'
import VerifiedBadge from '../components/VerifiedBadge'

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const role = profile?.role
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (!user || !role) return
    const table = role === 'founder' ? 'founder_profiles' : 'investor_profiles'
    supabase
      .from(table)
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setForm(data ?? {})
        setLoading(false)
      })
  }, [user, role])

  const set = (key) => (val) => {
    setSaved(false)
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const table = role === 'founder' ? 'founder_profiles' : 'investor_profiles'
    const payload = { ...form, id: user.id }
    delete payload.updated_at
    const { error } = await supabase.from(table).upsert(payload)
    setSaving(false)
    if (!error) {
      setSaved(true)
      refreshProfile?.()
    }
  }

  return (
    <AppShell
      title="Profile"
      right={
        <button onClick={signOut} className="text-xs font-semibold text-slate-400 hover:text-gold-400">
          Sign out
        </button>
      }
    >
      {/* Status row */}
      <div className="card mb-4 flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {role === 'founder' ? 'Founder' : 'Investor'} account
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`chip ${profile?.is_premium ? 'chip-active' : ''}`}>
              {profile?.is_premium ? 'Premium' : 'Free'}
            </span>
            {profile?.verified && <VerifiedBadge />}
          </div>
        </div>
        {!profile?.is_premium && (
          <Link to="/premium" className="btn-gold px-3 py-2 text-xs">
            Go Premium
          </Link>
        )}
      </div>

      {loading || !form ? (
        <Spinner />
      ) : (
        <form onSubmit={save} className="card space-y-5 p-5">
          {role === 'founder' ? (
            <>
              <div>
                <label className="label">Company name</label>
                <input className="input" value={form.company_name ?? ''}
                  onChange={(e) => set('company_name')(e.target.value)} />
              </div>
              <div>
                <label className="label">One-liner</label>
                <textarea className="input min-h-20" maxLength={140} value={form.one_liner ?? ''}
                  onChange={(e) => set('one_liner')(e.target.value)} />
              </div>
              <div>
                <label className="label">Funding stage</label>
                <div className="flex flex-wrap gap-2">
                  {FUNDING_STAGES.map((s) => (
                    <button type="button" key={s.value} onClick={() => set('funding_stage')(s.value)}
                      className={`chip ${form.funding_stage === s.value ? 'chip-active' : ''}`}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Ticket size needed</label>
                <div className="flex flex-wrap gap-2">
                  {TICKET_SIZES.map((t) => (
                    <button type="button" key={t.value} onClick={() => set('ticket_size')(t.value)}
                      className={`chip ${form.ticket_size === t.value ? 'chip-active' : ''}`}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Industry</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((i) => (
                    <button type="button" key={i} onClick={() => set('industry')(i)}
                      className={`chip ${form.industry === i ? 'chip-active' : ''}`}>{i}</button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Name</label>
                <input className="input" value={form.name ?? ''}
                  onChange={(e) => set('name')(e.target.value)} />
              </div>
              <div>
                <label className="label">Background</label>
                <textarea className="input min-h-20" maxLength={240} value={form.background ?? ''}
                  onChange={(e) => set('background')(e.target.value)} />
              </div>
              <div>
                <label className="label">Investment focus</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((i) => (
                    <button type="button" key={i} onClick={() => set('focus')(toggle(form.focus ?? [], i))}
                      className={`chip ${(form.focus ?? []).includes(i) ? 'chip-active' : ''}`}>{i}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Min ticket</label>
                  <select className="input" value={form.ticket_min ?? 25}
                    onChange={(e) => set('ticket_min')(Number(e.target.value))}>
                    {TICKET_SIZES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Max ticket</label>
                  <select className="input" value={form.ticket_max ?? 100}
                    onChange={(e) => set('ticket_max')(Number(e.target.value))}>
                    {TICKET_SIZES.map((t) => (
                      <option key={t.value} value={t.value}>{ticketLabel(t.value)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Stage preference</label>
                <div className="flex flex-wrap gap-2">
                  {STAGE_PREFS.map((s) => (
                    <button type="button" key={s.value}
                      onClick={() => set('stage_prefs')(toggle(form.stage_prefs ?? [], s.value))}
                      className={`chip ${(form.stage_prefs ?? []).includes(s.value) ? 'chip-active' : ''}`}>{s.label}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn-gold w-full" disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
          </button>
        </form>
      )}
    </AppShell>
  )
}
