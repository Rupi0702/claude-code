import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  INDUSTRIES,
  TICKET_SIZES,
  FUNDING_STAGES,
  STAGE_PREFS,
  ticketLabel,
} from '../lib/constants'
import Logo from '../components/Logo'
import Spinner from '../components/Spinner'

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function Onboarding() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Founder fields
  const [companyName, setCompanyName] = useState('')
  const [oneLiner, setOneLiner] = useState('')
  const [fStage, setFStage] = useState('pre_seed')
  const [ticket, setTicket] = useState(50)
  const [industry, setIndustry] = useState('SaaS')

  // Investor fields
  const [name, setName] = useState('')
  const [background, setBackground] = useState('')
  const [focus, setFocus] = useState(['FinTech'])
  const [ticketMin, setTicketMin] = useState(25)
  const [ticketMax, setTicketMax] = useState(100)
  const [stagePrefs, setStagePrefs] = useState(['pre_seed', 'seed'])

  if (loading) return <Spinner label="Loading…" />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.onboarded) return <Navigate to="/feed" replace />

  const role = profile?.role ?? 'founder'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (role === 'founder') {
        const { error } = await supabase.from('founder_profiles').upsert({
          id: user.id,
          company_name: companyName.trim(),
          one_liner: oneLiner.trim(),
          funding_stage: fStage,
          ticket_size: ticket,
          industry,
        })
        if (error) throw error
      } else {
        if (ticketMax < ticketMin) throw new Error('Max ticket must be ≥ min ticket.')
        const { error } = await supabase.from('investor_profiles').upsert({
          id: user.id,
          name: name.trim(),
          background: background.trim(),
          focus,
          ticket_min: ticketMin,
          ticket_max: ticketMax,
          stage_prefs: stagePrefs,
        })
        if (error) throw error
      }

      const { error: pErr } = await supabase
        .from('profiles')
        .update({ onboarded: true })
        .eq('id', user.id)
      if (pErr) throw pErr

      await refreshProfile()
      navigate('/feed', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-app px-6 py-8">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <Logo />
        <h1 className="mt-2 text-xl font-bold">
          {role === 'founder' ? 'Tell investors about your startup' : 'Set up your investor profile'}
        </h1>
        <p className="text-sm text-slate-400">This is what others see in the match feed.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 p-5">
        {role === 'founder' ? (
          <>
            <div>
              <label className="label">Company name</label>
              <input className="input" required value={companyName}
                onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme GmbH" />
            </div>
            <div>
              <label className="label">One-liner — the problem you solve</label>
              <textarea className="input min-h-20" required value={oneLiner} maxLength={140}
                onChange={(e) => setOneLiner(e.target.value)}
                placeholder="We help SMEs automate VAT filing across the EU." />
            </div>
            <div>
              <label className="label">Funding stage</label>
              <div className="flex flex-wrap gap-2">
                {FUNDING_STAGES.map((s) => (
                  <button type="button" key={s.value} onClick={() => setFStage(s.value)}
                    className={`chip ${fStage === s.value ? 'chip-active' : ''}`}>{s.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Ticket size needed</label>
              <div className="flex flex-wrap gap-2">
                {TICKET_SIZES.map((t) => (
                  <button type="button" key={t.value} onClick={() => setTicket(t.value)}
                    className={`chip ${ticket === t.value ? 'chip-active' : ''}`}>{t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Industry</label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((i) => (
                  <button type="button" key={i} onClick={() => setIndustry(i)}
                    className={`chip ${industry === i ? 'chip-active' : ''}`}>{i}</button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="label">Name</label>
              <input className="input" required value={name}
                onChange={(e) => setName(e.target.value)} placeholder="Jane Investor" />
            </div>
            <div>
              <label className="label">Background</label>
              <textarea className="input min-h-20" required value={background} maxLength={240}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Ex-founder, 12 angel investments in B2B SaaS." />
            </div>
            <div>
              <label className="label">Investment focus (industries)</label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((i) => (
                  <button type="button" key={i} onClick={() => setFocus((f) => toggle(f, i))}
                    className={`chip ${focus.includes(i) ? 'chip-active' : ''}`}>{i}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Min ticket</label>
                <select className="input" value={ticketMin}
                  onChange={(e) => setTicketMin(Number(e.target.value))}>
                  {TICKET_SIZES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Max ticket</label>
                <select className="input" value={ticketMax}
                  onChange={(e) => setTicketMax(Number(e.target.value))}>
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
                  <button type="button" key={s.value} onClick={() => setStagePrefs((p) => toggle(p, s.value))}
                    className={`chip ${stagePrefs.includes(s.value) ? 'chip-active' : ''}`}>{s.label}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" className="btn-gold w-full" disabled={busy}>
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
