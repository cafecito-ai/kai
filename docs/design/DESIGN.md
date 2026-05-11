# DESIGN.md — Project North Star

> **Purpose:** Design system for Project North Star. Defines three candidate visual directions, the system tokens for each, and the rules for implementing the chosen direction. This document is read alongside `CLAUDE.md` — `CLAUDE.md` is the product spec, `DESIGN.md` is the visual layer.

---

## 0. Context

The current implementation at `kai.boostaisearch.ai` ships working plumbing — auth, onboarding, food-photo, safety screening — but the visual layer reads as adult-wellness-app-by-default. Palette tokens like `ink`, `paper`, `mist`, `sage`, `plum` are stationery-shop colors applied to a product for 16-year-olds. The cultural register is off, and a teenager will clock that in the first two seconds of opening the site.

The fix is not a palette swap. The fix is a real design system built around three specific decisions:

1. A visual direction (lane) that establishes feel
2. A type pairing that carries personality
3. A character treatment for Kai that has identity, not just a placeholder shape

This document presents three candidate directions, each fully specified. **The product visionary (Lev) picks one.** Once locked, the chosen direction becomes the canonical system and the other two specs are archived.

---

## 1. The three directions

Each direction is a complete visual system, not just a palette. Each has working HTML prototypes Lev can open on his phone.

### Direction 01 — Bold & Electric

**Reference:** Linear × Discord × After Effects

**Reads as:** A premium product made by people who know what teens are actually scrolling at 11pm. Confident, kinetic, slightly cocky.

**The system:**

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#07080C` | Page base, near-black with a touch of blue |
| `--bg-elevated` | `#0E1119` | Card surfaces |
| `--surface` | `#161A26` | Elevated cards |
| `--surface-2` | `#1E2332` | Hover surfaces |
| `--border` | `#2A3145` | Default borders |
| `--border-bright` | `#3A4467` | Active borders |
| `--text` | `#F5F7FA` | Primary text |
| `--text-dim` | `#A8B0C2` | Secondary text |
| `--text-mute` | `#6B7591` | Tertiary text, microcopy |
| `--neon` | `#6EE7FF` | Signature cyan — primary accent |
| `--neon-2` | `#B084FF` | Electric purple — paired with cyan |
| `--neon-3` | `#FF7AE0` | Hot pink — used sparingly |
| `--neon-warm` | `#FFD86B` | Warm yellow — milestones |
| `--neon-green` | `#7CFFB2` | Spring green — success states |
| `--glow-cyan` | `0 0 24px rgba(110, 231, 255, 0.45), 0 0 60px rgba(110, 231, 255, 0.15)` | Glow on primary CTAs and Kai |

**Type:**
- Display & body: Inter (weights 400–900)
- Microcopy & labels: JetBrains Mono (weights 500, 700)
- Headlines use Inter at 800–900 with tight tracking (`-0.035em`)
- Gradient text treatment on punch words: `linear-gradient(135deg, var(--neon) 0%, var(--neon-3) 100%)`

**Motion:**
- Gradient blobs drift across the background on slow loop (12–14s ease-in-out alternate)
- Kai orb pulses on 4s breath cycle, with aura ring at 3s offset
- Streak milestones trigger glow burst
- All animation respects `prefers-reduced-motion`

**Kai treatment:**
- A gradient orb (cyan → purple → pink) with soft aura
- Animated breathing pulse
- No face, no anthropomorphism — Kai is a presence
- Sizes: 130px hero, 26px inline

**Copy voice:**
- Short sentences. Slightly cocky.
- "An AI that actually gets it."
- "Best you've ever had."
- Confident without being preachy.

**Best for:** Teens who already love Discord, Linear, productivity tools, anything with motion. Reads as "this product is for me and knows it."

**Risk:** Could read as overstimulating if motion isn't tuned carefully. Reduced-motion path must be a first-class fallback, not an afterthought.

