# xRuby OTC — screens.md

Reverse-documented from the current implementation (`/Users/vasilihalai/Desktop/OTC`) as of 2026-08-20. This describes what's actually built and live, not a design intent — use it as the baseline for the next round of changes. Supersedes the 2026-08-19 version: that one predates the full-bleed panel-layout fix, the Profile rebuild, and this round's polish pass (all folded in below).

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
  --warning-text     #B54708   profile "Уровень безопасности: Низкий"
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

Font: Inter (self-hosted via `@fontsource/inter`, weights 400/500/600/700), `font-variant-numeric: tabular-nums` on `<body>`. Every text/password field renders its placeholder at the same 16px — a bug where `PasswordField`'s masked-dot font-size (13px) also applied to the *empty* field (so "Введите пароль" rendered visibly smaller than "Введите почту") was found and fixed: the smaller size now only kicks in once there's an actual value to mask, never for the placeholder.

### 2.3 Layout model — full-bleed panels, not inset cards

This is the thing most likely to regress, so it's stated first. A panel on Home, the withdrawal screens, and Profile is **390-ish wide at x=0, no side margin, ever** — the inset lives entirely in the panel's own `padding`. `Panel` (`src/components/Panel/Panel.tsx`) takes `fill` (`page | raised | surface`), `radius` (CSS shorthand — rounded only on the seam-facing edge(s)), and `padding` props; it never takes a margin. Screens that need this stack panels with `gap: 16px` in a flex column and let each panel's own background show through the gap — that 16px gap *is* the seam.

