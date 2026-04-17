# Screen: Countdown - Prelaunch page

## Screen Info

| Property | Value |
|----------|-------|
| **Figma Frame ID** | 8PJQswPZmU |
| **Figma Node ID** | 2268:35127 |
| **Figma Link** | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=8PJQswPZmU |
| **Screen Group** | Pre-Launch (Gatekeeper) |
| **Status** | discovered |
| **Discovered At** | 2026-04-17 |
| **Last Updated** | 2026-04-17 |

---

## Description

The Countdown/Prelaunch page is a **global pre-entry gatekeeper** that is rendered before ALL other screens in the Sun Annual Awards 2025 (SAA 2025) application until the official launch timestamp passes. The launch date/time is configured via an environment variable (`NEXT_PUBLIC_LAUNCH_DATE` / `LAUNCH_DATE` in `.env`) and the middleware/layout redirects any incoming request (including `/login`, `/home`, `/admin/*`, etc.) to this page while the current server time is before the launch time.

The page displays a large, LED-styled countdown (DAYS / HOURS / MINUTES) on a full-bleed media/cover background. Once the countdown reaches 00:00:00, users are automatically redirected to the Login screen (or Homepage if already authenticated).

**Key behavior**:
- Pre-entry gate: blocks access to EVERY screen of the application while `now < LAUNCH_DATE`
- No authentication required (pre-launch is public)
- No interactive elements (no buttons/links) - it is a passive waiting state
- Auto-advances when countdown reaches zero

---

## Navigation Analysis

### Incoming Navigations (From)

| Source Screen | Trigger | Condition |
|---------------|---------|-----------|
| Any screen / direct URL | Automatic redirect via middleware | `now < LAUNCH_DATE` |
| App launch (root `/`) | Initial route guard | Before launch time |
| `/login`, `/home`, `/admin/*`, etc. | Global middleware rewrite | Before launch time |

### Outgoing Navigations (To)

| Target Screen | Trigger Element | Node ID | Confidence | Notes |
|---------------|-----------------|---------|------------|-------|
| Login (GzbNeVGJHz) | Auto-redirect when `now >= LAUNCH_DATE` | (timer effect) | High | After countdown reaches 00:00:00 and user is not authenticated |
| Homepage SAA (i87tDx10uM) | Auto-redirect when `now >= LAUNCH_DATE` | (timer effect) | Medium | If user is already authenticated at launch time |

### Navigation Rules
- **Back behavior**: N/A (no back navigation; only exit is when launch time passes)
- **Deep link support**: No - any deep link is intercepted and rewritten to this page pre-launch
- **Auth required**: No - public, rendered before auth check
- **Gate priority**: HIGHEST - executes before authentication, role, or routing checks

---

## Component Schema

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│                                                  │
│         MM_MEDIA_BG Image (full-bleed)           │
│         Cover (dark overlay on top)              │
│                                                  │
│   ┌──────────────────────────────────────────┐  │
│   │    "Awards Information Navigation Links"  │  │
│   │              (heading text)                │  │
│   │                                            │  │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│   │   │  [0][2] │ │  [0][2] │ │  [0][2] │    │  │
│   │   │  DAYS   │ │  HOURS  │ │ MINUTES │    │  │
│   │   └─────────┘ └─────────┘ └─────────┘    │  │
│   │                                            │  │
│   └──────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Component Hierarchy

```
Countdown - Prelaunch page (Screen / Frame 2268:35127)
├── MM_MEDIA_BG Image (Atom - background image)
├── Cover (Atom - dark overlay Rectangle)
└── Bìa (Organism - content container)
    └── Frame 487
        └── Frame 523
            └── Countdown time (Organism)
                ├── "Awards Information Navigation Links" (Atom - heading TEXT)
                └── Time (Molecule - countdown row)
                    ├── 1_Days (Molecule - info_block)
                    │   ├── Frame 485 (two LED digit boxes)
                    │   │   ├── Group 5 (Rectangle + digit TEXT)
                    │   │   └── Group 4 (Rectangle + digit TEXT)
                    │   └── DAYS (Atom - label TEXT)
                    ├── 2_Hours (Molecule - info_block)
                    │   ├── Frame 485 (two LED digit boxes)
                    │   └── HOURS (Atom - label TEXT)
                    └── 3_Minutes (Molecule - info_block)
                        ├── Frame 485 (two LED digit boxes)
                        └── MINUTES (Atom - label TEXT)
```

### Main Components

| Component | Type | Node ID | Description | Reusable |
|-----------|------|---------|-------------|----------|
| MM_MEDIA_BG Image | Atom | 2268:35129 | Full-bleed hero media background | No |
| Cover | Atom | 2268:35130 | Dark overlay Rectangle on top of background for legibility | No |
| Countdown time | Organism | 2268:35136 | Countdown container holding heading + LED blocks | No |
| Heading (Awards Info Nav) | Atom | 2268:35137 | Title/heading text above the countdown | No |
| 1_Days | Molecule | 2268:35139 | LED days block (2 digits + label) | Yes |
| 2_Hours | Molecule | 2268:35144 | LED hours block (2 digits + label, range 00-23) | Yes |
| 3_Minutes | Molecule | 2268:35149 | LED minutes block (2 digits + label, range 00-59) | Yes |
| LED Digit (Group 5 / Group 4) | Atom/Instance | I2268:35141 | Single digit cell (Rectangle + number) | Yes |

**Note**: The Figma design does not include a SECONDS block. Implementation may add seconds for smoother UX, but the spec-of-record is DAYS / HOURS / MINUTES only.

---

## Form Fields (If Applicable)

N/A - This screen has no form fields or user input.

---

