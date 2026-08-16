# Production handoff

## Required before deployment

1. Apply `supabase/migrations/002_production_hardening.sql` to the configured Supabase project. The application depends on its approval columns, RPC functions, storage buckets, KYC table, and row-level security policies.
2. Confirm at least one trusted profile already has the `admin` role. Grant the first administrator only from the Supabase SQL editor or another service-role-controlled backend; never from the client application.
3. Configure the production deployment with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Never expose a service-role key to Expo or the browser.
4. Configure Supabase Auth site URL and redirect URLs for the production domain, and customize the email confirmation/reset templates.
5. Add a server-side M-PESA/payment provider before enabling deposits or payouts. The client intentionally refuses to simulate successful money movement.
6. Supply the final legal entity name, support contact, Terms of Service, Privacy Policy, mobile bundle identifiers, and store signing credentials.

## Release checks

```powershell
npm ci
npm run typecheck
npm run build:web
```

Test with separate client, landlord, hunter, retailer, mover, and administrator accounts. In particular, verify that a newly registered specialist remains on the client dashboard until an administrator approves the requested role.
