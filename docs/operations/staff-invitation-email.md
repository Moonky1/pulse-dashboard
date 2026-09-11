# Pulse Staff invitation email

Status: prepared for AUTH-12 Stage 2; delivery and custom SMTP remain disabled.

## Product copy

- Subject: `You're invited to Pulse`
- Future sender name: `Pulse — Kampaign Kings`
- CTA: `Accept invitation`
- Expiry: render the server-owned expiry in the recipient's locale and state that the link can be used once.
- Inviter: include the server-resolved inviter display name when available; omit it rather than substituting browser input.

Suggested body:

> You've been invited to join Pulse.
>
> Accept this invitation to verify your identity and continue to Pulse's approval step. This invitation expires {{ .Data.expires_at }} and does not grant access by itself.
>
> Accept invitation
>
> If you were not expecting this invitation, you can ignore this email. Never forward the invitation link.

The final HTML and plaintext templates must use Supabase-owned confirmation values. They must not embed a role, scope, Department, Team, Campaign, Position, actor ID, service key, or a browser-provided redirect.

## Stage 2 SMTP prerequisites

1. Approve an email provider and a dedicated sender subdomain, such as `notify.<approved-company-domain>`.
2. Publish and verify provider-specific SPF and DKIM records.
3. Publish DMARC first in monitoring mode, review aggregate reports, then tighten policy deliberately.
4. Approve a From address on the verified subdomain and the From name `Pulse — Kampaign Kings`.
5. Configure Supabase custom SMTP host, port, username, password, sender address, and sender name through project secrets only.
6. Configure the invite template and exact allowed Site URL/redirect URL.
7. Align Supabase Email OTP expiration with the Pulse invitation expiry. AUTH-12 Stage 1 uses one hour because that matches the current project-default Supabase invite-token lifetime.
8. Set conservative Auth email rate limits and provider quotas; validate bounce, suppression, retry, and abuse handling.
9. Use one explicitly approved synthetic mailbox for end-to-end validation before any employee invitation.
10. Rotate any temporary credential after validation and document ownership and recovery.