## API Mapping

### On Screen Load

| API | Method | Purpose | Response Usage |
|-----|--------|---------|----------------|
| `/event/status` (optional) | GET | Verify launch time / status from server | Override `.env` value if server says event already started (e.g., manual early launch) |

**Primary source**: `process.env.NEXT_PUBLIC_LAUNCH_DATE` (ISO 8601 timestamp). The API call is optional and used only to authoritatively confirm launch state if desired.

### On User Action

| Action | API | Method | Request Body | Response |
|--------|-----|--------|--------------|----------|
| (none - passive screen) | - | - | - | - |

### Error Handling

| Error Code | Message | UI Action |
|------------|---------|-----------|
| Missing `LAUNCH_DATE` env | (silent fallback) | Treat as launched; skip gate and go to normal routing |
| Invalid date format | (silent fallback) | Log warning; treat as launched |
| Clock skew | N/A | Recompute diff each tick; trust server time if `/event/status` used |

---

## State Management

### Local State

| State | Type | Initial | Purpose |
|-------|------|---------|---------|
| `launchDate` | `Date` | `new Date(process.env.NEXT_PUBLIC_LAUNCH_DATE)` | Target launch timestamp |
| `now` | `Date` | `new Date()` | Current time, refreshed every 1s |
| `remaining` | `{ days, hours, minutes, seconds }` | computed | Countdown diff |
| `isLaunched` | `boolean` | `now >= launchDate` | Gate signal |

### Global State (If Applicable)

| State | Store | Read/Write | Purpose |
|-------|-------|------------|---------|
| `featureFlags.preLaunch` | app config | Read | Global boolean to force-disable the gate (ops override) |

---

## UI States

### Loading State
- Render immediately with `remaining` computed from `launchDate` and `Date.now()`
- No spinner required; countdown appears instantly

### Error State
- If `launchDate` is invalid/missing: do not render the gate; pass through to normal routing
- Defensive: if countdown goes negative (post-launch), trigger redirect and stop the interval

### Success State (Launch Reached)
- Countdown hits `00 DAYS 00 HOURS 00 MINUTES`
- Client-side redirect to `/` (which will then route to Login or Homepage based on auth state)
- Middleware stops rewriting to `/countdown` once server time passes launch

### Empty State
- N/A

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Screen reader | Live region (`aria-live="polite"`) announcing remaining time at coarse intervals (every minute) |
| Semantic heading | Page has `<h1>` heading for the title/countdown context |
| Color contrast | LED digits / labels meet WCAG AA against dark overlay |
| Reduced motion | Respect `prefers-reduced-motion` - no flashing digit transitions |
| Keyboard | No interactive elements; focus-safe |

---

## Responsive Behavior

| Breakpoint | Layout Changes |
|------------|----------------|
| Mobile (<768px) | Countdown blocks stack vertically or shrink; LED digit size reduced |
| Tablet (768-1024px) | Three blocks in a single row, medium size |
| Desktop (>1024px) | Full hero layout with large LED blocks in a single row |

---

## Analytics Events (Optional)

| Event | Trigger | Properties |
|-------|---------|------------|
| `prelaunch_view` | On mount | `{ remainingMs }` |
| `prelaunch_launch_reached` | Countdown hits zero | `{ launchDate }` |

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-overlay` | rgba(0,0,0,0.4-0.6) | Cover overlay on hero image |
| `--color-led-digit` | #FFFFFF or accent | Digit color on LED blocks |
| `--color-label` | #FFFFFF | DAYS/HOURS/MINUTES labels |
| `--font-led` | LED / monospace display font | Countdown digits |

---

## Implementation Notes

### Environment Variable

```env
# .env
NEXT_PUBLIC_LAUNCH_DATE=2026-05-01T09:00:00+07:00
```

### Middleware (Next.js App Router)

The gate should be implemented in `middleware.ts` at the project root so it intercepts every route:

```ts
// middleware.ts (sketch)
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const launchDate = process.env.NEXT_PUBLIC_LAUNCH_DATE;
  if (!launchDate) return NextResponse.next();

  const now = Date.now();
  const launch = new Date(launchDate).getTime();
  if (Number.isNaN(launch) || now >= launch) return NextResponse.next();

  // Allow static assets, _next, favicon, and the countdown route itself
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/countdown' ||
    pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/countdown';
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: '/((?!api/health).*)',
};
```

### Dependencies
- Next.js middleware for global route interception
- Client-side `setInterval` (1s tick) for countdown updates
- Optional `date-fns` for duration formatting

### Special Considerations
- Keep the gate logic in middleware so it works for server-rendered and client-rendered routes uniformly
- Do NOT gate API health/probe endpoints (e.g., `/api/health`) so infra can still monitor
- Consider a ops override (e.g., query param `?bypass=<token>` or cookie) for admins/QA pre-launch testing
- Server/client clock skew: prefer server-derived `now` (via a small API) to avoid users spoofing local time
- After launch, the middleware becomes a no-op; no code removal required

---

## Analysis Metadata

| Property | Value |
|----------|-------|
| Analyzed By | Screen Flow Discovery (momorph.screenflow) |
| Analysis Date | 2026-04-17 |
| Needs Deep Analysis | No |
| Confidence Score | High |

### Next Steps
- [ ] Decide whether to include SECONDS block (design currently omits it)
- [ ] Confirm exact copy for the heading text (currently labelled "Awards Information Navigation Links" in Figma - likely a placeholder)
- [ ] Confirm launch timestamp + timezone with stakeholders
- [ ] Define ops bypass mechanism for admin/QA pre-launch preview
- [ ] Add end-to-end test: pre-launch redirects all routes to `/countdown`
