import { supabase } from './supabase'

// Returns the set of user ids the viewer should NOT see in the feed:
// themselves, anyone they've already sent a request to, and anyone they're
// already matched with.
export async function getExcludedIds(userId) {
  const excluded = new Set([userId])

  const { data: reqs } = await supabase
    .from('match_requests')
    .select('to_user')
    .eq('from_user', userId)
  reqs?.forEach((r) => excluded.add(r.to_user))

  const { data: matches } = await supabase
    .from('matches')
    .select('user_low, user_high')
    .or(`user_low.eq.${userId},user_high.eq.${userId}`)
  matches?.forEach((m) => {
    excluded.add(m.user_low === userId ? m.user_high : m.user_low)
  })

  return excluded
}

// Sends a match request. If the target already has a pending request to the
// current user, we accept it instead, which creates the match immediately.
// Returns { matched: boolean }.
export async function sendMatchRequest(fromUserId, toUserId) {
  const { data: incoming } = await supabase
    .from('match_requests')
    .select('id')
    .eq('from_user', toUserId)
    .eq('to_user', fromUserId)
    .eq('status', 'pending')
    .maybeSingle()

  if (incoming) {
    const { error } = await supabase.rpc('accept_match_request', { request_id: incoming.id })
    if (error) throw error
    return { matched: true }
  }

  const { error } = await supabase
    .from('match_requests')
    .insert({ from_user: fromUserId, to_user: toUserId })
  if (error) throw error
  return { matched: false }
}

// Logs that a set of candidates was served to the viewer today.
export async function logServed(viewerId, candidateIds) {
  if (!candidateIds.length) return
  const rows = candidateIds.map((id) => ({ viewer_id: viewerId, candidate_id: id }))
  await supabase.from('feed_views').upsert(rows, { onConflict: 'viewer_id,candidate_id,served_on' })
}

export async function getServedTodayIds(viewerId) {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('feed_views')
    .select('candidate_id')
    .eq('viewer_id', viewerId)
    .eq('served_on', today)
  return new Set(data?.map((r) => r.candidate_id) ?? [])
}