---

### Direction 02 — Y2K Soft

**Reference:** Cash App × Be Real × Glossier

**Reads as:** A friend's well-loved zine that happens to be software. Warm, hand-made, playful, friendly without being childish.

**The system:**

| Token | Value | Use |
|-------|-------|-----|
| `--cream` | `#FFF8EE` | Page base, warm off-white |
| `--cream-dark` | `#FFEFD9` | Recessed surfaces |
| `--paper` | `#FFFFFF` | Card surfaces |
| `--ink` | `#1F1A2E` | Text and borders, near-black with purple undertone |
| `--ink-dim` | `#5C5470` | Secondary text |
| `--ink-soft` | `#8B83A0` | Tertiary text |
| `--plum` | `#6B4FBB` | Primary accent — used on primary CTAs |
| `--peach` | `#FF8B6A` | Pop color — used on Kai blob |
| `--sky` | `#7BC4F5` | Pop color — engine illustrations |
| `--grass` | `#A8DC8F` | Pop color — success / primary engine card |
| `--sun` | `#FFC95C` | Pop color — streak card |
| `--rose` | `#F5A1C9` | Pop color — character card |
| `--shadow-sticker` | `4px 4px 0 var(--ink)` | The signature offset shadow |
| `--shadow-sticker-sm` | `2px 2px 0 var(--ink)` | Smaller offset for inline elements |

**Type:**
- Display: Fraunces (serif, chunky weights 700–900, italic for emphasis)
- Body: Inter (400–800)
- Big numbers, headlines, and key emotional words use Fraunces italic in plum
- Labels use Inter at 700–800 weight, sometimes inside black-pill chips

**Motion:**
- Kai blob wiggles on 6s ease cycle (border-radius shifts, gentle rotation)
- Sticker shapes tilt and bounce on hover
- Press states use spring physics, not linear easing
- Less ambient, more punctuation

**Kai treatment:**
- A peach-colored blob with two eyes and pink blush spots
- Friendly mascot energy, slightly silly on purpose
- The blob shape animates (border-radius shifts)
- Sizes: 140px hero, 28px inline (still has eyes and blush)
- **Read this carefully:** Kai is anthropomorphic in this direction. If that feels wrong for the product's safety posture, this direction is not the choice.

**Copy voice:**
- Sentence fragments allowed.
- "A mentor that actually listens."
- "The group chat. Anything you don't feel like telling your parents."
- Friend-energy. Warm. Slightly older sibling.

**Best for:** Teens who follow softer creator aesthetics, gravitate to BeReal, Glossier, indie zines. Reads as "this product was made for me by people who actually like teens."

**Risk:** The blob mascot is a fork-in-the-road decision. Mascots cut against safety positioning for serious mental health conversations. Need to decide: does Kai-as-character serve the user or get in the way during heavy moments?

---

### Direction 03 — Calm but Distinctly Teen

**Reference:** Headspace, if it was designed in 2026 for 16-year-olds.

**Reads as:** A premium teen product. Editorial, intentional, refined. The kind of design that makes adults take it seriously and teens think it's actually for them.

**The system:**

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#FAFAF7` | Page base, warm off-white |
| `--bg-warm` | `#F4F1EB` | Recessed surfaces |
| `--paper` | `#FFFFFF` | Card surfaces |
| `--ink` | `#0A0A0A` | Near-black, used as inverse and primary brand |
| `--ink-2` | `#2A2A28` | Body text |
| `--ink-mute` | `#6B6B65` | Secondary text |
| `--ink-soft` | `#A8A8A0` | Tertiary text |
| `--line` | `#E5E2D9` | Subtle borders |
| `--accent` | `#5B47F0` | Signature indigo — one shade only |
| `--accent-soft` | `#EEEAFF` | Indigo tint for surfaces |
| `--warm` | `#FF6B45` | One warm coral pop, used sparingly |
| `--warm-soft` | `#FFE8DD` | Coral tint |
| `--green` | `#2D7A3E` | Success state |
| `--green-soft` | `#DCEEDF` | Success tint |
| `--radius-sm` | `14px` | Quick action chips |
| `--radius` | `22px` | Cards |
| `--radius-lg` | `32px` | Hero surfaces |