- **Home**: root `display:flex; flex-direction:column; gap:16px; background: var(--bg-raised)`. Three panels: hero (`radius="0 0 24px 24px"`, `padding="20px 16px"`, bg-page), recent-deals (`radius="16px"`, `padding="20px 0 4px"`, bg-page, heading/rows carry their own 16px horizontal inset), deposit-account (`radius="24px"`, `padding="20px 0"`, bg-page, same pattern).
- **Deals**: no panel at all — frame is bg-page, title/filter-chips/rows sit directly on it, rows full-bleed to both screen edges.
- **DealDetail**: no panel either — frame bg-page, header/quote-card/hold-confirmation/`Детали`/`Документы` sit directly on it at a flat 16px inset. `Детали` and `Документы` are **plain heading + rows, not cards** — an earlier version wrapped them in a `--bg-surface` card, which doesn't match; only the quote card and `RequisitesPanel` are genuine cards (`Panel fill="surface" radius="16px"`).
- **Withdrawals** (WithdrawCrypto/WithdrawFiat/WithdrawRequisites): single implicit full-bleed panel — content inset 16px horizontal, 20px top, 16 or 32px bottom depending on screen, no radius (it's the only content on the screen, so the frame color is never actually visible).
- **Profile**: two full-bleed panels (`padding: 16px 16px 24px` / `16px`), bg-raised frame, 16px seam, panel2's `Тема`↔`FAQ` divider is inset 24px (8 more than the row content) — that's drawn intentionally, not a bug.

**Row components reach both edges themselves.** `DealRow` (128px, used on Home and Deals) and `TableRow` (64px asset row, used on Home's deposit-account list) are full-bleed with their own internal padding — never wrapped in a padded container that would double the inset. `TableRow` is a 3-cell flex row: info-cell (`padding-left:16px`, holds `CurrencyIcon` + ticker/name), amount-cell, action-cell (68px wide, `padding-right:16px`, holds a 36px round `--bg-raised` circle) — so the currency icon and the withdraw button both sit exactly 16px from the screen edge, symmetric. `DealRow` carries **no per-status background highlight** — a `RATE_ACTIVE` full-bleed highlight was tried, then explicitly reverted: it read as "the first item in the list is highlighted" rather than status-driven, which was confusing rather than informative.

## 3. Component library (`src/components/*`)

- **Panel** — the full-bleed primitive, see §2.3. `fill="page"` (default) / `"raised"` / `"surface"`; `radius`/`padding` as CSS shorthand strings, e.g. `radius="0 0 24px 24px"`.
- **Button** — variants `primary | accent | secondary | link | footer-link`, plus a `danger` boolean modifier (used with `link`) and a `size: 'regular' | 'compact'` (compact = 36px/radius 18/`button-sm` label, used only by Profile's certificate button). Height 44 regular, radius 30. Primary: white fill enabled, `--bg-raised` fill disabled, label stays `--text-on-light` in *both* states. Accent: `--accent` fill. `.button-row` = two buttons side by side, `flex:1` each, 16 gap, secondary/cancel left.
- **TextField / PasswordField** — label row always carries a red required asterisk. Box: height 44, radius 12, fill `--bg-page`, border `--border` → `--border-strong` on focus, `--accent` on error, **12px horizontal input padding** (reduced from 16px — the text sat too far from the field edge). `PasswordField`'s masked-dot shrink (13px) only applies once there's a typed value — see §2.2.
- **AmountField** — label/available row, then a box (12px horizontal padding, matching TextField) with an optional embedded asset `Select`, the numeric input, and a "Макс" button. The old `transferVariant` (76px tall box, 28px input) was removed — the transfer modal's amount field now uses the same 44px sizing as every other field, per an explicit "make it match the standard fields" request.
- **Select** — `layout: 'asset' | 'method' | 'address' | 'plain'`. Closed box (min-height **44px**, was 48 — brought in line with the Field spec) + click-open dropdown (rows min-height **36px**, was 48). Dropdown open/close now animates (`scaleY` + fade, 0.15s), the chevron rotates with a transition, and the box border-color transitions — previously all instant. `address` layout is two lines: truncated address, then an optional `Метки: …` metadata line built from `labels: string[]` on the option (max 2 shown + `+N`). `readOnly` (no chevron, unclickable) when there's ≤1 option.
- **PickerModal** (new) — generic single-select list inside a `Modal`: rows with a label and a checkmark on the current value, tap to select-and-close. Used by Profile's Язык/Тема rows (see §6.9); intentionally generic so any future "pick one of N" surface can reuse it instead of hand-rolling another dropdown.
- **Badge** — `success | neutral | count`. success/neutral: radius 20, `success` = green fill/text pair, `neutral` = `--bg-raised`. `count`: 34×24 box, radius 12, `--bg-surface` + border, white text — used by… nothing currently (deposit-account tab counters were removed per explicit request; component kept for future reuse).
- **Checkbox** — 20×20, radius 4, `--bg-page`/`--border-strong` unchecked, `--accent` fill + inline checkmark checked.
- **SegmentedControl** — plain-text tabs (no shared track pill), gap 8, item height 36 padding 0 14px. Active tab gets its own `--bg-raised` pill background + `--text-strong`; inactive is `--text-quiet` on nothing. Optional `count` badge per option (currently unused — see Home).
- **SettingRow** (new) — Profile's settings-panel row: 24px icon, label, optional right-aligned value + chevron, `danger` modifier (used by `Выход`). Tappable as a whole row (`onClick`), with a subtle active-state opacity/scale transition.
- **FeeBadge** — 38×20, `--bg-surface` fill, border.
- **StatCard** — 171×84-ish, radius 16, **`--bg-surface`** fill (was incorrectly `--bg-raised`, which made it invisible against a `--bg-surface` parent in one layout and is wrong regardless — the token table says stat cards are `--bg-surface`).
- **SummaryCard** — kv rows, 16 gap, bold "total" row, optional two-line value via `tail`. The crypto-withdrawal instance no longer carries the "На вывод комиссии сети" caption under it — removed per explicit request, the fee line item above the total already says this.
- **Callout** — plain text block, no icon/title, 3 fills: `neutral` (`--bg-surface`, centered) / `warning` (`--panel-warning`) / `danger` (`--panel-error`).
- **WarningPanel** — icon (triangle) + title + body, single `--panel-warning` fill, radius 12. Distinct from Callout — used for the crypto-withdrawal "Внимание!" notice.
- **Modal** — scrim centers the card both horizontally and vertically. Card 400px wide (`max-width: calc(100% - 32px)`), radius 16, `--bg-page`, fade+scale-in animation. Structure: `top` (title + 28×28 round close button — shrunk from 48×48, was oversized relative to the title) → `body` (24px horizontal padding) → optional `bottom` (footer actions).
- **TabBar** — `position: absolute; bottom: 0` inside `.app-shell`, 88px + safe-area, radius 16 top corners, 1px top border. It never scrolls: `html`/`body` are `position: fixed; inset: 0; overflow: hidden; overscroll-behavior: none` (`src/index.css`) specifically so a touch-drag starting outside `.app-content`'s own scroll area — e.g. directly on the tab bar — can't rubber-band the document itself. That mattered because the tab bar is only pinned relative to `.app-shell`, not the viewport; if the document could scroll/bounce, the "fixed" tab bar visibly dragged along with it. `.app-content` keeps its own `overscroll-behavior: contain` on top of this so its internal scroll never chains to a parent that no longer has anywhere to go.
- **CodeInput** — 6 cells, `--bg-raised` fill, radius 8, digit `clamp(18px, 6vw, 24px)`. **Responsive now**: cells are `flex:1` with `max-width:44px` and `aspect-ratio:1`, gap `min(8px, 2vw)` — on a 400px-wide modal card they render at the original 44×44, but on a narrow phone (~340px viewport, ~280px available body width) they shrink to fit instead of overflowing the modal. The overflow was the "кривая модалка" bug reported against the 2FA/email-code modals: six fixed 44px cells plus gaps needed ~304px, more than the modal body had on a narrow screen.
- **TableRow** — see §2.3.
- **CurrencyIcon** — flat placeholder icon per ticker (real assets can swap in later). BTC/USDT/USDC/RUB: colored circle + currency symbol. KGS/USD: real inline-SVG flag icons.
- **StatusChip** — tone is the literal `DealStatus` union value (`.status-chip--RATE_ACTIVE` etc.) plus a `success` tone; sizes `sm` (18/radius 9, list rows) and `lg` (24/radius 12, deal-detail header).
- **StatusHero** — icon (50px) + title + subtitle + action, padding-top 16/bottom 16, gradient per status (see §2.1). `StatusHeroTone` = `success | danger | running | stale | pending`.
- **DealRow** — see §2.3.
- **EmptyState** — centered tray-illustration SVG (70×60) + caption, used by Home's empty recent-deals and Deals' empty-filter state.
- **DocumentRow**, **RequisitesPanel**, **BalanceBlock**, **KeyValueRow**, **FilterChips**, **CompanyChip**, **HelpTip**, **Skeleton**, **Toast**, **ConfirmDialog** — unchanged in shape, retokenized onto the current palette. `RequisitesPanel` now wraps itself in `Panel fill="surface" radius="16px"` with its own inline `<h2>` heading instead of the old `Panel heading=` prop (that prop was removed — `Panel` is a pure layout primitive now, see §2.3).
- **BlockingState** (OtcUnavailable's shell) — logo + centered 80×80 shield illustration + title/body/action/caption.
- **AuthenticatorModal** — 6-digit `CodeInput`, no "sync issues" helper link. Reuses the same mock `verifyCode` as email verification (any 6 digits except `000000`).
- **TwoFactorGate** — the shared second-factor entry point. Renders `AuthenticatorModal` when `authenticatorEnabled` is true, `VerificationModal` (email code) otherwise. Used identically by sign-in, crypto withdrawal, and fiat withdrawal — see §5.
- **QrScannerModal** — full-screen camera overlay (`getUserMedia` + `jsQR`), used to scan a wallet address into the crypto-withdrawal manual-address field. Parses `bitcoin:`/`ethereum:`/`tron:`-style URI payloads down to the bare address. Permission-denied state shows a retry button.
- **TransferModal** — global modal (`store/transferModal.ts`), opened from any withdrawal screen's amount-field transfer glyph. From/To account `Select`s (plain layout, `--bg-raised` fill, min-height 40px) with a 44px swap button between them (was 52px); amount field uses the standard `AmountField` sizing with an embedded asset `Select`. Tightened this round (gaps, select/button sizes) specifically so the whole thing fits without feeling cramped or needing to scroll on a normal phone.

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

**The personal/business switch links navigate with `{ replace: true }`, not a push.** They previously pushed a new history entry each time, so toggling personal → business → personal a few times left a long chain of login-variant entries in the browser/Telegram back-stack — pressing back would step through login variants instead of leaving the auth flow. Any "switch between sibling views of the same screen" link (as opposed to "go deeper") should follow this pattern: `replace`, not `push`.

AppHeader only renders when `isRealTelegram` is false (or `VITE_FORCE_INAPP_HEADER=true`) — inside a real, correctly-detected Telegram launch, Telegram's own native BackButton is used instead. The clearance `.app-content` reserves for it is measured live off the pill's rendered height (`AppHeader.tsx`'s `useHeaderClearance`, via `ResizeObserver`) plus a small fixed gap — tightened this round from a 28px gap/100px fallback down to a **2px gap / 48px fallback**, so the screen title sits almost immediately under the pill instead of leaving a visibly large empty band at the top.

**Every screen's own top padding is now a uniform 8px**, on top of that shared header clearance. It had drifted apart per-screen (Deals 4px, DealDetail 0px, Home/Profile/Withdrawals 16–20px, auth screens 24px) as each was built independently, which read as an inconsistent gap under the header when moving between them — measured now, every screen sits exactly 10px below the pill's bottom edge (2px clearance gap + 8px screen padding), no exceptions. Keep new screens on this same 8px top value rather than picking a fresh one.

## 5. Auth & second factor

- Sign-in (`SignIn.tsx`): email + password → `sendVerificationCode` (validates email format) → `getUser(clientType)` to read `authenticatorEnabled` → opens `TwoFactorGate`.
- **General rule** (`User.authenticatorEnabled: boolean`): if true, Google Authenticator gates the action; if false, the email code (`VerificationModal`) does — never both, and this applies uniformly at sign-in, crypto-withdrawal confirmation, and fiat-withdrawal confirmation. Mock fixtures: the business account (`UL`) has it enabled, the personal account (`FL`) doesn't, so both branches are exercisable without a dev switch.
- Crypto withdrawal (`WithdrawCrypto.tsx`) and fiat withdrawal (`WithdrawRequisites.tsx`) both fetch the session user's `authenticatorEnabled` on mount and gate their "Подтвердить" button the same way: validate fields → open `TwoFactorGate` → only submit the already-validated payload after it resolves.
- Social sign-in (Google/Apple) skips 2FA entirely (`signInSocial`, unchanged).
- Both the email-code modal and the Authenticator modal share `CodeInput`, which is now responsive (§3) — this was the fix for the "кривая модалка" report against 2FA.

## 6. Screens

### 6.1 SignIn (`/login`, `/login/personal`)
Logo, title ("Вход в бизнес-аккаунт" / "Вход в личный аккаунт"), email, password (eye toggle), "Забыли пароль?" link, submit button, Google/Apple social buttons, footer switch-account link ("Войти в бизнес-аккаунт" / "Войти в личный аккаунт", `replace`-navigated per §4). 2FA per §5. Content inset 20px (all auth screens; every other screen is 16px, see §2.3).

### 6.2 PasswordRecovery (`/forgot`) / NewPassword (`/reset-password`)
Unchanged shape: email → `sendVerificationCode` → code modal → new-password form with strength hint.

### 6.3 Home (`/home`)
Full-bleed panel model, see §2.3:
1. Hero: "OTC" title/subtitle, desk-hours caption, `CompanyChip` (client name), two `StatCard`s (active deals count, 30-day volume).
2. "Недавние заявки": up to 2 `DealRow`s (no per-status highlight, see §2.3), or `EmptyState` if none.
3. "Депозитный аккаунт": `SegmentedControl` (Криптовалюта/Фиат, no count badges — removed per an earlier request), then `TableRow` per positive-balance asset, "Активы с нулевым балансом скрыты" caption when any are hidden.

### 6.4 Deals (`/deals`)
No panel — title and `FilterChips` (Все/Активные/Исполненные/Отклонённые, 36px pills, horizontal-scroll, last chip deliberately clipped) sit directly on the bg-page frame at 16px inset, then a flat list of full-bleed `DealRow`s (loading skeletons, error+retry, or `EmptyState` — no deals at all, or none matching the filter, with a "Показать все" reset link).

### 6.5 DealDetail (`/deals/:id`)
No panel — header (id + `StatusChip` lg + direction) sits directly on bg-page at 16px inset. Three-way body split on status:
- **`RATE_ACTIVE` → QuoteCard** (own `--bg-surface` card): rate (amount-xl + unit), a live countdown (`m:ss сек`, client-`setInterval`, re-synced on `visibilitychange`/focus, never trusts elapsed device time), accept (`confirmDeal` → `RUNNING`) / decline. Flips to `RATE_STALE` at zero via the mock's `expireQuote(id)`. No balance math here.
- **`AWAITING_FUNDS` → ConfirmationBody (hold confirmation)**: `BalanceBlock` → `Callout` (4 balance-vs-deal-amount cases: sufficient/short1/short/below-min — `short1`/`short` are `warning`, `belowmin` is `danger`) → confirm/decline → `RequisitesPanel` (own `--bg-surface` card).
- Everything else → **StatusHeroBody**: `RATE_PENDING` (pending tone), `RATE_STALE`, `RUNNING`, `DONE`, `DECLINED` — icon/title/subtitle/action per status.

`Детали` and `Документы` are plain heading + rows directly on the page background — **not** cards (see §2.3). "Детали" hides direction/dates/amounts for `RATE_PENDING`/`RATE_ACTIVE`/`RATE_STALE` (only shows Курс, as "Уточняется" for the first and last); shows all 5 rows for `AWAITING_FUNDS` and the terminal statuses. "Документы" availability keyed by `lib/dealStatus.ts`'s `getDocumentAvailability()`.

### 6.6 WithdrawCrypto (`/withdraw/crypto`)
Asset `Select` (asset layout) → address section → network `Select` (non-BTC only, filtered to the selected address's compatible networks, or the asset's full network list when entering a new address manually) → amount `AmountField` (with transfer-modal glyph) → `SummaryCard` (min/limit/contract-tail/fee/payout — no "на вывод комиссии сети" caption, see §3) → `WarningPanel`.

Address section is manual-first, not gated behind saved addresses: if any are saved, a `Select` (address layout, showing the wallet-labels metadata line) lists them plus a "Новый адрес" option; picking that (or having zero saved addresses at all) reveals a plain `TextField` with a flat QR-icon button that opens `QrScannerModal`.

Submit: validate address + amount → `TwoFactorGate` → `submitCryptoWithdrawal({ ticker, network, address, amount, idempotencyKey })`.

### 6.7 WithdrawFiat (`/withdraw/fiat`)
Currency + method `Select`s, amount field, summary (min/limit/entered amount/fee/total debit). No submission here — "Продолжить" navigates to `WithdrawRequisites` carrying `{ ticker, methodId, amount }` via route state.

### 6.8 WithdrawRequisites (`/withdraw/fiat/requisites`)
Reached only via WithdrawFiat's route state (redirects back to `/withdraw/fiat` if missing). Saved-requisite `Select` + "Новые реквизиты" option. New-entry path: `SegmentedControl` for transfer type (Внутренний / Межбанк KG / Межбанк RU) with the field set keyed per type, "Сохранить реквизиты" checkbox, summary, paired cancel/confirm buttons.

| Transfer type | Fields shown |
|---|---|
| internal | account only |
| kg | account, ИНН, bank name, БИК банка получателя |
| ru | account, БИК получателя, ИНН, bank name, БИК банка получателя, корр. счёт |

Submit: validate account (new entries) → `TwoFactorGate` → `submitFiatWithdrawal`.

### 6.9 Profile (`/profile`)
Two full-bleed panels, bg-raised frame, 16px seam (see §2.3). `User` now carries `verified: boolean`, `securityLevel: 'LOW'|'MEDIUM'|'HIGH'`, `phone`, `faqUrl`, `aboutUrl` — the old `verificationLevel: 1|2` model was dropped entirely, it's a different concept (verification vs. account-security posture) and the new model matches the SVG mockup this was rebuilt against.

**Panel 1 — account.** Title row: client name + a "Верифицирован" badge (green check, hidden entirely when `!user.verified` — no badge, not a grey one). Details card (`--bg-surface`, 4 stacked label/value rows): Почта (masked, copy icon copies the *unmasked* address), ID пользователя (32 chars grouped by 4, copy icon strips spaces), Уровень безопасности (`Низкий` in `--warning-text` / `Средний` in `--text-body` / `Высокий` in `--badge-success-text`), Телефон. Then a "Часы деска" heading + static hours line, then the compact certificate button (`Справка об открытии аккаунта` — loading spinner while `getAccountCertificate()` resolves, opens the result via `openExternalLink`, ignores repeat taps, shows a failure toast on error).

**Panel 2 — settings.** `Язык` and `Тема` rows now open a `PickerModal` (see §3) instead of showing a static value: Язык offers Русский/English/Кыргызча, Тема offers Тёмная/Светлая, backed by `store/settings.ts` (in-memory zustand, not persisted). Selecting an option updates the row's displayed value immediately. This is still cosmetic — the app stays Russian/dark regardless of what's picked, per the original design intent ("wire it to a store now so a real switch later is a data change, not a screen change") — but it's now a real interactive picker instead of an inert label, per an explicit request. Divider, then FAQ / О нас (external links via `user.faqUrl`/`user.aboutUrl`), then `Выход` pinned to the bottom (confirm dialog → clears session → `/login`).

### 6.10 OtcUnavailable (`/otc-unavailable`)
`BlockingState`: 80×80 shield illustration, title/body per reason (`VERIFICATION_REQUIRED` vs `NOT_ELIGIBLE`), action button (open web cabinet / contact support).

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
