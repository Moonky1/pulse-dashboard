# Pulse Auth email templates — staged, not deployed

These templates are prepared for later controlled installation. They contain no secrets and have not been configured in Supabase. Subjects and copy are English to match the current Auth UI; localization can be reviewed separately.

## Shared rules

- Sender concept: `Pulse — Kampaign Kings`; final address requires company approval.
- Use the Supabase `{{ .ConfirmationURL }}` only as the CTA target. Do not display or log its tokenized value.
- Disable click tracking and link rewriting at the SMTP provider.
- Use the canonical, allowlisted Pulse callbacks selected by the client flow.
- No roles, employee IDs, departments, internal state, user metadata, scripts, remote fonts or tracking pixels.

## Verify email

Subject: `Verify your Pulse email`

```html
<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Arial,sans-serif;color:#172033">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border:1px solid #e4e8f1;border-radius:14px"><tr><td style="padding:32px">
<p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#12182a">Pulse</p>
<h1 style="font-size:24px;margin:0 0 16px">Verify your company email</h1>
<p style="line-height:1.6;margin:0 0 24px">Confirm that this email belongs to you to continue setting up your Pulse account.</p>
<a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#635bff;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:8px">Verify email</a>
<p style="font-size:13px;line-height:1.5;color:#667085;margin:24px 0 0">This secure link expires. If it no longer works, request a new verification email from Pulse. If you did not create an account, you can ignore this message.</p>
</td></tr></table></td></tr></table></body></html>
```

## Password recovery

Subject: `Reset your Pulse password`

```html
<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Arial,sans-serif;color:#172033"><table role="presentation" width="100%"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:560px;background:#fff;border:1px solid #e4e8f1;border-radius:14px"><tr><td style="padding:32px"><p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#12182a">Pulse</p><h1 style="font-size:24px;margin:0 0 16px">Reset your password</h1><p style="line-height:1.6;margin:0 0 24px">Use the secure button below to choose a new Pulse password.</p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#635bff;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:8px">Reset password</a><p style="font-size:13px;line-height:1.5;color:#667085;margin:24px 0 0">This link expires and can be used only for this recovery request. If you did not request it, ignore this message and contact your Pulse administrator if you are concerned.</p></td></tr></table></td></tr></table></body></html>
```

## Invitation

Subject: `You have been invited to Pulse`

```html
<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Arial,sans-serif;color:#172033"><table role="presentation" width="100%"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:560px;background:#fff;border:1px solid #e4e8f1;border-radius:14px"><tr><td style="padding:32px"><p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#12182a">Pulse</p><h1 style="font-size:24px;margin:0 0 16px">Your Pulse invitation</h1><p style="line-height:1.6;margin:0 0 24px">Kampaign Kings has invited you to complete your secure Pulse account.</p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#635bff;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:8px">Accept invitation</a><p style="font-size:13px;line-height:1.5;color:#667085;margin:24px 0 0">This invitation expires. If it was unexpected or no longer works, contact your Pulse administrator. Do not forward this email.</p></td></tr></table></td></tr></table></body></html>
```

## Email change confirmation

Subject: `Confirm your Pulse email change`

```html
<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Arial,sans-serif;color:#172033"><table role="presentation" width="100%"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:560px;background:#fff;border:1px solid #e4e8f1;border-radius:14px"><tr><td style="padding:32px"><p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#12182a">Pulse</p><h1 style="font-size:24px;margin:0 0 16px">Confirm your email change</h1><p style="line-height:1.6;margin:0 0 24px">Confirm the requested change to the email used for your Pulse identity.</p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#635bff;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:8px">Confirm email change</a><p style="font-size:13px;line-height:1.5;color:#667085;margin:24px 0 0">This secure link expires. If you did not request this change, do not use the link and contact your Pulse administrator immediately.</p></td></tr></table></td></tr></table></body></html>
```

Before deployment, preview each template in Supabase, validate its generated link host/redirect, test desktop/mobile clients, and obtain sender/DNS approval. Do not send a production test until custom SMTP is verified.
