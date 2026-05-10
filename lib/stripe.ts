import Stripe from "stripe"
import { getStripeSecretEnv } from "@/lib/env"

let _stripe: Stripe | undefined

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  _stripe = new Stripe(getStripeSecretEnv().STRIPE_SECRET_KEY)
  return _stripe
}
