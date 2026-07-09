# Analytics — Moment Keeper

Moment Keeper uses **Vercel Web Analytics** for privacy-friendly, aggregate traffic insights. No Google Analytics, no ad trackers, no session replay.

## What is tracked

| Data                       | Collected? | Notes                                                              |
| -------------------------- | ---------- | ------------------------------------------------------------------ |
| Page views (route path)    | Yes        | e.g. `/timeline`, `/capture` — not query strings with search terms |
| Referrer (domain only)     | Yes        | Where the visitor came from                                        |
| Country / region           | Yes        | From IP, aggregated                                                |
| Device type / browser / OS | Yes        | Aggregated                                                         |
| User ID / email            | **No**     | Auth state is never sent                                           |
| Moment body text           | **No**     |                                                                    |
| Media filenames or URLs    | **No**     |                                                                    |
| Search queries             | **No**     |                                                                    |
| Custom events              | **No**     | Only automatic page views                                          |

## What is not tracked

- Development (`npm run dev`) — the SDK does not send events locally
- Local production builds (`npm run build && npm start`) — events only flow when deployed on Vercel with Analytics enabled in the dashboard

## How to enable (production)

1. Vercel dashboard → your project → **Analytics** → **Enable**
2. Deploy a build that includes `@vercel/analytics` (already in this repo)
3. Data appears in the Vercel Analytics tab after traffic hits production

## How to disable

Set in Vercel env (or `.env.local`):

```
NEXT_PUBLIC_ANALYTICS_DISABLED=true
```

Redeploy. The `<Analytics />` component will not render.

## Why Vercel Web Analytics

- Already hosted on Vercel — no extra vendor account
- Cookie-free, GDPR-friendly aggregate metrics ([Vercel docs](https://vercel.com/docs/analytics))
- Complements Sentry (errors) without overlapping — Sentry captures failures; analytics captures usage patterns

## Related

- Error tracking: Sentry via `NEXT_PUBLIC_SENTRY_DSN` (see `.env.example`)
- Decision log: `docs/decisions.md`
