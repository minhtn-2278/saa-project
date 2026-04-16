# Feature Specification: Login

**Frame ID**: `662:14387`
**Screen ID**: `GzbNeVGJHz`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-04-16
**Status**: Reviewed

---

## Overview

The Login screen is the entry point to the SAA 2025 (Sun Annual Awards) application. It presents a visually striking hero page with the "ROOT FURTHER" key visual and a single call-to-action: **Login with Google**. The screen uses Supabase Auth with Google OAuth (PKCE flow) to authenticate users. The design features a dark cinematic theme with gradient overlays on a full-bleed background image, a fixed header with logo and language selector, and a copyright footer.

**Target Users**: Sun* employees participating in or viewing the Sun Annual Awards 2025.

**Business Context**: Authentication is mandatory before accessing any SAA 2025 content. Google OAuth is the sole authentication method, leveraging the company's Google Workspace accounts.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Google Login Authentication (Priority: P1)

**As a** Sun* employee,
**I want to** log in using my Google account,
**So that** I can access the SAA 2025 application securely.

**Why this priority**: This is the only authentication path. Without it, no user can access the application. It is the core MVP functionality.

**Independent Test**: Navigate to the login page, click "LOGIN With Google", complete Google OAuth, verify redirect to Homepage SAA.

**Acceptance Scenarios**:

1. **Scenario 1: Successful Google Login**
   - **Given**: User is on the Login page and not authenticated
   - **When**: User clicks the "LOGIN With Google" button
   - **Then**: The Google OAuth consent screen opens, user authorizes, and is redirected to the Homepage SAA with an active session

2. **Scenario 2: Login Button Loading State**
   - **Given**: User is on the Login page
   - **When**: User clicks "LOGIN With Google" and OAuth is processing
   - **Then**: The button becomes disabled, shows a loading indicator, and prevents duplicate clicks

3. **Scenario 3: Google OAuth Failure / Cancellation**
   - **Given**: User is on the Login page
   - **When**: User clicks "LOGIN With Google" but cancels the Google consent or an error occurs
   - **Then**: User remains on the Login page, an appropriate error message is displayed, and the button returns to its default state

4. **Scenario 4: Already Authenticated User**
   - **Given**: User has an existing valid session (cookie)
   - **When**: User navigates to the Login page
   - **Then**: User is automatically redirected to Homepage SAA without seeing the login form

5. **Scenario 5: Unauthorized Google Account (non-Sun* domain)**
   - **Given**: User is on the Login page
   - **When**: User clicks "LOGIN With Google" and authenticates with a non-Sun* Google account
   - **Then**: User is redirected to the branded Error 403 page (`T3e_iS9PCL`) explaining that only Sun* accounts are authorized, with a link back to Login

6. **Scenario 6: Session Expired**
   - **Given**: User had a session that has expired
   - **When**: User tries to access a protected page
   - **Then**: User is redirected to the Login page with an optional message indicating session expiry

---

### User Story 2 - Language Selection (Priority: P2)

**As a** user,
**I want to** switch the application language,
**So that** I can use the application in my preferred language.

**Why this priority**: Internationalization improves accessibility for non-Vietnamese speakers, but the application is functional without it.

**Independent Test**: Click the language selector, switch language, verify UI text updates.

**Acceptance Scenarios**:

1. **Scenario 1: Open Language Dropdown**
   - **Given**: User is on the Login page
   - **When**: User clicks the "VN" language selector in the header
   - **Then**: A dropdown menu appears with 3 language options: Vietnamese (VN), English (EN), Japanese (JP) (linked to screen: Dropdown-ngon-ngu, screenId: hUyaaugye2)

2. **Scenario 2: Switch Language**
   - **Given**: The language dropdown is open
   - **When**: User selects a different language
   - **Then**: All UI text on the Login page updates to the selected language, and the selector displays the new language code

3. **Scenario 3: Language Persistence**
   - **Given**: User has selected a language preference
   - **When**: User refreshes the page or returns later
   - **Then**: The previously selected language is preserved

---

### User Story 3 - Responsive Login Page (Priority: P3)

**As a** user accessing from a mobile or tablet device,
**I want to** see a properly adapted Login page,
**So that** I can log in comfortably from any device.

**Why this priority**: The primary audience likely uses desktop (internal company event), but mobile support ensures accessibility for all scenarios.

**Independent Test**: Resize the browser or use device emulation to verify the login page renders correctly at mobile (360px), tablet (768px), and desktop (1440px) viewports.

**Acceptance Scenarios**:

1. **Scenario 1: Mobile Viewport**
   - **Given**: User opens the Login page on a mobile device (< 640px)
   - **When**: The page renders
   - **Then**: All content is visible without horizontal scroll, the login button is reachable, and text is readable

