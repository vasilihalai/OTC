# xRuby OTC — screens.md

Reverse-documented from the current implementation (`/Users/vasilihalai/Desktop/OTC`) as of 2026-08-20. This describes what's actually built and live, not a design intent — use it as the baseline for the next round of changes. Supersedes the 2026-08-19 version: that one predates the full-bleed panel-layout fix, the Profile rebuild, this round's polish pass, and the TransferModal rebuild against its Figma frame (all folded in below).

## 1. Scope

Telegram Mini App (React + TypeScript + Vite, HashRouter, zustand). Mock-first: every screen reads/writes through `src/api/index.ts`, which resolves each function to either `src/api/mock/*` or `src/api/real/*` behind `VITE_USE_REAL_API`. Deals (list, detail, and every status action on them — confirm/decline/request-new-rate/expire-quote) are the one part that stays mocked regardless of the flag; everything else (auth, profile, balances, withdrawals, transfers, requisites) is real-API-ready with a matching `real/*` stub already in place, assumed-contract, to reconcile against Swagger once it exists.

Dark theme only, regardless of the user's Telegram theme — Profile's theme/language pickers are cosmetic (see §6.9), they don't switch anything.

## 2. Design tokens

### 2.1 Colors (`src/theme/tokens.css`)

```
Surfaces
  --bg-page          #0C0E12   panel fill, field fill, modal fill
  --bg-surface       #13161B   cards nested inside a panel (details card, quote card, requisites panel, summary block, stat card)
  --bg-raised        #191C22   frame background behind full-bleed panels (the seam color), secondary/disabled buttons,
                                code cells, tab-segment track, transfer-modal fields, action-icon circles
                                — darkened from #22262F this round; was reading too light against --bg-page
  --border           #373A41
  --border-strong    #61656C
  --pill-scrim       rgba(65,63,64,.4)    AppHeader pill fill (+ backdrop-blur 12px)
  --modal-scrim      rgba(247,247,247,.1)

Text
  --text-primary     #F7F7F7
  --text-strong      #ECECED
  --text-body        #CECFD2   default body color (set on <body>)
  --text-muted       #94979C
  --text-subtle      #8B8F97
  --text-quiet       #85888E
  --text-disabled    #61656C
  --text-on-accent   #FFFFFF
  --text-on-light    #373A41   label color on white/primary buttons, enabled AND disabled

Accent / semantic
  --accent           #BB0023   primary red — CTAs, errors, danger links, active tab-bar icon
  --brand-mark       #C51625   small logo dot only
  --required         #E4002B   asterisk on required fields
  --positive         #039855
  --verified         #12B76A   check glyph inside the profile "Верифицирован" badge
  --badge-success-bg #022417 / --badge-success-text #027A48
  --warning-text     #B54708   unused since Profile's "Уровень безопасности" row was removed (§6.9) — token kept for whenever it's needed next
  --panel-warning    #241005   WarningPanel + Callout warning fill (darkened from #301003 — read as too bright/orange)
  --panel-error      #2F0904   Callout danger fill

Deal status (solid fills, keyed by the literal DealStatus string)
  DONE               fill #022417  text #027A48
  RUNNING            fill #05232F  text #0E6F90
  RATE_PENDING       fill #031332  text #004EEB
  RATE_ACTIVE        fill #170633  text #6927DA
  RATE_STALE         fill #13161B  text #94979C
  AWAITING_FUNDS     fill #301003  text #B54708
  DECLINED           fill #2F0904  text #BB0023

StatusHero gradient top-stops (per status, flat --bg-surface bottom half)
  RUNNING #05232F · DONE #022417 · DECLINED #2F0904 · RATE_STALE #22262F · RATE_PENDING #031332
```

### 2.2 Type scale (`src/theme/type.css`, classes `.t-*`)

| Class | Size/line | Weight |
|---|---|---|
| screen-title | 20/28 | 600 |
| screen-title-sm | 18/28 | 600 |
| section-title | 20/28 | 500 |
| stat | 24/32 | 600 |
| deal-id | 20/28 | 700 |
| amount-xl | 36/44 | 700 |
| field | 16/24 | 400 |
| button | 16/24 | 600 |
| total | 16/24 | 600 |
| body | 16/24 | 400 |
| label | 14/20 | 400 |
| label-strong | 14/20 | 600 |
| label-med | 14/20 | 500 |
| caption | 12/16 | 500 |

Font: Inter (self-hosted via `@fontsource/inter`, weights 400/500/600/700), `font-variant-numeric: tabular-nums` on `<body>`. Every text/password field renders its placeholder at the same 16px — a bug where `PasswordField`'s masked-dot font-size (13px) also applied to the *empty* field (so "Введите пароль" rendered visibly smaller than "Введите почту") was found and fixed: the smaller size now only kicks in once there's an actual value to mask, never for the placeholder. The masked-dot size itself is **9px** (down from an initial 13px); the actual typed/revealed letters stay at the normal 16px field size, matching Email — the dots and the letters are two different, deliberately different sizes.

### 2.3 Layout model — full-bleed panels, not inset cards

This is the thing most likely to regress, so it's stated first. A panel on Home, the withdrawal screens, and Profile is **390-ish wide at x=0, no side margin, ever** — the inset lives entirely in the panel's own `padding`. `Panel` (`src/components/Panel/Panel.tsx`) takes `fill` (`page | raised | surface`), `radius` (CSS shorthand — rounded only on the seam-facing edge(s)), and `padding` props; it never takes a margin. Screens that need this stack panels with `gap: 16px` in a flex column and let each panel's own background show through the gap — that 16px gap *is* the seam.

