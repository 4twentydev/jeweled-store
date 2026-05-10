import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(1),
  ADMIN_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string().min(1).optional(),
  ADMIN_NOTIFICATION_EMAIL: z.email().optional(),
})

type Env = z.infer<typeof envSchema>
let _env: Env | undefined

const checkoutEnvSchema = envSchema.pick({
  STRIPE_SECRET_KEY: true,
  NEXT_PUBLIC_APP_URL: true,
})

type CheckoutEnv = z.infer<typeof checkoutEnvSchema>
let _checkoutEnv: CheckoutEnv | undefined

const stripeSecretEnvSchema = envSchema.pick({
  STRIPE_SECRET_KEY: true,
})

type StripeSecretEnv = z.infer<typeof stripeSecretEnvSchema>
let _stripeSecretEnv: StripeSecretEnv | undefined

export function getEnv(): Env {
  if (_env) return _env
  _env = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL,
  })
  return _env
}

export function getCheckoutEnv(): CheckoutEnv {
  if (_checkoutEnv) return _checkoutEnv
  _checkoutEnv = checkoutEnvSchema.parse({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  })
  return _checkoutEnv
}

export function getStripeSecretEnv(): StripeSecretEnv {
  if (_stripeSecretEnv) return _stripeSecretEnv
  _stripeSecretEnv = stripeSecretEnvSchema.parse({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  })
  return _stripeSecretEnv
}