2. **Scenario 2: Tablet Viewport**
   - **Given**: User opens the Login page on a tablet (640px-1023px)
   - **When**: The page renders
   - **Then**: Layout adjusts with reduced padding, key visual scales down, and all interactions work

---

### Edge Cases

- What happens when Google OAuth service is temporarily unavailable? -> Display a user-friendly error message and retry option.
- What happens if the user's Google account is not authorized (not a Sun* domain)? -> Redirect to the branded Error 403 page (`T3e_iS9PCL`) which explains only Sun* accounts are authorized. The error page links back to Login.
- What happens if JavaScript is disabled? -> The page MUST still render the static content; the login button will not function but a `<noscript>` message SHOULD inform the user.
- What happens on extremely slow connections? -> Background image MUST have a fallback dark background color (#00101A) visible while loading.
- How does the language dropdown close? -> Click outside the dropdown, press Escape, or select a language option. Dropdown MUST trap focus while open.
- Where does the OAuth error message appear? -> Inline below the Login button as a text message with `role="alert"`. Error disappears when user clicks Login again.
- What if user opens Login page with an invalid/expired OAuth callback code in URL? -> Display a generic "Login failed, please try again" error and clean the URL.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| # | Component | Node ID | Description | Interactions |
|---|-----------|---------|-------------|--------------|
| A | A_Header | 662:14391 | Fixed header with semi-transparent dark bg (80% opacity) | Static container |
| A.1 | A.1_Logo | I662:14391;186:2166 | SAA 2025 logo, 52×48px, top-left | Non-interactive |
| A.2 | A.2_Language | I662:14391;186:1601 | Language selector "VN" with flag + chevron | Click: open dropdown (→ screen hUyaaugye2) |
| B | B_Bìa | 662:14393 | Hero section with gradient overlays | Static container |
| B.1 | B.1_Key Visual | 662:14395 | "ROOT FURTHER" logo image, 451×200px | Non-interactive |
| B.2 | B.2_content | 662:14753 | Description text, 2 lines | Non-interactive |
| B.3 | B.3_Login | 662:14425 | "LOGIN With Google" button with Google icon | Click: trigger Google OAuth |
| C | C_Keyvisual | 662:14388 | Full-bleed background artwork | Non-interactive |
| D | D_Footer | 662:14447 | Copyright footer with border-top divider | Non-interactive |

### Navigation Flow

- **From**: Direct URL access, or redirect from any protected route (when unauthenticated)
- **To**: Homepage SAA (`i87tDx10uM`) after successful login
- **Triggers**:
  - Click "LOGIN With Google" (Sun* account) → Google OAuth → Homepage SAA
  - Click "LOGIN With Google" (non-Sun* account) → Google OAuth → Error 403 page (`T3e_iS9PCL`)
  - Click Language selector → Dropdown overlay (screen `hUyaaugye2`)
  - Already authenticated → Auto-redirect to Homepage SAA
  - Error 403 page → redirects back to Login

### Visual Requirements

- **Full visual specs**: See [design-style.md](./design-style.md) for all colors, typography, spacing, and component styles
- **Responsive breakpoints**: Mobile (< 640px), Tablet (640-1023px), Desktop (>= 1024px) — see design-style.md Responsive Specifications section
- **Accessibility**: WCAG 2.1 AA compliance required; white on dark contrast ratio passes (18.06:1)
- **Background**: Full-bleed image with two gradient overlays (left-to-right + bottom-to-top)
- **Fonts**: Montserrat (700) for all UI text; Montserrat Alternates (700) for footer

### Accessibility Requirements (WCAG 2.1 AA)

- **Keyboard navigation**: Tab order MUST be: Language selector → Login button. Enter/Space MUST activate the focused button.
- **Focus indicators**: All interactive elements MUST have a visible focus ring (minimum 2px solid, contrasting color).
- **Screen reader**: 
  - Background image: decorative, use `alt=""` or `aria-hidden="true"`
  - "ROOT FURTHER" key visual: `alt="Root Further - SAA 2025 theme"`
  - Login button: `aria-label="Login with Google account"`
  - Language selector: `aria-label="Select language"`, `aria-expanded` for dropdown state
  - Loading state: `aria-busy="true"` and `aria-disabled="true"` on button during OAuth
- **Error announcements**: OAuth error messages MUST use `role="alert"` or `aria-live="assertive"` for screen reader notification.
- **Focus management**: After OAuth error, focus MUST return to the Login button. After language switch, focus MUST remain on the language selector.
- **Reduced motion**: Honor `prefers-reduced-motion` — disable page-load fade and button transitions.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate users exclusively via Google OAuth using Supabase Auth with PKCE flow
- **FR-002**: System MUST redirect authenticated users away from the Login page to Homepage SAA
- **FR-003**: System MUST redirect unauthenticated users from protected routes to the Login page
- **FR-004**: System MUST display a loading state on the login button while OAuth is processing
- **FR-005**: System MUST handle OAuth errors gracefully and display user-friendly error messages
- **FR-006**: System MUST store session tokens in HTTP-only cookies (per constitution Principle IV)
- **FR-007**: System MUST support language switching between 3 locales: Vietnamese (VN), English (EN), Japanese (JP)
- **FR-008**: System MUST persist the user's language preference across sessions
- **FR-009**: System MUST display OAuth error messages inline below the Login button with `role="alert"`
- **FR-010**: System MUST close the language dropdown on click-outside, Escape key press, or option selection
- **FR-011**: System MUST validate the authenticated user's email domain after OAuth callback; non-Sun* domain accounts MUST be rejected and redirected to the Error 403 page (`T3e_iS9PCL`)

### Technical Requirements

- **TR-001**: Login page MUST achieve LCP < 2.5s (background image optimized, fonts preloaded)
- **TR-002**: Authentication MUST use Supabase Auth server-side client (service role MUST NOT be exposed to client)
- **TR-003**: Login page MUST be a Server Component with the login button as a client-side interactive island
- **TR-004**: Background image MUST use `next/image` with priority loading and appropriate `sizes` attribute
- **TR-005**: Google OAuth callback MUST be handled via a Route Handler (`app/api/auth/callback/route.ts`)
- **TR-006**: All fonts (Montserrat, Montserrat Alternates) MUST be loaded via `next/font/google`

### Key Entities *(if feature involves data)*

- **User Session**: Managed by Supabase Auth; contains user ID, email, access token, refresh token
- **User Profile**: Google account metadata (name, email, avatar) stored in Supabase `auth.users` table
- **Language Preference**: User's selected locale (`vi`, `en`, or `ja`), stored in cookie. Default: `vi`

---

## API Dependencies

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| /api/auth/login | POST | Initiate Google OAuth flow via Supabase | New (predicted) |
| /api/auth/callback | GET | Handle Google OAuth callback, exchange code for session | New (predicted) |
| /api/auth/session | GET | Check current session status (for redirect logic) | New (predicted) |
| Supabase Auth | - | `supabase.auth.signInWithOAuth({ provider: 'google' })` | Supabase built-in |

---

## State Management

### Local Component State

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| isLoading | boolean | false | Login button loading state during OAuth |
| error | string \| null | null | OAuth error message displayed below Login button |
| isLangDropdownOpen | boolean | false | Language dropdown visibility state |

### Global State Needs

| State | Scope | Storage |
|-------|-------|---------|
| Session/Auth | App-wide | Supabase Auth (HTTP-only cookie) |
| Locale (`vi` \| `en` \| `ja`) | App-wide | Cookie / `next-intl` or equivalent. Default: `vi` |

### Cache Requirements

- No cache needed for the Login page itself — it MUST always reflect current auth state
- Background image and font assets SHOULD be cached aggressively (immutable, long max-age)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95%+ of login attempts complete successfully within 5 seconds (OAuth round-trip)
- **SC-002**: Login page LCP < 2.5s on 3G connection with optimized assets
- **SC-003**: Zero authentication bypass incidents — all protected routes enforce auth check
- **SC-004**: Language switch completes instantly (< 100ms perceived delay)
- **SC-005**: Login page passes WCAG 2.1 AA automated audit (axe-core zero violations)

---

## Out of Scope

- Email/password authentication — Google OAuth is the sole method per business requirements
- User registration flow — Supabase Auth handles first-time user creation automatically
- Password reset / account recovery — not applicable with OAuth-only auth
- Admin role management — handled in separate screens
- Deep-link return after login (e.g., redirect to originally requested URL) — may be added as enhancement later

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`)
- [ ] API specifications available (`.momorph/API.yml`) — to be generated
- [ ] Database design completed (`.momorph/database.sql`) — Supabase Auth handles user tables
- [x] Screen flow documented (`.momorph/SCREENFLOW.md`)
- [ ] Supabase project created with Google OAuth provider configured
- [ ] Google Cloud Console OAuth client ID / secret configured

---

## Notes

- The Login screen is designed at 1440×1024px (desktop). The design is dark-themed with cinematic visual style consistent with an awards ceremony branding.
- The "ROOT FURTHER" key visual is a branding image, not text — it MUST be served as an optimized image with appropriate `alt` text for accessibility.
- Per constitution Principle II (Tech Stack Discipline), the login page MUST be a Server Component by default with `"use client"` only on the interactive login button.
- Per constitution Principle IV (Security First), session tokens MUST be HTTP-only cookies, and the service-role Supabase key MUST never appear in client code.
- The Language selector links to another Figma screen (hUyaaugye2 "Dropdown-ngon-ngu") which defines the dropdown UI — that screen's spec should be created separately.
- Footer text says "Sun* (C) 2025" — this may need to be updated to 2026 or made dynamic.
