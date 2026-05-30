// Supabase Edge Function: stripe-webhook
// Listens for Stripe subscription lifecycle events and flips the user's
// `is_premium` / `verified` flags. Uses the service-role key to bypass RLS.
//
// Deploy:  supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets: supabase secrets set STRIPE_SECRET_KEY=sk_test_... \
//                                STRIPE_WEBHOOK_SECRET=whsec_... \
//                                SUPABASE_SERVICE_ROLE_KEY=...
// Then register the function URL as a webhook endpoint in the Stripe dashboard.
//
// deno-lint-ignore-file no-explicit-any
import Stripe from 'https://esm.sh/stripe@16?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2024-06-20',
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

async function setPremium(userId: string, premium: boolean) {
  if (!userId) return
  await admin
    .from('profiles')
    .update({ is_premium: premium, verified: premium })
    .eq('id', userId)
}

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider,
    )
  } catch (err: any) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await setPremium(session.metadata?.user_id ?? session.client_reference_id ?? '', true)
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const active = sub.status === 'active' || sub.status === 'trialing'
        await setPremium(sub.metadata?.user_id ?? '', active)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await setPremium(sub.metadata?.user_id ?? '', false)
        break
      }
    }
  } catch (err: any) {
    return new Response(`Handler error: ${err.message}`, { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