**Type:**
- Display: Inter Tight (weights 600–900, tracking `-0.04em`)
- Emphasis: Instrument Serif italic (weight 400)
- Body: Inter (400–700)
- The pairing of Inter Tight at heavy weight with Instrument Serif italic is the entire visual identity. Used everywhere consistently.

**Motion:**
- Kai aura breathes on 4s cycle (scale + opacity)
- Subtle hover lifts (transform translateY -2px)
- Page transitions slide
- No glow, no glitter, no gradient drift — refined motion only

**Kai treatment:**
- A black circle with a single italic letterform inside (Instrument Serif lowercase "k")
- The aura behind the circle breathes
- Reads as a wordmark, not a mascot
- Sizes: 132px hero, 26px inline
- Brand identity, not character identity

**Copy voice:**
- Confident, calm, dry humor.
- "For the stuff nobody tells you."
- "Your longest yet."
- Italics carry the emotional load — `<em>real</em> mentor`, `your <em>longest</em>`
- Numbers and superlatives in display weight, qualifiers in italic serif

**Best for:** Teens who appreciate craft, who follow editorial creators, who would download something because it looks intentional. Adults who see it will respect it, which matters when the product needs parental consent.

**Risk:** Could read as too understated if Lev wants more energy. The discipline of the system is its strength but only if Lev wants discipline; if he wants exuberance, this isn't it.

---

## 2. The decision

This is Lev's call. He's the product visionary, he runs a teen wellness Instagram following, he has the cultural read no agent or adult can replicate.

**How to pick:**

1. Open `design/index.html` in a browser (mobile preferred).
2. Tap into each prototype. Read them on a phone screen.
3. Send each one to one trusted friend. Ask: "Which feels like something you'd actually open?"
4. Pick the one that gets the most genuine "yes" reaction, not the one that's most impressive.

**There's no wrong answer.** All three are buildable, all three are safety-compatible, all three are agent-executable. The differences are tonal and they're the kind of decision that only Lev can make well.

**If none of them feel right:** That's the most valuable feedback we can get. Tell us what's off — too cold, too playful, wrong fonts, wrong colors, wrong character treatment — and we'll iterate. We'd rather rebuild from feedback than build the wrong thing.

---

## 3. Once a direction is locked

The chosen direction's prototype becomes the canonical reference. Three things happen next:

### 3.1 Token expansion

The prototype defines core tokens. The full token set adds:

```
Spacing scale:     4, 8, 12, 16, 20, 24, 32, 48, 64, 96 (px)
Radius scale:      4, 8, 12, 16, 20, 24, 32, 999 (px)
Border weights:    1, 1.5, 2, 3 (px)
Shadow scale:      none, sm, md, lg, sticker (for Y2K direction only)
Z-index scale:     0 (base), 10 (sticky), 20 (modal), 30 (toast), 100 (crisis overlay)
Type sizes:        11, 12, 13, 14, 15, 16, 18, 20, 22, 26, 30, 36, 42, 56, 72 (px)
Line heights:      0.9 (display), 1.0 (h1), 1.15 (h2), 1.3 (h3), 1.5 (body), 1.6 (long-form body)
Letter spacing:    -0.06em (large display), -0.04em (display), -0.03em, -0.02em, -0.01em, 0, 0.04em, 0.08em, 0.12em, 0.14em, 0.18em (eyebrow labels)
```

### 3.2 Tailwind config update

The current site uses Tailwind with custom tokens `ink`, `paper`, `mist`, `sage`, `plum`, `lime`, `amber`, `coral`, `night`, `danger`, `graphite`, and a single `--kai` radius. **These tokens are deprecated.** They get replaced with the chosen direction's tokens.

