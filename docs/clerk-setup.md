# Clerk + Next.js App Router setup

Verbatim quickstart received from Clerk's docs API on 2026-05-02. Stashed here for M2 reference; auth wiring is deferred to M2 per [DECISIONS.md ADR-001](../DECISIONS.md).

This is the **base Clerk + Next.js 16 quickstart only**. The Convex bridge (`ConvexProviderWithClerk` from `convex/react-clerk`, plus the JWT template `aud` claim configured in Clerk's dashboard) is **not** covered here and will need to be looked up from Convex's docs at M2 kick-off.

When wiring auth at M2, **first** verify the anonymous → linked-account flow works through the Clerk bridge — see ADR-001 consequences. The brief (AGENTS.md §7.6) requires "one-click anonymous play that can be later linked to an account."

---

## Add Clerk to Next.js App Router

If a Next.js App Router project does not already exist, first create one using:

```bash
npx create-next-app@latest my-clerk-app --yes
```

(For Backpacker, use `bun add @clerk/nextjs` — we are on Bun, not npm.)

## Summary

Install `@clerk/nextjs@latest`. Create `proxy.ts` with `clerkMiddleware()` from `@clerk/nextjs/server` (in `src/` if it exists, otherwise project root). Add `<ClerkProvider>` inside `<body>` in `app/layout.tsx`. Use `<Show>`, `<UserButton>`, `<SignInButton>`, `<SignUpButton>` from `@clerk/nextjs`.

Latest docs: https://clerk.com/docs/nextjs/getting-started/quickstart

## Install

```bash
bun add @clerk/nextjs
```

## proxy.ts

(Next.js 16 renamed `middleware.ts` to `proxy.ts`. Backpacker is on Next.js 16, so `proxy.ts` is correct.)

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

## app/layout.tsx

```typescript
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <header>
            <Show when="signed-out">
              <SignInButton />
              <SignUpButton />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
```

> **Note for M2 wiring:** Backpacker's `app/layout.tsx` already wraps `<body>` with `NextIntlClientProvider` and `BackpackerConvexProvider`. `<ClerkProvider>` should sit at the outermost position inside `<body>`, with `BackpackerConvexProvider` re-implemented to be `ConvexProviderWithClerk` (from `convex/react-clerk`) so Convex receives the Clerk identity. The header / `<Show>` blocks shown above are illustrative — Backpacker's actual auth UI surface is M2's design call (likely buried in a journal/settings view, not the splash header).

## Rules

ALWAYS:

- Use `clerkMiddleware()` from `@clerk/nextjs/server` in `proxy.ts`
- Add `<ClerkProvider>` inside `<body>` in `app/layout.tsx`
- Import from `@clerk/nextjs` or `@clerk/nextjs/server`
- Use App Router (app/page.tsx, app/layout.tsx)
- async/await with `auth()` from `@clerk/nextjs/server`
- Use existing package manager (Bun for Backpacker)

NEVER:

- Reference `_app.tsx` or pages router
- Use `authMiddleware()` (replaced by `clerkMiddleware()`)
- Use old env var patterns
- Import deprecated APIs (`withAuth`, old `currentUser`)
- Use deprecated `<SignedIn>` / `<SignedOut>` (replaced by `<Show>`)

## Deprecated (DO NOT use)

```typescript
import { authMiddleware } from '@clerk/nextjs' // WRONG
function MyApp({ Component, pageProps }) {} // pages router, WRONG
// pages/signin.js // WRONG
// <SignedIn> // WRONG, use <Show when="signed-in">
// <SignedOut> // WRONG, use <Show when="signed-out">
```

## Next steps when M2 begins

1. Add Clerk keys to `.env.local`:

   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

2. Configure a JWT template in the Clerk dashboard with the `aud` claim Convex expects (look up Convex's current docs for the exact value — this is the bridge piece NOT covered in the quickstart above).
3. Replace `BackpackerConvexProvider` (`app/_lib/convex.tsx`) with the `ConvexProviderWithClerk` pattern.
4. Verify anonymous → linked flow (per AGENTS.md §7.6 requirement).
5. Sign up as the first test user through whatever auth UI surface M2 design lands on.
6. Verify `<UserButton>` (or whatever surface replaces it) renders post-signup.

## Resources

- Organizations: https://clerk.com/docs/guides/organizations/overview
- Components: https://clerk.com/docs/reference/components/overview
- Clerk dashboard: https://dashboard.clerk.com/
