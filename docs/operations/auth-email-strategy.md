# Pulse Auth email strategy

## Assessment and decision

Pulse uses Supabase Auth email/password. Site URL is `https://www.pulse-kk.com`; production verification/recovery callbacks are exact allowlisted `/auth/callback` URLs. Exact Preview callbacks remain and Google OAuth is disabled.

AUTH-7 verified in the Supabase Dashboard that **custom SMTP is disabled**. Pulse therefore uses Supabase default delivery. Supabase documents that default delivery is non-production: only pre-authorized project-team addresses, currently two messages/hour, and no delivery SLA.

The company mail account is managed by Google Workspace, but the DNS/domain administrator and authority to add sending records are external to the current Pulse operator. No SMTP or DNS change is authorized until that owner approves the sender, provider account and exact DNS records.

**Configure company-owned custom SMTP before normal employee rollout.** Default delivery is acceptable only for controlled operator testing. Custom SMTP needs a business owner, separate Auth sender, SPF/DKIM/DMARC, provider MFA, bounce/complaint monitoring, and emergency provider-switch plan. Do not mix Auth and marketing reputation.

Recommended strategy: a Kampaign Kings-owned transactional provider account (Postmark or Resend) using a dedicated subdomain such as `auth.kampaignkings.com`. Prefer Postmark when operational delivery/audit support is the priority; Resend is also acceptable if company ownership, MFA, bounce monitoring and DNS controls are equivalent. Do not use Simon's Gmail password or a personal Google app password as Pulse infrastructure. Google Workspace SMTP relay remains an option only if the Workspace administrator explicitly owns and supports it.

Before rollout, verify without exposing credentials: sender identity; SMTP ownership/health; verify/recovery/invitation/email-change templates; rate limits and OTP/link expiry; secure email-change/confirmation settings; exact redirects; provider logs with tokens redacted.

## Template system

Use one restrained, mobile-first Pulse shell: simple brand header, readable corporate content, one action button, plain footer. Keep HTML small, avoid tracking pixels/images, and provide equivalent plain text.

| Template | Required content |
| --- | --- |
| Verify | email-ownership purpose, single action, expiry/retry and ignore-if-unrequested text |
| Recovery | single reset action, expiry/security guidance; public UI remains non-enumerating |
| Invitation | Pulse purpose, authorized acceptance action, expiry and support path |
| Email change | requested action and security implications without unnecessary profile data |

Use Supabase `ConfirmationURL` or reviewed token-hash callback construction. Redirects must be allowlisted. Disable provider link tracking because rewritten Auth links can break verification. Never include passwords, tokens, employee IDs, roles, departments, private metadata, or user-supplied HTML.

## Delivery operations

- Resend only by explicit action with cooldown; never loop automatically.
- Reconcile Auth/provider state before retrying an uncertain send.
- Expired links require a fresh request, never manual confirmation or `auth.users` SQL.
- Audit sanitized type, actor, Auth user ID, result, and time—never the link/token.
- Monitor bounce, complaint, suppression, rate-limit, and latency.

## Google OAuth prerequisites

Wait for stable email/password and recovery, corporate Google Cloud ownership, owned credentials/consent screen, exact callbacks, approved domain policy, and tested linking/duplicate-email behavior. Define how an existing password account links Google and how support recovers/offboards it without creating a second Pulse identity.

References: https://supabase.com/docs/guides/auth/auth-smtp · https://supabase.com/docs/guides/auth/auth-email-templates · https://supabase.com/docs/guides/auth/redirect-urls