The Tailwind config update is a single file change in `tailwind.config.js`. The agent doing the rebuild starts there.

### 3.3 Component rebuild

The prototypes show home + onboarding + meet-Kai. The agent rebuilds:

1. App shell (header, nav, footer with crisis link, tabbar)
2. Landing page
3. Onboarding flow (all 8 steps from CLAUDE.md Section 8)
4. Meet Kai customization screen
5. Home dashboard
6. Engine entry screens (one per engine — visual variant per direction)
7. Kai chat surface (the most-touched component)
8. Progress tracker (`/progress`)
9. Crisis page (`/crisis` — always-accessible)
10. Settings

**Every component matches the prototype exactly for the chosen direction.** If a component isn't shown in the prototype, the agent extrapolates from the same system (same tokens, same type pairing, same motion grammar, same character treatment).

---

## 4. Rules that apply to all directions

These are non-negotiable regardless of which lane wins.

### 4.1 The crisis page is exempt from style flourishes

`/crisis` is a calm, high-contrast, very legible page. No motion. No gradients. No personality flourishes. Lives in every direction's system but uses the most reduced version of it.

- Background: the lightest neutral in the system
- Text: maximum contrast against background
- One column, max 540px wide
- Resources rendered as plain large links
- Loads in under 1 second, works offline (PWA cache)

The crisis page is the single most important page in the product, and design must not interfere with it.

### 4.2 The safety response card uses warm colors only

When the safety layer takes over a conversation, the response surface uses:

