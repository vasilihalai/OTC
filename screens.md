# xRuby OTC — screens.md

Reverse-documented from the current implementation (`/Users/vasilihalai/Desktop/OTC`) as of 2026-08-19. This describes what's actually built and live, not a design intent — use it as the baseline for the next round of changes.

## 1. Scope

Telegram Mini App (React + TypeScript + Vite, HashRouter, zustand). Mock-first: every screen reads/writes through `src/api/index.ts`, which resolves each function to either `src/api/mock/*` or `src/api/real/*` behind `VITE_USE_REAL_API`. Deals (list, detail, and every status action on them — confirm/decline/request-new-rate/expire-quote) are the one part that stays mocked regardless of the flag; everything else (auth, profile, balances, withdrawals, transfers, requisites) is real-API-ready with a matching `real/*` stub already in place, assumed-contract, to reconcile against Swagger once it exists.

Dark theme only, regardless of the user's Telegram theme.

## 2. Design tokens

### 2.1 Colors (`src/theme/tokens.css`)

```
Surfaces
  --bg-page          #0C0E12   screen background
  --bg-surface       #13161B   panels/cards, most component fills
  --bg-raised        #22262F   nested elements on top of a surface (stat cards, active tab pill, action-icon circles, dropdown active row)
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
  --badge-success-bg #022417 / --badge-success-text #027A48
  --panel-warning    #301003   WarningPanel + Callout warning fill
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

Font: Inter (self-hosted via `@fontsource/inter`, weights 400/500/600/700), `font-variant-numeric: tabular-nums` on `<body>`.

### 2.3 Metrics

- Page padding: auth screens (`SignIn`, `PasswordRecovery`, `NewPassword`) 20px horizontal; every other screen 16px.
- Radii: button 30 · field/summary/warning-panel 12 · card/modal 16 · hero top corners 24, flat bottom · code cell 8 · badge (success/neutral) 20 · count badge 12 · fee badge 6 · checkbox 4 · tab-bar top corners 16.
- Heights: button/field/code-cell 44 · tab-segment item 36 · badge 24 · fee badge 20 · table row 64 · deal-list row 128 (full-bleed, `margin: 0 -16px`) · tab bar 88 + safe-area.
- AppHeader: floating pill, `position: absolute` over content, not in flow. `.app-content`'s top clearance is **measured live** off the pill's rendered height via `ResizeObserver` (`AppHeader.tsx`'s `useHeaderClearance`), written to `--header-clearance` on `:root` — not computed from a formula. This was a deliberate fix: the safe-area CSS vars' real composition (`--tg-viewport-safe-area-inset-top` vs. `--tg-viewport-content-safe-area-inset-top`) proved inconsistent across devices/Telegram versions, so any fixed formula kept over- or under-shooting the actual on-device gap. When no pill is rendered at all (Telegram's native back button is in use instead — see §3 AppHeader), the clearance falls back to `92px + max(safeAreaInsetTop, contentSafeAreaInsetTop)`.
- TabBar: 88px + safe-area-bottom, `position: absolute` (not `fixed` — avoids iOS WebKit's fixed-inside-scrolling-ancestor jitter), top corners radius 16, 1px top border + drop shadow, decorative white home-indicator bar (134×5, radius 100) centered near the bottom.
- `.app-shell`'s desktop-preview width cap (max-width 480, centered) only applies via `body:not(.in-telegram)` — real Telegram launches (`isRealTelegram`, toggled as a body class in `ensureTelegramEnvironment()`) get full width, since some WebViews report a wider logical viewport than the physical screen and the cap would otherwise letterbox the app.

## 3. Component library (`src/components/*`)

- **Button** — variants `primary | accent | secondary | link | footer-link`, plus a `danger` boolean modifier (used with `link`). Height 44, radius 30. Primary: white fill enabled, `--bg-raised` fill disabled, label stays `--text-on-light` in *both* states. Accent: `--accent` fill. `.button-row` = two buttons side by side, `flex:1` each, 16 gap, secondary/cancel left.
- **TextField / PasswordField** — label row always carries a red required asterisk (every field in the app is required, no prop threading). Box: height 44, radius 12, fill `--bg-page`, border `--border` → `--border-strong` on focus, `--accent` on error. `PasswordField`'s masked-dot font-size is smaller (13px) than the unmasked/typing font-size (16px) — shrinks the native dot glyph without affecting the visible-text size; safe from iOS auto-zoom because the viewport meta already sets `user-scalable=no, maximum-scale=1`.
- **AmountField** — label/available row, then a box with an optional embedded asset `Select`, the numeric input, and a "Макс" button. `transferVariant` (used only inside TransferModal): taller box (76px), bigger input font (28/600), `--bg-raised` fill instead of `--bg-page`.
- **Select** — `layout: 'asset' | 'method' | 'address' | 'plain'`. Closed box + click-open dropdown, 36px+ rows. `address` layout is two lines: truncated address, then an optional `Метки: …` metadata line built from `labels: string[]` on the option (max 2 shown + `+N`). `readOnly` (no chevron, unclickable) when there's ≤1 option.
- **Badge** — `success | neutral | count`. success/neutral: radius 20, `success` = green fill/text pair, `neutral` = `--bg-raised`. `count`: 34×24 box, radius 12, `--bg-surface` + border, white text — used by... nothing currently (deposit-account tab counters were removed per explicit request; component kept for future reuse).
- **Checkbox** — 20×20, radius 4, `--bg-page`/`--border-strong` unchecked, `--accent` fill + inline checkmark checked.
- **SegmentedControl** — plain-text tabs (no shared track pill), gap 8, item height 36 padding 0 14px. Active tab gets its own `--bg-raised` pill background + `--text-strong`; inactive is `--text-quiet` on nothing. Optional `count` badge per option (currently unused — see Home).
- **FeeBadge** — 38×20, `--bg-surface` fill, border.
- **SummaryCard** — kv rows, 16 gap, bold "total" row, optional two-line value via `tail`.
- **Callout** — plain text block, no icon/title, 3 fills: `neutral` (`--bg-surface`, centered) / `warning` (`--panel-warning`) / `danger` (`--panel-error`).
- **WarningPanel** — icon (triangle) + title + body, single `--panel-warning` fill, radius 12. Distinct from Callout — used for the crypto-withdrawal "Внимание!" notice.
- **Modal** — scrim now **centers** the card both horizontally and vertically (previously anchored near the top for keyboard-avoidance reasons; changed on request). Card 400px wide (`max-width: calc(100% - 32px)`), radius 16, `--bg-page`. Structure: `top` (title + 48×48 round close button) → `body` (24px horizontal padding) → optional `bottom` (footer actions).
- **CodeInput** — 6 cells, 44×44, radius 8, `--bg-raised` fill, digit 24/32/400.
- **TableRow** (replaces the old `AssetRow`) — used on Home's deposit-account list. 64px row: `CurrencyIcon` (40px) → ticker/name → amount (right-aligned) → a 68px-wide action cell holding a 40px round `--bg-raised` circle with a bold arrow icon, opening withdrawal with the asset preselected.
- **CurrencyIcon** — flat placeholder icon per ticker (real assets can swap in later). BTC/USDT/USDC/RUB: colored circle + currency symbol. KGS/USD: real inline-SVG flag icons (Kyrgyzstan sun, US stars/stripes) — added specifically because the generic letter-in-circle didn't match the source design for those two.
- **StatCard** — 171×84-ish, radius 16, **`--bg-raised`** fill (must differ from its parent Panel's `--bg-surface`, or the card is invisible against it — this was a real bug caught and fixed mid-session), value 24/32/600.
- **StatusChip** — tone is the literal `DealStatus` union value (`.status-chip--RATE_ACTIVE` etc.) plus a `success` tone; sizes `sm` (18/radius 9, list rows) and `lg` (24/radius 12, deal-detail header).
- **StatusHero** — icon (50px) + title + subtitle + action, padding-top 16/bottom 16, gradient per status (see §2.1). `StatusHeroTone` = `success | danger | running | stale | pending`.
- **DealRow** — full-bleed 128px row (`margin: 0 -16px; width: calc(100% + 32px)`) for both Home's "Недавние заявки" and the Deals list. No per-row background modifier (a `RATE_ACTIVE` highlight was tried and removed — read as a stuck on-tap state, not an intentional highlight).
- **EmptyState** — centered tray-illustration SVG (70×60) + caption, used by Home's empty recent-deals and Deals' empty-filter state.
- **DocumentRow**, **RequisitesPanel**, **BalanceBlock**, **KeyValueRow**, **FilterChips**, **CompanyChip**, **HelpTip**, **Skeleton**, **Toast**, **ConfirmDialog** — unchanged in shape from the previous pass, retokenized onto the current palette.
- **BlockingState** (OtcUnavailable's shell) — logo + centered 80×80 shield illustration + title/body/action/caption.
- **AuthenticatorModal** — 6-digit `CodeInput`, no "sync issues" helper link (removed on request). Reuses the same mock `verifyCode` as email verification (any 6 digits except `000000`).
- **TwoFactorGate** (new) — the shared second-factor entry point. Renders `AuthenticatorModal` when `authenticatorEnabled` is true, `VerificationModal` (email code) otherwise. Used identically by sign-in, crypto withdrawal, and fiat withdrawal — see §5.
- **QrScannerModal** — full-screen camera overlay (`getUserMedia` + `jsQR`), used to scan a wallet address into the crypto-withdrawal manual-address field. Parses `bitcoin:`/`ethereum:`/`tron:`-style URI payloads down to the bare address. Permission-denied state shows a retry button. Header is offset by a fixed 110px top / 70px right padding to clear Telegram's persistent fullscreen window chrome (the collapse/menu buttons that sit top-right on every screen).
- **TransferModal** — global modal (`store/transferModal.ts`), opened from any withdrawal screen's amount-field transfer glyph. From/To account `Select`s (plain layout) with a swap button between them; amount field is the `transferVariant` big style with an embedded asset `Select` showing icon + ticker only (currency full name deliberately dropped — was cluttering the row).

## 4. Navigation

| Path | Screen | Tab bar | Header |
|---|---|---|---|
| `/login` | SignIn (business) — **default** | no | close |
| `/login/personal` | SignIn (personal) | no | back |
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

AppHeader only renders when `isRealTelegram` is false (or `VITE_FORCE_INAPP_HEADER=true`) — inside a real, correctly-detected Telegram launch, Telegram's own native BackButton is used instead and this component returns `null` on non-home/profile screens. In practice, `isRealTelegram` has been observed false on at least one real device this session (our own pill and Telegram's native fullscreen chrome both visible at once in testing screenshots) — worth checking `isTMA('complete')`'s detection conditions if this recurs; it may indicate the Mini App isn't being launched with the full expected `tgWebApp*` launch params.

## 5. Auth & second factor

- Sign-in (`SignIn.tsx`): email + password → `sendVerificationCode` (validates email format) → `getUser(clientType)` to read `authenticatorEnabled` → opens `TwoFactorGate`.
- **General rule** (`User.authenticatorEnabled: boolean`): if true, Google Authenticator gates the action; if false, the email code (`VerificationModal`) does — never both, and this applies uniformly at sign-in, crypto-withdrawal confirmation, and fiat-withdrawal confirmation. Mock fixtures: the business account (`UL`) has it enabled, the personal account (`FL`) doesn't, so both branches are exercisable without a dev switch.
- Crypto withdrawal (`WithdrawCrypto.tsx`) and fiat withdrawal (`WithdrawRequisites.tsx`) both fetch the session user's `authenticatorEnabled` on mount and gate their "Подтвердить" button the same way: validate fields → open `TwoFactorGate` → only submit the already-validated payload after it resolves.
- Social sign-in (Google/Apple) skips 2FA entirely (`signInSocial`, unchanged).

## 6. Screens

### 6.1 SignIn (`/login`, `/login/personal`)
Logo, title ("Вход в бизнес-аккаунт" / "Вход в личный аккаунт"), email, password (eye toggle), "Забыли пароль?" link, submit button, Google/Apple social buttons, footer switch-account link — **"Войти в бизнес-аккаунт"** / "Войти в личный аккаунт" (both now phrased as "log into", not "switch to" — request from this session). 2FA per §5.

### 6.2 PasswordRecovery (`/forgot`) / NewPassword (`/reset-password`)
Unchanged shape: email → `sendVerificationCode` → code modal → new-password form with strength hint.

### 6.3 Home (`/home`)
Three `Panel`s, flat `--bg-page` background (no raised outer frame — that was tried and reverted, read as unwanted grey margins around the cards):
1. Hero: "OTC" title/subtitle, desk-hours caption, `CompanyChip` (client name), two `StatCard`s (active deals count, 30-day volume).
2. "Недавние заявки": up to 2 `DealRow`s, or `EmptyState` if none.
3. "Депозитный аккаунт": `SegmentedControl` (Криптовалюта/Фиат, **no count badges** — removed per request), then `TableRow` per positive-balance asset, "Активы с нулевым балансом скрыты" caption when any are hidden.

### 6.4 Deals (`/deals`)
Title, `FilterChips` (Все/Активные/Исполненные/Отклонённые, 36px pills, horizontal-scroll, last chip deliberately clipped), then `DealRow` list inside one Panel — loading skeletons, error+retry, or `EmptyState` (no deals at all, or none matching the filter, with a "Показать все" reset link).

### 6.5 DealDetail (`/deals/:id`)
Header: id + `StatusChip` (lg) + direction. Three-way body split on status:
- **`RATE_ACTIVE` → QuoteCard**: rate (amount-xl + unit), a live countdown (`m:ss сек`, client-`setInterval`, re-synced on `visibilitychange`/focus, never trusts elapsed device time), accept (`confirmDeal` → `RUNNING`) / decline. Flips to `RATE_STALE` at zero via the mock's `expireQuote(id)`. No balance math here.
- **`AWAITING_FUNDS` → ConfirmationBody (hold confirmation)**: `BalanceBlock` → `Callout` (4 balance-vs-deal-amount cases: sufficient/short1/short/below-min — `short1`/`short` are `warning`, `belowmin` is `danger`) → confirm/decline → `RequisitesPanel`.
- Everything else → **StatusHeroBody**: `RATE_PENDING` (pending tone), `RATE_STALE`, `RUNNING`, `DONE`, `DECLINED` — icon/title/subtitle/action per status.

"Детали" block hides direction/dates/amounts for `RATE_PENDING`/`RATE_ACTIVE`/`RATE_STALE` (only shows Курс, as "Уточняется" for the first and last); shows all 5 rows for `AWAITING_FUNDS` and the terminal statuses. "Документы" availability keyed by `lib/dealStatus.ts`'s `getDocumentAvailability()`.

### 6.6 WithdrawCrypto (`/withdraw/crypto`)
Asset `Select` (asset layout) → address section → network `Select` (non-BTC only, filtered to the selected address's compatible networks, or the asset's full network list when entering a new address manually) → amount `AmountField` (with transfer-modal glyph) → `SummaryCard` (min/limit/contract-tail/fee/payout) → `WarningPanel`.

Address section is **manual-first, not gated behind saved addresses**: if any are saved, a `Select` (address layout, showing the wallet-labels metadata line) lists them plus a "Новый адрес" option; picking that (or having zero saved addresses at all) reveals a plain `TextField` with a flat QR-icon button that opens `QrScannerModal`. This replaced an earlier saved-addresses-only design — deliberately reversed on request ("address picker is a convenience when it exists, not a mandatory step").

Submit: validate address + amount → `TwoFactorGate` → `submitCryptoWithdrawal({ ticker, network, address, amount, idempotencyKey })`.

### 6.7 WithdrawFiat (`/withdraw/fiat`)
Currency + method `Select`s, amount field, summary (min/limit/entered amount/fee/total debit). No submission here — "Продолжить" navigates to `WithdrawRequisites` carrying `{ ticker, methodId, amount }` via route state.

### 6.8 WithdrawRequisites (`/withdraw/fiat/requisites`)
Reached only via WithdrawFiat's route state (redirects back to `/withdraw/fiat` if missing). Saved-requisite `Select` + "Новые реквизиты" option. New-entry path: `SegmentedControl` for transfer type (Внутренний / Межбанк KG / Межбанк RU) with the field set keyed per type (account always; BIC/INN/bank-name/correspondent-account per type per the table below), "Сохранить реквизиты" checkbox, summary, paired cancel/confirm buttons.

| Transfer type | Fields shown |
|---|---|
| internal | account only |
| kg | account, ИНН, bank name, БИК банка получателя |
| ru | account, БИК получателя, ИНН, bank name, БИК банка получателя, корр. счёт |

Submit: validate account (new entries) → `TwoFactorGate` → `submitFiatWithdrawal`.

### 6.9 Profile (`/profile`)
Identity card: person-icon avatar (flat circular SVG — replaced the initials monogram, per request "a nice icon, not initials") in an accent-gradient circle, client name, type badge (**"Юр. лицо" / "Физ. лицо"** — relabeled from "ЮЛ"/"ФЛ"), verification `StatusChip` (green `success` at level 2, amber `AWAITING_FUNDS` tone at level 1 — consistent in both places it appears, the identity card and the account-rows list; a prior inconsistency between the two was found and fixed). "Повысить до Уровня 2" link when at level 1. Account-rows card: copyable email/user-ID, verification level row. Actions card: open web cabinet, sign out (confirm dialog).

### 6.10 OtcUnavailable (`/otc-unavailable`)
`BlockingState`: 80×80 shield illustration, title/body per reason (`VERIFICATION_REQUIRED` vs `NOT_ELIGIBLE`), action button (open web cabinet / contact support).

## 7. Mock/dev switches (`src/lib/devSwitches.ts`, `?param=` on the hash route)

- `?otc=verification|not_eligible|granted` — forces `user.otcAccess`.
- `?scenario=quote_expiring` — the `RATE_ACTIVE` deal's `quoteExpiresAt` starts at ~10s instead of 5 minutes (applied once at the mock store's module init).
- `?scenario=empty_deals` — deals list loads empty.
- BTC is the natural "no saved addresses" case for exercising WithdrawCrypto's manual-entry path (no network selector shown for BTC either).

## 8. Known gaps / next

- The floating AppHeader pill vs. Telegram's own native back button: worth confirming whether `isRealTelegram` detection is reliable in the actual deployed bot context (see §4) — several layout issues this session traced back to uncertainty here.
- `Badge`'s `count` variant is unused since the deposit-account tab counters were removed; keep or delete next time it comes up.
- Deal history (list/detail/status actions) intentionally stays mock-only per this round's instruction — revisit when that Swagger surface exists.
