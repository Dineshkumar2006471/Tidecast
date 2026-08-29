# Tidecast — DESIGN.md

> **Project name: TIDECAST.** Finalized. An earlier working name, "MatsyaSetu," appeared during initial naming exploration and has been fully replaced — the wordmark, CSS tokens (`--tc-*`), and every UI label below reflect TIDECAST only.

Design language: IBM Carbon-derived, same lineage as your IntelliPlant reference, adapted for a maritime/coastal-monitoring subject instead of an industrial-plant one. Not a copy-paste of IntelliPlant's palette — the signature element below is built specifically for *this* product's subject matter (real-time coastal status, not factory sensors), which is what keeps it from reading as templated.

---

## 1. Design Philosophy

The product is, at its core, a status system: is it safe to go out today, in this zone, right now. The design should feel like instrumentation — calm, legible, unambiguous under stress — not like a consumer social app. IBM Carbon's design language (flat surfaces, hairline borders, monospace data labels, restrained color used only to carry meaning) is a genuine fit here, not a default: severity color-coding is safety-critical information, not decoration, so a design system built around meaningful, restrained color use is the correct choice for this specific brief.

**One aesthetic risk taken deliberately:** most "status dashboard" designs use a dark, near-black theme with a neon accent (the generic AI-dashboard look). This design goes the opposite direction — bright, high-contrast white/light-gray surfaces with navy and ocean-blue, because the primary user context is a fisherman looking at a phone screen in direct sunlight on open water. Dark-mode-first would look sleek in a judge's dim conference room and fail in the one environment that actually matters. That tension is worth stating on your pitch slide — it shows the design decision was driven by the real user, not by aesthetic trend.

---

## 2. Design Tokens

### Color palette

| Token | Hex | Use |
|---|---|---|
| `--tc-ocean-blue` | `#0F62FE` | Primary actions, links, active nav state |
| `--tc-ink` | `#161616` | Headings, primary body text |
| `--tc-surface` | `#FFFFFF` | Base background |
| `--tc-surface-alt` | `#F4F4F4` | Alternating section background |
| `--tc-deep-navy` | `#001D3D` | Hero background option, footer, status ticker bar |
| `--tc-alert-red` | `#DA1E28` | Critical/cyclone severity |
| `--tc-warning-amber` | `#F1C21B` | Medium severity, caution states |
| `--tc-safe-teal` | `#007D79` | Safe/all-clear, success, acknowledged status |
| `--tc-tide-cyan` | `#0A85A8` | Signature accent — iconography, illustration line-work, the status ticker's live indicator. This is the one color not lifted directly from IBM's default palette; it's what gives the product its own identity against a generic Carbon clone. |
| `--tc-border` | `#E0E0E0` | Hairline dividers, card borders (1px, never a soft box-shadow-only card) |

### Typography

