/**
 * Architectural rules that vitest enforces alongside the normal unit
 * suite. These exist because we've shipped real production-down
 * regressions for class-of-bug reasons that lint won't catch.
 *
 * Rule 1 (added 2026-05-26): no Clerk hooks in src/pages/*.
 *
 *   `useUser`, `useAuth`, `useClerk`, `useSession`, `useSignIn`,
 *   `useSignUp` from `@clerk/clerk-react` throw "ClerkInstanceContext
 *   not found" at render time when `<ClerkProvider>` isn't mounted.
 *   Our provider only mounts when both `VITE_CLERK_PUBLISHABLE_KEY`
 *   starts with `pk_` AND `VITE_AUTH_REQUIRED === "1"`. A Pages
 *   production build that's missing one of those env vars will
 *   white-screen any page that calls a Clerk hook at top level.
 *
 *   That's exactly what happened to `/` on 2026-05-26 (hotfix #104).
 *
 *   Routed pages are the load-bearing surface — a Clerk hook in a
 *   page renders the white screen. Other components (primers, etc.)
 *   are only reached deeper in the app, so they're scoped out of
 *   this rule for now. If we extend later, hydrate Clerk-derived
 *   data into `useUserStore` via the worker and read from the store
 *   instead of calling Clerk hooks directly.
 */

import { describe, expect, it } from "vitest";

const CLERK_HOOKS = ["useUser", "useAuth", "useClerk", "useSession", "useSignIn", "useSignUp"];

// Read every page source file at test time via Vite's glob with raw
// loader. No node:fs needed — runs in jsdom + Vite.
const pageSources = import.meta.glob("./pages/*.tsx", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

describe("architecture: no Clerk hooks in src/pages/*", () => {
  it("page modules must not import Clerk hooks (hydrate via userStore instead)", () => {
    const violations: Array<{ file: string; hook: string }> = [];

    for (const [file, text] of Object.entries(pageSources)) {
      if (!text.includes("@clerk/clerk-react")) continue;
      const importBlocks = text.match(/import\s*\{[^}]*\}\s*from\s*["']@clerk\/clerk-react["']/g) || [];
      for (const block of importBlocks) {
        for (const hook of CLERK_HOOKS) {
          // Word-boundary so `useUserStore` doesn't match `useUser`.
          if (new RegExp(`\\b${hook}\\b`).test(block)) {
            violations.push({ file, hook });
          }
        }
      }
    }

    if (violations.length > 0) {
      const msg = violations.map((v) => `  ${v.file}: imports \`${v.hook}\` from @clerk/clerk-react`).join("\n");
      throw new Error(
        `Pages must not import Clerk hooks directly — they throw at render time when ClerkProvider isn't mounted.\n` +
          `Hydrate firstName/etc. into useUserStore via the worker and read from the store instead.\n\n` +
          `Found ${violations.length} violation${violations.length === 1 ? "" : "s"}:\n${msg}`
      );
    }
    expect(violations).toEqual([]);
  });
});