- A warm tint (not the system's loudest accent)
- No glow, no motion beyond a gentle fade-in
- Clear typography, generous line height (1.6)
- Crisis resources rendered as buttons sized at least 56px tall

### 4.3 Tabbar must be visible at all times

The bottom tabbar (Home / Engines / Progress / You) is fixed and translucent over content. Never auto-hides. Never replaced by a context-specific tabbar.

### 4.4 No emoji in Kai's responses by default

CLAUDE.md Section 1 specifies "no emoji in Kai's responses by default." This rule overrides any tendency in the chosen direction. Emojis are allowed in UI chrome (action chips, section labels) but not in conversational responses unless the user opts in or initiates.

### 4.5 Accessibility floors

Regardless of direction:

- Color contrast meets WCAG AA (4.5:1 for body, 3:1 for large text)
- Touch targets minimum 44 × 44 px
- All motion has `prefers-reduced-motion` fallback to instant transitions
- Keyboard navigation works for every interactive element
- Screen reader support: every icon has `aria-label`, every chart has text equivalent

### 4.6 Mobile-first, then scale up

Every component designed at 375px wide first. The current site is technically responsive but the design wasn't started at mobile, which shows. Rebuild starts at 375px.

### 4.7 Type pairing is the visual identity in directions 02 and 03

In directions 02 (Y2K Soft) and 03 (Calm Teen), the visual identity is carried by the type pairing more than the palette. Do not substitute fonts. Fraunces, Instrument Serif, Inter Tight are specific choices.

If a font fails to load, the fallback is `system-ui`, never another web font. Better to look plain than wrong.

### 4.8 Kai's identity is consistent in conversation surfaces

Once a direction is locked, Kai's visual treatment is the same everywhere Kai appears — onboarding hero, home card, chat surface, progress card. Resizing, not redesigning. The orb stays an orb. The blob stays a blob. The wordmark circle stays a wordmark circle.

---

## 5. What gets rebuilt vs. what stays

The current implementation at `kai.boostaisearch.ai` has working backend plumbing. The rebuild is a design-layer swap, not a from-scratch rebuild.

**Stays (no changes required):**
- Cloudflare Workers backend
- D1 schema and tables
- Clerk auth integration
- Resend email infrastructure
- Safety classifier prompts and pipeline
- Engine routing logic
- USDA + Cloudflare Workers AI food-photo pipeline
- The CLAUDE.md product spec — it's correct, just under-skinned

**Gets rebuilt:**
- `tailwind.config.js` — new token palette
- Every component file under `src/components/` — new visual language
- Every page under `src/pages/` — new layout and type system
- `index.html` — new fonts loaded, new meta theme color
- `public/avatars/` — new character art for the 10 progress levels matching the chosen direction
- Onboarding flow visuals (logic stays, screens get redesigned)

**Engineering estimate:** 2–3 weeks of focused work for the rebuild on top of working plumbing. The bulk is component-level rework, not architectural change.

---

## 6. Implementation order for agents

Once Lev picks a direction, agents execute in this order:

1. **Read this document and `CLAUDE.md` together.** They are a pair.
2. **Update `tailwind.config.js`** with the chosen direction's tokens. Run the dev server. Visual regression is expected and intentional.
3. **Rebuild the app shell** (header, footer with crisis link, tabbar). Confirm nav works on all current routes.
4. **Rebuild `/crisis`** first. Highest-priority page, simplest design pass, confirms the system works under maximum-contrast constraints.
5. **Rebuild landing page** matching prototype.
6. **Rebuild onboarding flow** matching prototype, all 8 steps from CLAUDE.md Section 8.
7. **Rebuild Kai chat surface.** The most-touched component. Spend the most time here.
8. **Rebuild engine entry screens** — Physical first, then Potential, then Mental.
9. **Rebuild `/progress`** with the new character treatment and chart.
10. **Rebuild settings.**
11. **Visual QA pass:** open every screen on a phone, screenshot, side-by-side with prototype.
12. **Real-user test** with 3–5 teens (separate from product testing).

**Do not skip step 4.** The crisis page is the canary. If the design system can't render `/crisis` at the right contrast and clarity, the system fails before it ships.

---

## 7. Notes for Lev (and Offy)

This is the part where the design system meets reality. Three things worth knowing:

**On picking:** Trust your gut. The exercise isn't "which one is most beautiful in isolation" — it's "which one feels like something I'd actually open on a Tuesday at 9pm." The most impressive option is rarely the most usable.

**On showing it to friends:** Three or four people max. Each one in private. Ask "which feels like something you'd use" — not "which looks coolest." The answers to those two questions are very different.

**On changing your mind later:** This is locked once we start rebuilding. Iterating mid-build on visual direction is the most expensive way to lose time. Take a week to decide if needed. Once locked, we build.

**On Boost AI keeping the visual integrity:** Once the direction is locked, the agent implementations will sometimes drift. Adding components, fixing edge cases, handling new states. Lev's job (or Boost AI's job on Lev's behalf) is to spot drift and pull it back to the system. The DESIGN.md is the source of truth; if a component doesn't match it, it gets fixed.

---

## 8. What this document does NOT cover

To keep scope tight:

- **Marketing site visuals beyond landing page.** When marketing pages get built, they extend this system.
- **Email templates.** Resend transactional emails will use the chosen direction's typography but a simpler layout. Specced separately when needed.
- **App Store / Play Store assets.** Future iOS port problem.
- **Specific micro-interactions on the food-photo flow.** Covered in the engine-specific spec when Phase 2 starts.
- **Empty states and error states.** Designed in the build, not specced here.
- **Loading states.** Use the chosen direction's motion grammar.

---

## 9. Files in this design package

```
/design/
  index.html                          → Pick-a-direction landing page (for Lev)
  direction-1-bold-electric.html      → Direction 01 prototype
  direction-2-y2k-soft.html           → Direction 02 prototype
  direction-3-calm-teen.html          → Direction 03 prototype
  DESIGN.md                           → This document
```

Open `index.html` first. Send Lev the link. Talk after he's picked.

---

*End of DESIGN.md.*