- **Display / Headings:** IBM Plex Sans, Bold/SemiBold. Large headline sizes use tight tracking; eyebrows and section labels above headings use IBM Plex Mono, uppercase, letter-spacing +0.08em — this is the "monospace uppercase" treatment you asked for, used specifically for *labels and system-status text*, not for body copy (body copy in mono would hurt readability and isn't what Carbon does either).
- **Body:** IBM Plex Sans, Regular, 16px base, 1.5 line-height.
- **Data / UI chrome / dashboard tables:** IBM Plex Mono — timestamps, zone codes, delivery status, severity tags. Anywhere the content is literally data (a status, a code, a count), it's mono. Anywhere it's prose, it's Plex Sans. That distinction is the rule, applied consistently everywhere in the app.

### Layout

- 12-column grid, 1440px max content width, 24px gutter.
- Corner radius: **0–2px only.** Carbon's flat, square-edged language — no soft rounded cards. This is a deliberate, brief-consistent choice, not a default.
- Spacing scale: 4 / 8 / 16 / 24 / 32 / 48 / 64 / 96px.

### Motion tokens

- Standard ease: `cubic-bezier(0.2, 0, 0.38, 0.9)` (Carbon's standard easing)
- Duration: 150ms (micro-interactions/hover), 300ms (panel transitions), 600ms (page-load hero sequence)
- All motion respects `prefers-reduced-motion: reduce` — falls back to instant state changes, no exceptions.

---

## 3. Signature Element: The Coastal Status Ticker

This is the one memorable, deliberate element the page is built around — everything else stays quiet and disciplined around it.

Directly beneath the nav bar, a full-width, dark navy (`--tc-deep-navy`) horizontal bar renders a slow, teleprinter-style scrolling readout in uppercase IBM Plex Mono:

```
● ZONE: KANYAKUMARI — ADVISORY: HIGH WAVES EXPECTED — LAST SYNC: 2 MIN AGO
● ZONE: RAMESWARAM — ADVISORY: CLEAR — LAST SYNC: 4 MIN AGO
```

The leading dot pulses gently (opacity 1 → 0.3 → 1, 1.2s loop) in `--tc-tide-cyan` for normal status, or `--tc-alert-red` if any zone shown is Critical. This is not decorative chrome — it is a live rendering of the exact thing the product does (continuously monitor and relay coastal zone status), placed at the very top of the page as the "thesis" moment before a single word of marketing copy is read. On the real app it's driven by actual advisory data; on the landing page it can cycle through a few illustrative examples on a timer.

---

## 4. Sitemap

```
/                        Landing Page (public)
/login                   Auth — phone OTP (fisherman) / email+password (admin/NGO)
/onboarding              First-time setup — language + zone selection
/app                     Fisherman Home — advisory feed
/app/advisory/:id        Advisory Detail — audio player, translated text, ack button
/app/settings            Language, zone, notification channel preferences
/admin                   Admin Dashboard Overview — live zone map + reach/ack stats
/admin/compose           Manual advisory composer / override broadcast
/admin/zones             Zone management
/admin/logs              Delivery logs & analytics (BigQuery-backed)
/about                   About / team / hackathon submission info
```

---

## 5. Landing Page — Story Structure

Built as a narrative, top to bottom, per your brief: who it's for, what it solves, why it exists, what's unique.

**1. Nav bar**
Logo + wordmark ("TIDE" in `--tc-ink`, "CAST" in `--tc-ocean-blue`, echoing the IntelliPlant two-tone wordmark pattern you already use). Links: Product / How It Works / Impact / Team. Right side: "Sign In" (text link) + "Get Started" (filled `--tc-ocean-blue` button, 0px radius).

**2. Coastal Status Ticker** (Section 3, signature element) — sits immediately under the nav, full width.

**3. Hero**
- Eyebrow (Plex Mono, uppercase, `--tc-tide-cyan`): `COASTAL ADVISORY INFRASTRUCTURE`
- Headline (Plex Sans Bold, large): **"An advisory a fisherman never got, is not an advisory."**
  This is the killer line — it states the entire problem in one sentence, direct, no metaphor padding, matched to the register of the subject.
- Subhead: One sentence stating what the product does — translated, voiced, delivered on whatever connection exists, with confirmation it arrived.
- Two CTAs: "See How It Works" (primary) / "Read the Ockhi Case" (secondary, text link, jumps to Impact section) — the second CTA is unusual and deliberate: it invites the visitor into the real-world stakes immediately rather than only after scrolling.
- Right side: a real, respectful photograph of a fishing boat/coastal community (not stock-generic office photography) — sourced honestly, credited if not your own.

**4. Who It's For**
Three short profile cards (Ravi the deep-sea fisherman / Meena the field officer / the state fisheries department) — plain language, "what they need," not persona-jargon.

**5. What It Solves**
Three-column breakdown: Language barrier / Connectivity gap / Format mismatch — each with a one-line stat or fact, not invented numbers.

**6. Why This Exists — The Ockhi Case**
A quieter, darker section (`--tc-deep-navy` background, light text) that states the Cyclone Ockhi timeline plainly: advisory issued, landfall date, toll. No dramatization — the facts carry the weight on their own. This is the emotional core of the page; restraint here is more powerful than intensity.

**7. How It Works**
The six-agent pipeline, shown as a horizontal step flow (Ingestion → Classify → Localize → Voice → Deliver → Verify), each step a small mono-labeled card. This doubles as your architecture explainer for judges scanning the live site.

**8. What's Unique — War Factors**
Four cards: Locked-glossary safety translation / Voice-first design / Offline-first architecture / Verification loop. Each stated as a claim + one sentence of why it matters, not a feature list.

**9. Live Preview / Interactive Moment**
An embedded, simplified interactive widget — pick a zone, see a simulated advisory translate and voice-render in real time. This is your "let the judge touch it" moment.

**10. CTA Banner**
Full-width `--tc-ocean-blue` band: "Built for the coastline that can't afford to miss a warning." + "Get Started" button.

**11. Footer**
Four columns: Product (links to sections) / Team (About page) / Built With (Google Cloud, Gemini, ADK logos — accurate to what you actually used) / Legal (mock disclaimer for hackathon submission). Bottom bar: copyright + hackathon submission note.

---

## 6. Wireframes (ASCII)

**Landing — above the fold**
```
┌─────────────────────────────────────────────────────────┐
│ TIDE   CAST        Product  How  Impact  Team   Sign In [Get Started]│
├─────────────────────────────────────────────────────────┤
│ ● ZONE: KANYAKUMARI — ADVISORY: HIGH WAVES — SYNC: 2M AGO│  ← ticker
├─────────────────────────────────────────────────────────┤
│  COASTAL ADVISORY INFRASTRUCTURE                          │
│                                                            │
│  An advisory a fisherman                    [ photo of   │
│  never got, is not an advisory.              fishing boat/│
│                                               coastal      │
│  Translated, voiced, and delivered on         community ] │
│  whatever connection exists.                              │
│                                                            │
│  [ See How It Works ]   Read the Ockhi Case →              │
└─────────────────────────────────────────────────────────┘
```

**Fisherman App — Home**
```
┌─────────────────────────────┐
│ ☰   Tidecast      🌐 TA   │
├─────────────────────────────┤
│  ● OFFLINE — showing last    │
│    synced advisory (12m ago) │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │ ⚠ HIGH — HIGH WAVES    │  │
│  │ Kanyakumari Zone       │  │
│  │ ▶ Play (Tamil)         │  │
│  │ [ I received this ]    │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ ✓ CLEAR — Rameswaram   │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Admin Dashboard — Overview**
```
┌───────────────────────────────────────────────────┐
│ Tidecast Admin        Overview Compose Zones Logs │
├───────┬─────────────────────────────────────────────┤
│ NAV   │  [ Live Zone Map — severity color overlay ]  │
│ Zones │                                              │
│ Comp. │  Reach: 92%   Ack: 74%   Dark zones: 2        │
│ Logs  │  [ Reach/Ack trend chart — BigQuery ]         │
└───────┴─────────────────────────────────────────────┘
```

---

## 7. Component Specifications

- **Nav bar:** fixed top, 64px height, white background, `--tc-border` bottom hairline. Active link underlined in `--tc-ocean-blue`, 2px, no rounded ends.
- **Sidebar (admin only):** 240px fixed width, `--tc-surface-alt` background, Plex Mono uppercase section labels, active item has a 3px `--tc-ocean-blue` left border (not a background fill — Carbon convention, keeps it flat).
- **Footer:** `--tc-deep-navy` background, light-gray text, four-column grid collapsing to single column under 768px.
- **Hero:** two-column on desktop (text left, image right), stacks single-column on mobile with image first suppressed in favor of text-first (a fisherman on a slow connection shouldn't wait on a hero image to read the headline — lazy-load the image, never block text render on it).
- **CTA buttons:** 0px radius, `--tc-ocean-blue` fill / white text for primary, outline variant for secondary, 150ms background-color transition on hover only (no scale/transform effects — Carbon avoids playful button motion).
- **Advisory card:** left-edge 4px color bar indicating severity (`--tc-alert-red` / `--tc-warning-amber` / `--tc-safe-teal`), Plex Mono severity label uppercase, Plex Sans body text, audio play button as a large tappable icon (minimum 44px touch target).
- **Severity badge:** small pill, 0px radius rectangle instead (consistent with no-rounded-corners rule), colored background at 15% opacity with full-opacity text/icon in the matching severity color.

---

## 8. Motion & Animation Design

- **Page load sequence (hero only, one orchestrated moment, not scattered effects):** ticker bar slides in from top (200ms) → eyebrow fades up (150ms delay) → headline fades up (100ms stagger) → subhead + CTAs fade up (100ms stagger) → hero image fades in last. Total sequence under 900ms — feels deliberate, not slow.
- **Scroll-triggered reveals:** each landing page section fades up 16px on scroll-into-view, 300ms, triggered once (not on every scroll direction change) — restrained, not a "wow" gimmick on every element.
- **Ticker marquee:** continuous linear scroll, pauses on hover/focus (accessibility — a moving status readout shouldn't be unreadable to someone trying to read it).
- **Micro-interactions:** button hover = background-color shift only, 150ms. Nav active state = underline width transition, 150ms. No skeuomorphic bounce, no card-tilt-on-hover — this product's subject is safety-critical status, and playful motion undercuts that tone.
- **Reduced motion:** all of the above collapse to instant state with zero transition when `prefers-reduced-motion: reduce` is set.

---

## 9. Accessibility Checklist

- WCAG AA contrast minimum on all text/background pairs (verify `--tc-tide-cyan` on white specifically — check ratio, adjust if needed).
- All severity information conveyed by color is also conveyed by an icon + text label (never color alone).
- All interactive elements keyboard-navigable with a visible focus ring (`--tc-ocean-blue`, 2px, offset 2px).
- Audio player has visible playback state and a text transcript toggle for anyone who can't play audio in their environment.
- Ticker marquee is `aria-live="polite"`, pausable, and has a static text alternative for screen readers (don't make a screen reader user parse a scrolling marquee).

---

## 10. Reference & Inspiration Notes

- **IBM Carbon Design System** — flat surfaces, 0px radius, restrained meaningful color, Plex type family. This is the base language, applied to a maritime/status-monitoring context rather than an industrial one.
- **IntelliPlant (your prior build)** — precedent for the two-tone wordmark, the "System Online"-style status badge pattern (evolved here into the full Coastal Status Ticker, made central rather than a corner badge), and the professional-photography-plus-live-insight-card hero layout.
- If you pull additional reference screenshots before you build, run them through the site-design-extractor skill to pull out their concrete tokens (exact hex values, spacing, type pairing) rather than eyeballing it — that's what keeps a coding agent from hallucinating a "vibe" instead of a spec.
