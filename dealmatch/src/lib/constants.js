// Shared option sets and labels used across forms and the feed.

export const INDUSTRIES = ['FinTech', 'HealthTech', 'SaaS', 'Other']

// Ticket sizes are stored as EUR thousands.
export const TICKET_SIZES = [
  { value: 25, label: '25k' },
  { value: 50, label: '50k' },
  { value: 100, label: '100k' },
  { value: 200, label: '200k+' },
]

export const FUNDING_STAGES = [
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
]

export const STAGE_PREFS = [
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
]

export const FREE_DAILY_LIMIT = 5
export const PREMIUM_PRICE_LABEL = '99€/month'

export const stageLabel = (value) =>
  STAGE_PREFS.find((s) => s.value === value)?.label ?? value

export const ticketLabel = (value) =>
  TICKET_SIZES.find((t) => t.value === value)?.label ?? `${value}k`