- **Home**: root `display:flex; flex-direction:column; gap:16px; background: var(--bg-raised)`. Three panels: hero (`radius="0 0 24px 24px"`, `padding="20px 16px"`, bg-page), recent-deals (`radius="16px"`, `padding="20px 0 4px"`, bg-page, heading/rows carry their own 16px horizontal inset), deposit-account (`radius="24px"`, `padding="20px 0"`, bg-page, same pattern).
- **Deals**: no panel at all — frame is bg-page, title/filter-chips/rows sit directly on it, rows full-bleed to both screen edges.
- **DealDetail**: no panel either — frame bg-page, header/quote-card/hold-confirmation/`Детали`/`Документы` sit directly on it at a flat 16px inset. `Детали` and `Документы` are **plain heading + rows, not cards** — an earlier version wrapped them in a `--bg-surface` card, which doesn't match; only the quote card and `RequisitesPanel` are genuine cards (`Panel fill="surface" radius="16px"`).
- **Withdrawals** (WithdrawCrypto/WithdrawFiat/WithdrawRequisites): single implicit full-bleed panel — content inset 16px horizontal, 20px top, 16 or 32px bottom depending on screen, no radius (it's the only content on the screen, so the frame color is never actually visible).
- **Profile**: two full-bleed panels (`padding: 16px 16px 24px` / `16px`), bg-raised frame, 16px seam, panel2's `Тема`↔`FAQ` divider is inset 24px (8 more than the row content) — that's drawn intentionally, not a bug.

**Row components reach both edges themselves.** `DealRow` (128px, used on Home and Deals) and `TableRow` (64px asset row, used on Home's deposit-account list) are full-bleed with their own internal padding — never wrapped in a padded container that would double the inset. `TableRow` is a 3-cell flex row: info-cell (`padding-left:16px`, holds `CurrencyIcon` + ticker/name), amount-cell, action-cell (68px wide, `padding-right:16px`, holds a 36px round `--bg-raised` circle) — so the currency icon and the withdraw button both sit exactly 16px from the screen edge, symmetric. `DealRow` carries **no per-status background highlight** — a `RATE_ACTIVE` full-bleed highlight was tried, then explicitly reverted: it read as "the first item in the list is highlighted" rather than status-driven, which was confusing rather than informative. Its `.deal-row__id` text is **16px/22, weight 700** (was 14/20/600) — bumped per a Figma annotation, since the deal ID is the row's primary identifier and read as too light against the amount rows below it.

## 3. Component library (`src/components/*`)

- **Panel** — the full-bleed primitive, see §2.3. `fill="page"` (default) / `"raised"` / `"surface"`; `radius`/`padding` as CSS shorthand strings, e.g. `radius="0 0 24px 24px"`.
- **Button** — variants `primary | accent | secondary | link | footer-link`, plus a `danger` boolean modifier (used with `link`) and a `size: 'regular' | 'compact'` (compact = 36px/radius 18/`button-sm` label, used only by Profile's certificate button). Height 44 regular, radius 30. Primary: white fill enabled, `--bg-raised` fill disabled, label stays `--text-on-light` in *both* states. Accent: `--accent` fill. Secondary disabled is now a flat `--bg-surface` fill with a `--border` outline, not a dimmed (`opacity: .6`) copy of its own enabled `--bg-raised` fill — a translucent version of the same color still read as "the same button, just faint" rather than clearly disabled (most visible on the email-code modal's resend button while its countdown runs). `.button-row` = two buttons side by side, `flex:1` each, 16 gap, secondary/cancel left.
- **TextField / PasswordField** — plain label row, **no required asterisk** (removed — every field in the app is required anyway, the mark wasn't earning its place). Box: height 44, radius 12, fill `--bg-page`, border `--border` → `--border-strong` on focus, `--accent` on error, **12px horizontal input padding** (reduced from 16px — the text sat too far from the field edge). `PasswordField`'s masked-dot shrink only applies once there's a typed value — see §2.2. `PasswordField` also takes an optional `labelHint` (a `ReactNode` rendered right after the label text) — added for NewPassword's `HelpTip` "?" glyph, see §6.2.
- **Logo** (new, `components/Logo`) — the real xRuby lockup, a 135×30 inline SVG supplied directly (not built up from CSS/text): a red rounded-square mark with a knocked-out "X" cutout, plus the "RUBY" wordmark in white. Replaces the old `<div>xRuby</div>` on SignIn and PasswordRecovery — two earlier attempts (plain red text, then a CSS-built badge+wordmark approximation) were both replaced once the actual brand SVG was supplied. Fixed colors baked into the SVG paths (white wordmark, `#C51625` mark) rather than tokens, since it's a literal asset, not a themed component.
- **AmountField** — label/available row, then a box (12px horizontal padding, matching TextField) with an optional embedded asset `Select`, the numeric input, and a "Макс" button. The old `transferVariant` (76px tall box, 28px input) was removed — the transfer modal's amount field now uses the same 44px sizing as every other field, per an explicit "make it match the standard fields" request.
- **Select** — `layout: 'asset' | 'method' | 'address' | 'plain'`. Closed box (min-height **44px**, was 48 — brought in line with the Field spec) + click-open dropdown (rows min-height **36px**, was 48). Dropdown open/close now animates (`scaleY` + fade, 0.15s), the chevron rotates with a transition, and the box border-color transitions — previously all instant. `address` layout is two lines: truncated address, then an optional `Метки: …` metadata line built from `labels: string[]` on the option (max 2 shown + `+N`). `readOnly` (no chevron, unclickable) when there's ≤1 option — the readonly box used to zero out its own border (`border-color: transparent`), reading as flat/borderless against a Figma reference that wanted it to look like every other field; it now keeps the same 1px `--border` outline as the interactive state. `.select__label` lightened from `--text-muted` to `--text-body` for the same reason (readonly field labels read as too dim). New optional `trailingIcon` prop renders only in the readonly state (the chevron already owns that slot when interactive) — used by `RequisitesPanel`'s network field to show a decorative `×` + chevron pair matching the reference, without turning that field into a real second option to pick from. **The box's base fill is `--bg-raised` now, was `--bg-surface`** — across every screen that uses `Select` (asset/address/network pickers on withdrawal screens, `RequisitesPanel`), the boxes read as too close to the page background with no visible grey fill, per a Figma annotation calling this out on almost every dropdown at once; the existing 1px border reads much more clearly against the lighter fill too.
- **PickerModal** — generic single-select list, presented as a **bottom sheet** (own scrim + card, not the centered `Modal`): drag handle, left-aligned title, plain full-width rows with the current value shown via a filled-row background (`--bg-raised`, radius 12) rather than a checkmark. Was originally built on the centered `Modal` with a checkmark-per-row and an explicit close `×`; rebuilt to the sheet presentation per a Figma annotation showing this exact bottom-sheet shape for Profile's Язык/Тема pickers. `languageModalTitle`/`themeModalTitle` shortened to just "Язык"/"Тема" (was "Выберите язык"/"Выберите тему") to match the sheet's plain title, not a question. Used by Profile's Язык/Тема rows (see §6.9); intentionally generic so any future "pick one of N" surface can reuse it instead of hand-rolling another dropdown.
- **Badge** — `success | neutral | count`. success/neutral: radius 20, `success` = green fill/text pair, `neutral` = `--bg-raised`. `count`: 34×24 box, radius 12, `--bg-surface` + border, white text — used by… nothing currently (deposit-account tab counters were removed per explicit request; component kept for future reuse).
- **Checkbox** — 20×20, radius 4, `--bg-page`/`--border-strong` unchecked, `--accent` fill + inline checkmark checked.
- **SegmentedControl** — plain-text tabs (no shared track pill), gap 8, item height 36 padding 0 14px. Active tab gets its own `--bg-raised` pill background + `--text-strong`; inactive is `--text-quiet` on nothing. Optional `count` badge per option (currently unused — see Home).
- **SettingRow** (new) — Profile's settings-panel row: 24px icon, label, optional right-aligned value + chevron, `danger` modifier (used by `Выход`). Tappable as a whole row (`onClick`), with a subtle active-state opacity/scale transition.
- **FeeBadge** — 38×20, `--bg-surface` fill, border.
- **StatCard** — 171×84-ish, radius 16, **`--bg-surface`** fill (was incorrectly `--bg-raised`, which made it invisible against a `--bg-surface` parent in one layout and is wrong regardless — the token table says stat cards are `--bg-surface`).
- **SummaryCard** — kv rows, 16 gap, bold "total" row, optional two-line value via `tail`. **The crypto-withdrawal instance carries the "За вычетом комиссии сети" caption under its total row again** — an earlier round had removed it on the reasoning that the fee line item above the total already said this, but a fresh Figma reference showed it present, so it's back (`ru.withdraw.payoutCaption`, new key). Row alignment is `flex-start` now (was `baseline`) — with `baseline`, a two-line wrapped label (e.g. "Адрес контракта в блокчейне") and its value/tail column could align on the wrong line, reading as the value sitting one line lower than it should; `flex-start` keeps both columns' first lines level. The gap between the last regular row and the total row shrank to `8px` top padding (was 18) — read as too large a jump per the same pass.
- **Callout** — plain text block, no icon/title, 3 fills: `neutral` (`--bg-surface`, centered) / `warning` (`--panel-warning`) / `danger` (`--panel-error`).
- **WarningPanel** — icon (triangle) + title + body, single `--panel-warning` fill (lightened to `#2B1509`, was `#241005`, per a Figma annotation calling it too dark), radius 12. Distinct from Callout — used for the crypto-withdrawal "Внимание!" notice. Its icon gained `flex-shrink: 0` — a real bug: without it, the triangle `<svg>` was a shrinkable flex child next to the panel's (fairly long) warning body text, and could compress down to invisible depending on available width, matching a report that the icon was "missing" when it was actually just being squeezed to nothing.
- **Modal** — scrim centers the card both horizontally and vertically. Card width is a **per-instance prop** (`width`, default 400, still capped by `max-width: calc(100% - 32px)` for narrow screens) so one modal can be narrowed without affecting every other modal — added specifically because TransferModal needed 343 while the 2FA/email-code modals needed to stay responsive at their own width (see §6.11). Close button is a **bare 22px `×` glyph**, `--text-quiet`, no fill/border — the earlier 28×28 `--bg-raised` circle read as small and drew attention as its own filled shape rather than a quiet corner control; a `closeVariant` prop briefly existed to opt individual modals into this bare style (TransferModal only) but every modal wants it, so it's just the one style now. The button's own box is still a full 44px tap target (pulled back with a negative margin so the larger hit area doesn't push the glyph off the card's corner). `body` padding is `0 24px 8px` with a 20px gap (was 16) and `bottom` padding is `20px 24px 24px` (top was 16) — more air between the last body element and the footer button, most noticeable on the code-input modals where the button used to sit right under the digit cells.
- **TabBar** — `position: absolute; bottom: 0` inside `.app-shell`, 88px + safe-area, radius 16 top corners, 1px top border. Background is `--bg-page`, not `--bg-surface` — darker than the app's surface color, per a Figma annotation; the three tab icons (`icons.tsx`) are solid/filled shapes (`fill="currentColor"`), not outline strokes, matching that same reference. `DealsIcon`'s inner "text line" cutouts are drawn in `fill="var(--bg-page)"` specifically so they read as negative space against the tab bar's own background rather than needing a separate color token. It never scrolls: `html`/`body` are `overflow: hidden; overscroll-behavior: none` (`src/index.css`), and `.tab-bar`/`.app-header` carry `overscroll-behavior: none` directly too, so a touch-drag starting outside `.app-content`'s own scroll area — e.g. directly on the tab bar — can't rubber-band the document itself. That mattered because the tab bar is only pinned relative to `.app-shell`, not the viewport; if the document could scroll/bounce, the "fixed" tab bar visibly dragged along with it. `.app-content` keeps its own `overscroll-behavior: contain` on top of this so its internal scroll never chains to a parent that no longer has anywhere to go. **`html`/`body` are deliberately not `position: fixed`** — an earlier version of this fix used that too, as a belt-and-braces measure from before `overscroll-behavior` had solid WebView support, and it caused a real regression: pinning the document out of normal flow fights the OS's own keyboard-avoidance scrolling, so focusing any text field made the page — and the input/cursor with it — visibly jump or drift as the on-screen keyboard opened, and the same dynamic made the OTP/2FA modal look shifted while a field inside it was focused. `overscroll-behavior: none` alone already stops the bounce without taking over the document's layout, so it's the only mechanism now.
- **CodeInput** — 6 cells, `--bg-raised` fill, radius 8, digit `clamp(18px, 6vw, 24px)`. **Responsive now**: cells are `flex:1` with `max-width:44px` and `aspect-ratio:1`, gap `min(8px, 2vw)` — on a 400px-wide modal card they render at the original 44×44, but on a narrow phone (~340px viewport, ~280px available body width) they shrink to fit instead of overflowing the modal. The overflow was the "кривая модалка" bug reported against the 2FA/email-code modals: six fixed 44px cells plus gaps needed ~304px, more than the modal body had on a narrow screen.
- **TableRow** — see §2.3.
- **CurrencyIcon** — per-ticker brand mark, each its own inline-SVG component rather than one generic shape: KGS/USD are flag icons (KGS: red field + 20-ray gold sun; USD: red/white stripes + a 3×3 star grid in the canton), BTC/USDT/USDC/ETH/RUB are colored-circle marks approximating the real brand glyphs (Tether's T-through-ring, USDC's circular double-arrow + $, Ethereum's stacked-diamond, BTC/RUB via a bold `<text>` currency glyph rather than a hand-transcribed path, to avoid a mistranscribed bezier rendering as a malformed shape). Any ticker without a dedicated icon falls back to a neutral grey `SymbolCoinIcon` (first letter) — deliberately generic, not defaulting to any one brand color.
- **StatusChip** — tone is the literal `DealStatus` union value (`.status-chip--RATE_ACTIVE` etc.) plus a `success` tone; sizes `sm` (**16px/radius 8, font 10px** — shrunk from 18/radius 9/font 12 per a Figma annotation calling the list-row badges too large) and `lg` (24/radius 12, font 12px, deal-detail header — kept at its previous size since only the list-row badge was called out).
- **StatusHero** — icon (50px) + title + subtitle + action, padding-top 16/bottom 16, gradient per status (see §2.1). `StatusHeroTone` = `success | danger | running | stale | pending`.
- **DealRow** — see §2.3.
- **EmptyState** — centered tray-illustration SVG (70×60) + caption, used by Home's empty recent-deals and Deals' empty-filter state.
- **DocumentRow** — 16px download-glyph icon, locked to `16×16` via CSS on the `<svg>` itself (not left to the element's own `width`/`height` attributes) so the enabled and disabled rows render it at an identical size — they'd drift on some platforms otherwise.
- **RequisitesPanel** — wraps itself in `Panel fill="surface" radius="16px"` with its own inline `<h2>` heading instead of the old `Panel heading=` prop (that prop was removed — `Panel` is a pure layout primitive now, see §2.3). Crypto variant: the QR plate now carries the brand mark knocked out at its centre (40px, `--brand-mark` fill, white "X", white border) — the code generates at `errorCorrectionLevel: 'H'` specifically so it stays scannable under the mark. **The asset and network selects now share the same `--bg-raised` fill** (was `--bg-raised`/`--bg-page` — two different fills, meant as a "pick vs. read-only" distinction, but a Figma annotation showed both fields reading as the same lighter tone with a border) with `16px margin-top` between them (was effectively 0 — the two field wrappers had no spacing rule of their own and sat flush against each other). The "Или скопируйте адрес" caption gained flanking divider lines (`::before`/`::after`, 1px `--border`) — the "Отсканируйте QR-код" caption above it stays plain text, only the "or" caption between the QR and the address row got dividers, matching the reference. The address text is weight 600 now (was unweighted/400) and its own local `CopyIcon` was redrawn to match the two-overlapping-squares glyph used everywhere else (`Profile`, etc.) — it had drifted out of sync with that redesign since it's a separate copy of the icon local to this file, not a shared component.
- **BalanceBlock**, **KeyValueRow**, **FilterChips**, **CompanyChip**, **HelpTip**, **Skeleton**, **Toast** — unchanged in shape, retokenized onto the current palette.
- **ConfirmDialog** — still exists (used for the deal-decline and cancel-request confirmations in DealDetail) but Profile's sign-out no longer goes through it, see §6.9.
- **BlockingState** (OtcUnavailable's shell) — logo + centered 80×80 shield illustration + title/body/action/caption.
- **AuthenticatorModal** — 6-digit `CodeInput`, no "sync issues" helper link. Reuses the same mock `verifyCode` as email verification (any 6 digits except `000000`).
- **TwoFactorGate** — the shared second-factor entry point. Renders `AuthenticatorModal` when `authenticatorEnabled` is true, `VerificationModal` (email code) otherwise. Used identically by sign-in, crypto withdrawal, and fiat withdrawal — see §5.
- **QrScannerModal** — full-screen camera overlay (`getUserMedia` + `jsQR`), used to scan a wallet address into the crypto-withdrawal manual-address field. Parses `bitcoin:`/`ethereum:`/`tron:`-style URI payloads down to the bare address. Permission-denied state shows a retry button.
- **TransferModal** — global modal (`store/transferModal.ts`), opened from any withdrawal screen's amount-field transfer glyph. Rebuilt this round against its Figma frame — full geometry and behaviour in **§6.11**, that section is the source of truth for this surface.

## 4. Navigation

| Path | Screen | Tab bar | Header |
|---|---|---|---|
| `/login` | SignIn (business) — **default** | no | close |
| `/login/personal` | SignIn (personal) | no | close |
| `/login/business` | redirect → `/login` | — | — |
| `/forgot` | PasswordRecovery | no | back |
| `/reset-password` | NewPassword | no | back |
| `/otc-unavailable` | OtcUnavailable | no | close |
| `/home` | Home | yes | brand ("XRuby") |
| `/deals` | Deals | yes | close |
| `/deals/:id` | DealDetail | no | back |
| `/profile` | Profile | yes | brand |
| `/withdraw/crypto` | WithdrawCrypto | no | back |
| `/withdraw/fiat` | WithdrawFiat | no | back |
| `/withdraw/fiat/requisites` | WithdrawRequisites | no | back |

`/login` (business) is the default sign-in route, `/login/personal` the alternate — a deliberate, standing deviation from generic nav conventions, made explicitly at the user's request; do not "fix" this back to a personal default.

**Both are `headerVariant: 'close'`, never `'back'`.** `/login/personal` used to be `'back'`, so toggling personal ↔ business made the header (and the native BackButton) flicker between close and back depending on which variant you landed on — wrong regardless of direction, since business and personal are two faces of one entry screen, not a parent/child pair with real navigation depth between them. Combined with the `replace`-navigation above, the two variants now behave as one screen for every purpose that matters (header, native back button, history) even though they're still two route paths internally.

**The personal/business switch links navigate with `{ replace: true }`, not a push.** They previously pushed a new history entry each time, so toggling personal → business → personal a few times left a long chain of login-variant entries in the browser/Telegram back-stack — pressing back would step through login variants instead of leaving the auth flow. Any "switch between sibling views of the same screen" link (as opposed to "go deeper") should follow this pattern: `replace`, not `push`.

AppHeader only renders when `isRealTelegram` is false (or `VITE_FORCE_INAPP_HEADER=true`) — inside a real, correctly-detected Telegram launch, Telegram's own native BackButton is used instead. The clearance `.app-content` reserves for it is measured live off the pill's rendered height (`AppHeader.tsx`'s `useHeaderClearance`, via `ResizeObserver`) plus a small fixed gap — tightened this round from a 28px gap/100px fallback down to a **2px gap / 48px fallback**, so the screen title sits almost immediately under the pill instead of leaving a visibly large empty band at the top.

**The native BackButton (`telegram/backButton.ts`'s `useAppBackButton`) only shows for `headerVariant: 'back'` routes, never `'close'`.** It used to show for both, which meant `/login` and `/otc-unavailable` — genuine entry points, nothing to go back to, even right after signing out — got Telegram's native back chevron anyway; tapping it did `navigate(-1)`, stepping back into whatever screen preceded the entry point (the session guards on those screens redirect straight back to `/login`, so this wasn't exploitable, but it read as a real navigation escape and shouldn't have been offered at all). `'close'` routes now leave the native BackButton hidden so Telegram's own default close affordance shows instead — there is no native "close" button we can render ourselves, only show/hide on the back one, so `'close'` semantics are "hide ours and let the platform's default take over," not a different button we draw.

**In real Telegram (no pill of our own), the fallback clearance is a live `calc()` expression, not a one-time computed number.** This fixed a real bug: that branch is keyed on `active`, which never changes across in-app navigation once we're in real Telegram, so its effect only ever runs once per cold load — and on cold load Telegram hasn't necessarily reported its safe-area insets yet. Baking `getComputedStyle(...)` into a plain px number at that moment could snapshot 0, and every screen navigated to afterward inherited that stale value (only a full reload re-ran the app late enough for the real inset to be available, which is why "content jams under the status bar on navigation, but is fine after reload" was the reported symptom). Writing `--header-clearance` as `calc(48px + max(var(--tg-viewport-safe-area-inset-top, 0px), var(--tg-viewport-content-safe-area-inset-top, 0px)))` instead keeps it correct forever — the browser re-resolves the `var()` references live whenever Telegram updates them, no JS re-run required.

**Every screen's own top padding is now a uniform 8px**, on top of that shared header clearance. It had drifted apart per-screen (Deals 4px, DealDetail 0px, Home/Profile/Withdrawals 16–20px, auth screens 24px) as each was built independently, which read as an inconsistent gap under the header when moving between them — measured now, every screen sits exactly 10px below the pill's bottom edge (2px clearance gap + 8px screen padding), no exceptions. Keep new screens on this same 8px top value rather than picking a fresh one.

## 5. Auth & second factor

- Sign-in (`SignIn.tsx`): email + password → `sendVerificationCode` (validates email format) → `getUser(clientType)` to read `authenticatorEnabled` → opens `TwoFactorGate`.
- **General rule** (`User.authenticatorEnabled: boolean`): if true, Google Authenticator gates the action; if false, the email code (`VerificationModal`) does — never both, and this applies uniformly at sign-in, crypto-withdrawal confirmation, and fiat-withdrawal confirmation. Mock fixtures: the business account (`UL`) has it enabled, the personal account (`FL`) doesn't, so both branches are exercisable without a dev switch.
- Crypto withdrawal (`WithdrawCrypto.tsx`) and fiat withdrawal (`WithdrawRequisites.tsx`) both fetch the session user's `authenticatorEnabled` on mount and gate their "Подтвердить" button the same way: validate fields → open `TwoFactorGate` → only submit the already-validated payload after it resolves.
- Social sign-in (Google/Apple) skips 2FA entirely (`signInSocial`, unchanged).
- Both the email-code modal and the Authenticator modal share `CodeInput`, which is now responsive (§3) — this was the fix for the "кривая модалка" report against 2FA.

## 6. Screens

### 6.1 SignIn (`/login`, `/login/personal`)
`Logo`, title ("Вход в бизнес-аккаунт" / "Вход в личный аккаунт"), email, password (eye toggle), "Забыли пароль?" link, submit button, Google/Apple social buttons, footer switch-account link ("Войти в бизнес-аккаунт" / "Войти в личный аккаунт", `replace`-navigated per §4). 2FA per §5. Content inset 20px (all auth screens; every other screen is 16px, see §2.3).

Top padding is **24px** here (not the app-wide 8px, see §4) — auth screens carry a logo above the title and needed more air around it; `.logo` also has its own **16px** `margin-bottom` (was 8) on top of the normal 16px inter-element gap, so logo→title reads as a full 32px against a design reference, not 24. Title weight is **500** (went 700 → 600 → 500 across two rounds, each still reading heavier than the reference). `Забыли пароль?` is **16px** (700 → 15 → 16, same iterative reasoning). The Apple social button's icon is the standard flat Apple-logo silhouette path (`simple-icons`' `apple` glyph) — an earlier hand-drawn approximation didn't read as recognizably Apple. The footer switch-account link's trailing glyph is a proper **arrow SVG** in `--text-primary` now, not the plain `›` character in `--text-quiet` it used to be — the reference showed a straight right-arrow, lighter than our chip-grey chevron. `PersonIcon`/`BuildingIcon` (the leading glyph on that same link) were already outline SVGs, not the filled icons an earlier round's screenshot seemed to show — that read turned out to be a stale/cached build, not the actual source.

### 6.2 PasswordRecovery (`/forgot`) / NewPassword (`/reset-password`)
Flow unchanged: email → `sendVerificationCode` → code modal → new-password form.

**NewPassword was rebuilt to match its design reference** — it previously had no `Logo`, no password-generator, and no strength indicator at all (title was also "Новый пароль", not the reference's "Восстановление пароля"). Now: `Logo` → title → `Новый пароль` field (16px placeholder "Введите новый пароль", plus a `HelpTip` "?" glyph next to the label via `PasswordField`'s new `labelHint` prop) → a `Сгенерировать пароль`/strength row → `Подтверждение пароля` field ("Подтвердите пароль") → `Продолжить`.

`Сгенерировать пароль` fills **both** fields with the same generated 12-character password (4 required classes — upper/lower/digit/symbol — plus 8 more, shuffled), copies it, and toasts `Пароль скопирован` — matching the "generate once, both fields get it" behavior the reference implies. The strength indicator (`computeStrength` in `NewPassword.tsx`) is two states, not three: **Слабый** (`--accent` red dot) below 8 chars or under 3 character classes, **Надежный** (`--warning-text` amber dot — that token was sitting unused since Profile's security-level row was removed, see §6.9) otherwise; hidden entirely while the field is empty. Only two tiers because that's what the reference shows — no evidence of a third ("Средний") state to build against.

### 6.3 Home (`/home`)
Full-bleed panel model, see §2.3:
1. Hero: "OTC" title/subtitle, desk-hours caption, `CompanyChip` (client name), two `StatCard`s (active deals count, 30-day volume). The title/subtitle/desk-hours trio is wrapped in its own `.home__hero-text` flex column with an **8px** gap — tighter than the 20px gap from that trio down to the company chip/stat cards below it, per a Figma annotation calling out the top block specifically.
2. "Недавние заявки": up to 2 `DealRow`s (no per-status highlight, see §2.3), or `EmptyState` if none.
3. "Депозитный аккаунт": `SegmentedControl` (Криптовалюта/Фиат, no count badges — removed per an earlier request), then `TableRow` per positive-balance asset, "Активы с нулевым балансом скрыты" caption when any are hidden. Radius is **`24px 24px 0 0`**, not a uniform 24 — it's the last panel on the screen, so rounding the bottom corners too just let the `--bg-raised` frame color peek through as two small grey curves under an otherwise straight edge.

### 6.4 Deals (`/deals`)
No panel, **no screen title any more** (the "Заявки" `<h1>` was removed per a Figma annotation — the filter chips now sit right under the header) — `FilterChips` (Все/Активные/Исполненные/Отклонённые, 36px pills, horizontal-scroll, last chip deliberately clipped, **12px gap** between pills, up from 8) sit directly on the bg-page frame at 16px inset, then a flat list of full-bleed `DealRow`s (loading skeletons, error+retry, or `EmptyState` — no deals at all, or none matching the filter, with a "Показать все" reset link). The active chip is now a **light fill** (`--text-primary` background, `--text-on-light` label) instead of the dark `--bg-raised` fill it used to have — read as too similar to the inactive chips per the same pass.

### 6.5 DealDetail (`/deals/:id`)
No panel — header (id + `StatusChip` lg + direction) sits directly on bg-page at 16px inset. `.deal-detail__id` is weight **600** (was 700, read as too heavy) and `.deal-detail__direction` is **16px `--text-muted`** (was 14px `--text-quiet`, read as too small/dim) — both per a Figma annotation pass. Three-way body split on status:
- **`RATE_ACTIVE` → QuoteCard** (own `--bg-surface` card): rate (**28/36**, weight 600 — was 36/44, shrunk along with the card's other text per the same pass: the "Заявка подготовлена…" and "Курс для вас" lines are now 14px, were 16), a live countdown (`m:ss сек`, client-`setInterval`, re-synced on `visibilitychange`/focus, never trusts elapsed device time), accept (`confirmDeal` → `RUNNING`) / decline. Flips to `RATE_STALE` at zero via the mock's `expireQuote(id)`. No balance math here. The decline link sits `margin-top: 12px` below the accent button now — it used to inherit only the card's base `4px` flex-gap, reading as cramped against "Подтвердить сделку".
- **`AWAITING_FUNDS` → ConfirmationBody (hold confirmation)**: `BalanceBlock` (amount now **28/36**, was 36/44; ticker suffix 14px, was 16; its transfer-icon button grew to 28×28 with a 26px glyph, was 20×20/24px — read as too small to tap confidently) → `Callout` (14px body text, was 16; 4 balance-vs-deal-amount cases: sufficient/short1/short/below-min — `short1`/`short` are `warning`, `belowmin` is `danger`) → confirm/decline (same 12px-gap fix as the quote card, plus the shared `.button--link` bumped to 15px, was 14, per the same pass) → `RequisitesPanel` (own `--bg-surface` card). Its chip/list label is **"Пополните баланс"** everywhere now — it used to read "Ожидает пополнения" in the list and "Пополните баланс" in the detail header, two different labels for one status; unified on the detail's wording.
- Everything else → **StatusHeroBody**: `RATE_PENDING` (pending tone), `RATE_STALE`, `RUNNING`, `DONE`, `DECLINED` — icon/title/subtitle/action per status. `StatusHero`'s icons shrank from 50px to 40px with thinner strokes (spinner ring 4px→3px) per the same annotation pass calling the ring "too big." The terminal-state glyphs (check/cross/hourglass) were rebuilt as a shared `Medallion` — a light radial-gradient grey disc with a thin rim highlight — replacing the old flat dark `--status-*-fill` circle, matching the reference's "coin" look; only the glyph inside stays tone-colored (`--status-done-text` etc.). `.status-hero--stale`'s gradient was a bare `background-image: none` — a real bug, since `--hero-top-stale` existed as a token but was never wired up; it now uses the same top-tinted gradient formula as every other tone. `RATE_PENDING`'s subtitle carries an explicit `\n` (`.status-hero__subtitle` is `white-space: pre-line`) so "В рабочее время" and "(пн–пт 10:00–18:00 мск)" render on two lines, not one wrapped run.

`Детали` and `Документы` are plain heading + rows directly on the page background — **not** cards (see §2.3), section-title now **16px/24** (was 18/28) with a **6px** gap to the first row (was 12), also per the annotation pass. **`Детали` always shows the full 5-row set now** — `showsFullDetailsRows()` used to hide direction/dates/amounts for `RATE_PENDING`/`RATE_ACTIVE`/`RATE_STALE`, but a fresh Figma comparison showed Дата создания/Направление present for all three, so the function just always returns `true` now; `Курс` still reads "Уточняется" for `RATE_PENDING`/`RATE_STALE` specifically (that logic is separate, in `DealDetail.tsx` itself, unchanged). "Документы" availability keyed by `lib/dealStatus.ts`'s `getDocumentAvailability()` — **`DECLINED` now sets `showCaption: true`** (was `false`, a real bug: it silently dropped the "Станет доступен позже" captions under DECLINED's disabled document rows, the only status where that happened). `DocumentRow`'s own name→caption gap is `0` now (was 4px) per "no gap" feedback on that specific spacing.

### 6.6 WithdrawCrypto (`/withdraw/crypto`)
**No screen title any more** ("Вывод криптовалюты" was removed per a Figma annotation — the screen now opens straight on "Выберите актив") — asset `Select` (asset layout) → address section → network `Select` (non-BTC only, filtered to the selected address's compatible networks, or the asset's full network list when entering a new address manually) → amount `AmountField` (with transfer-modal glyph, no `flexShrink`-caused gap issue any more — its icon-to-label margin dropped to 0) → `SummaryCard` (min/limit/contract-tail/fee/payout, with the "За вычетом комиссии сети" caption restored, see §3) → `WarningPanel`. Section-title headings (`Выберите актив`/`Выберите адрес и сеть`/`Сумма вывода`) dropped from weight 700 to 600, read as too heavy per the same pass. `AmountField`'s balance line no longer repeats the ticker (`Баланс: 56 889.65`, was `Баланс: 56 889.65 USDT` — the ticker's already on the field's own asset icon/label right above it). The submit button's sticky footer gained more top padding (20px, was 12) for breathing room above it.

Address section is manual-first, not gated behind saved addresses: if any are saved, a `Select` (address layout) lists them plus a "Новый адрес" option — **it no longer shows the wallet-labels metadata line** (`Метки: Trust Wallet, MetaMask +2`) per an explicit request to drop it here (the `Select` component still supports the `labels` feature generally, this screen just stops passing it); picking "Новый адрес" (or having zero saved addresses at all) reveals a plain `TextField` with a flat QR-icon button that opens `QrScannerModal`. The `HelpTip` next to "Адрес кошелька" was removed too, per the same pass.

Submit: validate address + amount → `TwoFactorGate` → `submitCryptoWithdrawal({ ticker, network, address, amount, idempotencyKey })`.

### 6.7 WithdrawFiat (`/withdraw/fiat`)
Currency + method `Select`s, amount field, summary (min/limit/entered amount/fee/total debit). No submission here — "Продолжить" navigates to `WithdrawRequisites` carrying `{ ticker, methodId, amount }` via route state.

### 6.8 WithdrawRequisites (`/withdraw/fiat/requisites`)
Reached only via WithdrawFiat's route state (redirects back to `/withdraw/fiat` if missing).

**The transfer-type tabs are gone.** They used to re-ask "what kind of transfer is this" via a `SegmentedControl` (Внутренний / Межбанк KG / Межбанк RU) — redundant, since the withdrawal method already picked on the previous screen (WithdrawFiat) determines that: `WithdrawMethod` now carries its own `transferType: FiatTransferType` (set in the mock fixtures — `bakai` → `internal`, `other_kg` → `kg`, `other_ru`/`swift` → `ru`), and this screen just looks it up (`options.methods.find(m => m.id === methodId)`). The tabs were also the thing sliding out of alignment on smaller screens — removing them removed the bug along with the redundant question. The field set below is keyed off that looked-up type, unconditionally:

| Transfer type | Fields shown |
|---|---|
| internal | account only |
| kg | account, ИНН, bank name, БИК банка получателя |
| ru | account, БИК получателя, ИНН, bank name, БИК банка получателя, корр. счёт |

**Fields never disappear.** The saved-requisite `Select` (only rendered at all when there's at least one saved requisite matching this method's transfer type — filtered, since a saved entry for a different field shape wouldn't populate sensibly) sits above the field set; picking a saved entry fills the fields in and disables them (still visible, not hidden) instead of swapping the form out from under the user, picking "Новые реквизиты" clears them back to blank and editable. "Сохранить реквизиты" only shows for a fresh entry — saving an already-saved one doesn't mean anything.

Submit: validate account → `TwoFactorGate` → `submitFiatWithdrawal`.

### 6.9 Profile (`/profile`)
Two full-bleed panels, bg-raised frame, 16px seam (see §2.3). `User` now carries `verified: boolean`, `securityLevel: 'LOW'|'MEDIUM'|'HIGH'`, `phone`, `faqUrl`, `aboutUrl` — the old `verificationLevel: 1|2` model was dropped entirely, it's a different concept (verification vs. account-security posture) and the new model matches the SVG mockup this was rebuilt against.

**Panel 1 — account.** Title row: client name + a "Верифицирован" badge (green check, hidden entirely when `!user.verified` — no badge, not a grey one). Details card (`--bg-surface`, 3 stacked label/value rows): Почта (masked, copy icon copies the *unmasked* address), ID пользователя (32 chars grouped by 4, copy icon strips spaces), Телефон. Then the compact certificate button (`Справка об открытии аккаунта`). **No "Уровень безопасности" row and no "Часы деска" section any more** — both removed per explicit request; the security-level row didn't earn its keep and the desk-hours block duplicated Home's hero caption. `User.securityLevel` still exists on the model/fixtures, it's just not rendered here.

**The certificate button now just opens the sample document directly**, the same one-line `openExternalLink(SAMPLE_DOCUMENT_URL)` pattern DealDetail's document rows use (`lib/sampleDocument.ts`, shared by both) — no loading spinner, no separate `getAccountCertificate()` mock call, no failure toast. The earlier version had its own small async flow (spinner while "generating", error toast on failure) that the original design intent called for; simplified to match the deal-document pattern per explicit request that the two should behave identically. `api/mock/documents.mock.ts` and the `getAccountCertificate` export are gone with it.

**Panel 2's `flex` is `1 0 auto`, not the shorthand `flex: 1`.** The shorthand's default `flex-basis: 0%` let the panel — and the `Выход` row pinned to its bottom via `.profile__spacer` — shrink below its own content height on short screens instead of the page growing past 100% and scrolling, so `Выход` ended up clipped below the fold with no way to reach it. `flex-basis: auto` (respect content height) + `flex-shrink: 0` (never compress below it) fixes that while keeping the grow-to-fill-remaining-space behavior on tall screens where there's room to spare.

**Verified badge, copy icon, email mask** — per a Figma annotation pass: the verified glyph is now a filled `--verified` circle with a `--bg-page` checkmark cut out of it (was a bare stroked checkmark with no circle backing, read as too thin). `CopyIcon` redrawn as the standard two-overlapping-squares glyph. `maskEmail` now shows **3** asterisks (`kar***@gmail.com`) instead of 1. `.profile__detail-text` gained `min-width: 0` — without it the flex child couldn't shrink to trigger its own `text-overflow: ellipsis`, so on the longer ID row the text could push past the card's width and leave the copy icon looking "far away" with inconsistent spacing versus the short email row; with `min-width: 0` both rows truncate correctly and the icon sits at a consistent 8px gap from the text in both.

**Certificate button, setting-row values, tab bar corners** — the compact secondary "Справка об открытии аккаунта" button now fills `--border` instead of the standard secondary `--bg-raised` (scoped to `.button--compact.button--secondary`, which per `Button.tsx`'s own comment is only ever used by this one button, so it's safe to diverge from the shared secondary fill here) — the darker shared fill read as too close to the page background per the same annotation pass. `SettingRow`'s value text (`Русский`, `Тёмная`) is now weight 600 (was inheriting normal), and its trailing chevron flipped from a right-arrow (navigate-deeper semantics) to a down-arrow (opens-a-sheet-below semantics) to match `PickerModal` becoming a bottom sheet. `TabBar`'s top corners are no longer rounded (`border-radius` removed entirely, was `16px 16px 0 0`) per the same pass calling out rounding on "the menu" specifically — this is a global `TabBar` change, so it applies to Home/Deals too, not just Profile. `GlobeIcon`/`ThemeIcon` (Язык/Тема row icons) were redrawn as filled/solid shapes (tinted-fill globe, solid crescent moon) instead of pure outline strokes, matching the same filled-icon direction as the tab bar icons (§6.3).

**Panel 2 — settings.** `Язык` and `Тема` rows now open a `PickerModal` (see §3) instead of showing a static value: Язык offers Русский/English/Кыргызча, Тема offers Тёмная/Светлая, backed by `store/settings.ts` (in-memory zustand, not persisted). Selecting an option updates the row's displayed value immediately. This is still cosmetic — the app stays Russian/dark regardless of what's picked, per the original design intent ("wire it to a store now so a real switch later is a data change, not a screen change") — but it's now a real interactive picker instead of an inert label, per an explicit request. Divider, then FAQ / О нас (external links via `user.faqUrl`/`user.aboutUrl`), then `Выход` pinned to the bottom. **No confirmation dialog any more** — it used to ask "Выйти из аккаунта?" first; tapping it now clears the session and lands on `/login` immediately, per explicit request.

### 6.10 OtcUnavailable (`/otc-unavailable`)
`BlockingState`: 80×80 shield illustration, title/body per reason (`VERIFICATION_REQUIRED` vs `NOT_ELIGIBLE`), action button (open web cabinet / contact support).

### 6.11 TransferModal (global)

Rebuilt this round against the `Трансфер` Figma frame (node `2328-79489`) — the geometry below is measured off that export, not approximated. Opens over any withdrawal screen via the amount-field transfer glyph; the screen underneath stays fully legible (the scrim is only the 10% white wash, `--modal-scrim`, no extra darkening or blur beyond that).

**Card.** 343 wide (`Modal`'s `width={343}` prop, capped by the shared `max-width: calc(100% - 32px)` on narrow screens), radius 16, `--bg-page`, centered. Title `Трансфер между аккаунтами` wraps to two lines. Close control is the bare `×` glyph every modal uses now (§3) — this was the one modal it was originally built for, before the style became the universal default.

**Account fields — stacked, not side by side.** `С` and `На` are two full-width `Select`s (plain layout, `--bg-raised` fill, 44px height) stacked vertically with an 8px gap, **not** side-by-side with a swap button between them (that was the pre-rebuild layout, and it didn't match the frame). The swap control floats centered on the seam between the two fields, overlapping each slightly: a 52px `--bg-page` ring (`.transfer-modal__swap-ring`) containing a 44px `--bg-raised` circular button with a 24px up/down-arrows glyph. The two fields can never hold the same account — picking one flips the other; the swap button exchanges them and leaves the asset/amount alone.

The ring's vertical position is **measured off the DOM, not guessed from a CSS midpoint.** Centering it at 50% of the whole `С`-label+box+`На`-label+box stack lands it much closer to `С` than to `На`, because only `На` has a label sitting in the way — it read as "pinned to the top field" rather than symmetric. `TransferModal.tsx` instead measures the actual `.select__box` elements' `getBoundingClientRect()` (via a `ResizeObserver` on the accounts container, plus a one-off re-measure ~220ms after open to let the modal's scale-in animation settle first — measuring mid-animation was itself good for a few stray px) and sets the ring's `top` to the true midpoint between "С" box's bottom and "На" box's top. This is deliberately dynamic rather than a hardcoded px offset so it stays correct if the label text, font, or locale ever changes.

**Spacing rhythm — three different gaps, not normalized to one.** 8px between the `С` and `На` field groups (the swap ring straddles this seam). **40px** between the account block and the amount block (`Списать`) — they're separate blocks and the frame draws the separation that way. 12px between the two footer buttons (`.transfer-modal__footer`, not the shared `.button-row`'s default 16px). Do not collapse these to a single uniform gap.

**Amount field.** Standard `AmountField` (44px, `--bg-page` fill — the one place besides the account selects where a field's fill matters: `--bg-raised` means "pick a thing", `--bg-page` means "type a number"), with an embedded 24px `CurrencyIcon` asset `Select` and a "Макс" button. A transfer carries no fee, so "Макс" is the full available balance of the source account for the selected asset.

**Footer.** Paired `Отменить` (secondary) / `Подтвердить` (accent) buttons, 12px gap (see above).

**Behaviour** (unchanged by the rebuild): on confirm, the modal closes, a toast confirms, and the screen underneath re-fetches balances — which on the deal hold-confirmation screen can move the callout into a different case, the reason the transfer glyph is reachable from there at all.

**Still open:** the Figma export doesn't cover the modal's loading, error, or empty-source-account states — those exist in the build (spinner on confirm, insufficient-funds error under the amount field) and stay as they are until a frame exists to check them against.

## 7. Mock/dev switches (`src/lib/devSwitches.ts`, `?param=` on the hash route)

- `?otc=verification|not_eligible|granted` — forces `user.otcAccess`.
- `?scenario=quote_expiring` — the `RATE_ACTIVE` deal's `quoteExpiresAt` starts at ~10s instead of 5 minutes (applied once at the mock store's module init).
- `?scenario=empty_deals` — deals list loads empty.
- BTC is the natural "no saved addresses" case for exercising WithdrawCrypto's manual-entry path (no network selector shown for BTC either).

## 8. Known gaps / next

- `Badge`'s `count` variant and `SegmentedControl`'s `count` prop are unused since the deposit-account tab counters were removed; keep or delete next time it comes up.
- Deal history (list/detail/status actions) intentionally stays mock-only per an earlier round's instruction — revisit when that Swagger surface exists.
- Profile's language/theme pickers are UI-only (§6.9) — no i18n dictionary swap or light-theme token set exists yet. Building either is a real feature, not a follow-up polish item.
- Worth confirming whether `isRealTelegram` detection is reliable in the actual deployed bot context (§4) — several past layout issues traced back to uncertainty here.
- TransferModal's loading/error/empty-source-account states aren't covered by its Figma frame (§6.11) — they exist in the build as-is, revisit if a frame for them ever shows up.
