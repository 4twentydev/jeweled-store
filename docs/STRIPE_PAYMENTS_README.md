# Stripe Payments Setup

This guide is for a store owner or operator who needs the site to receive payments. No code changes are required, but you will need access to Stripe and the site hosting account.

## What Stripe Does For This Store

Stripe handles the secure payment page. The store sends the cart to Stripe, the customer pays on Stripe's checkout page, and Stripe tells the store when payment is complete.

The important part is the webhook. Without the webhook, customers may pay, but the store will not reliably create orders or update inventory.

## Accounts And Access Needed

You need:

- Access to the Stripe account.
- Access to the Vercel project or whoever manages environment variables for the site.
- The live website URL.
- The admin login for the store.

## Step 1: Activate The Stripe Account

1. Go to the Stripe Dashboard.
2. Complete Stripe's business setup and identity checks.
3. Add the bank account where payouts should be deposited.
4. Confirm that payments and payouts are enabled.

Use Stripe test mode while setting up. Switch to live mode only when the site is ready to accept real payments.

## Step 2: Add Stripe API Keys To The Site

In Stripe:

1. Open the Developers section.
2. Open API keys.
3. Copy the publishable key.
4. Copy the secret key.

In Vercel:

1. Open the JWLD project.
2. Open Settings.
3. Open Environment Variables.
4. Add these values:

```text
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = Stripe publishable key
STRIPE_SECRET_KEY = Stripe secret key
```

Use test keys for test deployments and live keys for production.

## Step 3: Add The Stripe Webhook

In Stripe:

1. Open Developers.
2. Open Webhooks.
3. Click to add an endpoint.
4. Use this endpoint URL:

```text
https://your-domain.com/api/stripe/webhook
```

Replace `https://your-domain.com` with the real live site URL.

Select these events:

```text
checkout.session.completed
checkout.session.expired
```

Save the endpoint.

## Step 4: Add The Webhook Secret To The Site

After creating the webhook, Stripe shows a signing secret. It usually starts with `whsec_`.

In Vercel:

1. Open the JWLD project.
2. Open Settings.
3. Open Environment Variables.
4. Add:

```text
STRIPE_WEBHOOK_SECRET = Stripe webhook signing secret
```

This value must come from the exact webhook endpoint for this site.

## Step 5: Confirm The Site URL

In Vercel environment variables, confirm:

```text
NEXT_PUBLIC_APP_URL = https://your-domain.com
```

This tells Stripe where to send customers after they pay or cancel checkout.

For production, this should be the real public domain, not a temporary preview URL.

## Step 6: Redeploy The Site

After adding or changing environment variables:

1. Go to the Vercel project.
2. Open Deployments.
3. Redeploy the latest production deployment.

Environment variable changes do not fully apply until the site is redeployed.

## Step 7: Make A Test Purchase

Before accepting real customer orders:

1. Create or confirm an active product in the store admin.
2. Make sure the product stock is at least `1`.
3. Add the product to the cart on the public site.
4. Start checkout.
5. Pay through Stripe.
6. Return to the store success page.
7. Open `/admin/orders`.
8. Confirm the order appears.
9. Open `/admin/products`.
10. Confirm the product stock went down.

For a live test, use a real card and refund the payment in Stripe afterward.

## How To Know It Is Working

Payments are connected correctly when:

- The customer can reach Stripe Checkout from the cart.
- Stripe shows the payment as successful.
- The order appears in the store admin.
- Product stock changes after the order.
- The Stripe webhook log shows successful `200` responses.

## Refunds

Refunds are handled in Stripe:

1. Open the Stripe Dashboard.
2. Find the payment.
3. Click Refund.
4. Choose full or partial refund.

Refunding in Stripe does not automatically put inventory back into stock. If the product should be sold again, update the stock manually in the store admin.

## Custom Commission Payments

Custom requests use a manual Stripe payment link.

To quote a custom request:

1. Open Stripe.
2. Create a Payment Link for the quoted amount.
3. Copy the payment link.
4. Open the store admin.
5. Go to Custom.
6. Open the customer's request.
7. Enter the quote amount.
8. Paste the Stripe payment link.
9. Set the status to `Quoted`.
10. Save the request.

If email notifications are configured, the customer receives the quote and payment link.

After the customer pays the payment link, update the custom request status in admin as needed. Standard product checkout webhooks create store orders automatically, but custom payment links are tracked manually in the custom request workflow.

## Common Problems

### Checkout Does Not Start

Check:

- `STRIPE_SECRET_KEY` is present.
- `NEXT_PUBLIC_APP_URL` is correct.
- The site was redeployed after adding keys.
- The product is active and has stock.

### Payment Succeeds But No Order Appears

Check:

- The Stripe webhook endpoint is `/api/stripe/webhook`.
- The webhook has `checkout.session.completed` selected.
- `STRIPE_WEBHOOK_SECRET` is set in Vercel.
- The webhook secret belongs to the same endpoint and mode as the payment.
- Stripe webhook logs show `200` responses.

### Inventory Does Not Return After Abandoned Checkout

Check:

- The webhook has `checkout.session.expired` selected.
- Stripe webhook logs show successful delivery.

### Test Mode And Live Mode Are Mixed

Stripe test keys, live keys, test webhooks, and live webhooks are separate. Use all test values together or all live values together.
