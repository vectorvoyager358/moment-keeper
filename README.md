# Moment Keeper

**A quiet home for the moments you want to remember.**

Moment Keeper is a private, media-rich journal for capturing everyday memories without the pressure of writing a traditional diary. Save a few words, places that mattered, attach media, and return to those moments whenever you need them.

[Open Moment Keeper](https://moment-keeper-two.vercel.app)

## What you can do

- Capture moments with text, photos, videos, voice memos, and links
- Add dates, locations, themes, tags, and favorites
- Browse memories through a journal, media gallery, or calendar
- Search and filter moments by words, tags, themes, and media type
- Revisit meaningful memories through resurfacing and “On this day”
- View photos and videos in an immersive, responsive media viewer
- Install the app on mobile or desktop as a Progressive Web App
- Keep every account private with authenticated, user-scoped data

## Built with

- [Next.js](https://nextjs.org) and [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) for authentication, PostgreSQL, and storage
- [Serwist](https://serwist.pages.dev) for Progressive Web App support
- [Vercel](https://vercel.com) for hosting and analytics
- [Sentry](https://sentry.io) for optional error monitoring
- [Vitest](https://vitest.dev) and Testing Library for automated tests

## Run locally

### Requirements

- Node.js 20 or newer
- npm
- A Supabase project

### Setup

1. Install the dependencies:

```bash
 npm install
```

2. Create your local environment file:

```bash
 cp .env.example .env.local
```

3. Add your Supabase project credentials to `.env.local`:

```env
 NEXT_PUBLIC_SUPABASE_URL=your-project-url
 NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
```

4. In Supabase, enable email authentication and configure:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`
- Redirect URL: `http://localhost:3000/**`

5. Apply the SQL files in `supabase/migrations` in filename order.
6. Start the app:

```bash
 npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command                | Purpose                           |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start the development server      |
| `npm run dev:clean`    | Clear the Next.js cache and start |
| `npm run build`        | Create a production build         |
| `npm run start`        | Run the production build locally  |
| `npm run lint`         | Check the code with ESLint        |
| `npm run format:check` | Check formatting with Prettier    |
| `npm test`             | Run the Vitest test suite         |
| `npm run test:watch`   | Run tests in watch mode           |

## Deploy

Import the repository into Vercel and add these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
```

After deployment, update the Supabase Site URL and allowed redirect URLs to use
your production domain. Sentry and Vercel Analytics can be enabled independently
when needed.

## License

Released under the [MIT License](LICENSE).
