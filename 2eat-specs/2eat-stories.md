# what2eat — 用户故事

**what2eat**（`what2eat.food`）产品 backlog 与验收标准（AC）。

| Related | Location |
| --- | --- |
| 产品规格 | [`2eat-prod-specs.md`](./2eat-prod-specs.md) |
| 设计规范 | [`2eat-design.md`](./2eat-design.md) |
| 页面契约（设计 §3） | [`2eat-design.md`](./2eat-design.md) |
| 测试计划 | [`2eat-test-plan.md`](./2eat-test-plan.md) |
| 技术设计 | [`2eat-design.md`](./2eat-design.md) |
| UI mock-up | [`ui-mockup/`](./ui-mockup/) |
| 家族架构 | [`../../workspace-specs/2.architecture.md`](../../workspace-specs/2.architecture.md) |
| places-agent backlog | [`../../1.places-agent/agent-specs/agent-stories.md`](../../1.places-agent/agent-specs/agent-stories.md) |

**状态：** draft — 与 [`ui-mockup/`](./ui-mockup/) 当前 mock-up 对齐。

## 人物角色

| 角色 | 谁 | 价值 |
| --- | --- | --- |
| 犹豫不决的食客 | 已登录用户 | 无需查菜单即可获得短而诚实的餐厅名单 |
| 新访客 | 公开首页访客 | 了解产品并创建账号 |
| 回访用户 | 已登录用户 with saved profile | 用已存口味重跑 Decide 并回访收藏 |

## 术语

| 术语 | 含义 | 不是 |
| --- | --- | --- |
| **场所事实** | Name, address, rating, phone, hours, etc. from map vendors via places-agent | Preference-match copy or chat suggestions |
| **偏好匹配** | BFF labels (strong / partial / weak fit) and “why it fits” reasons from profile + Decide context | A separate ranking product or Quanzil score |
| **短名单** | Paginated picks from the latest search for the current criteria | The full vendor result set |
| **列表 chat** | Agent chat about the current Decide list and filters | Place-scoped chat inside details |
| **详情 chat** | Agent chat about one restaurant inside the details dialog | The only way to search |
| **Chat 历史** | User and agent messages kept in browser-local storage on this device | Account data in the database; server-side transcript store |

## MVP 计划

四个切片。每个 MVP 是**可独立交付的完整功能集** with its own E2E sign-off. **MVP DoD 禁止 fixture、mock 或假餐厅数据** — use a real what2eat stack, real user DB, and (from MVP-2 onward) **places-agent in live vendor mode**. Details: [`2eat-test-plan.md`](./2eat-test-plan.md) §1.2, [`2eat-design.md`](./2eat-design.md) §12.

| 切片 | 成果 | Features | E2E 旅程（摘要） | 状态 |
| --- | --- | --- | --- | --- |
| **MVP-1** | Onboarding product: shell, home, account, profile | **1–13** | Visitor registers → saves profile → signs out/in → profile persists; locale EN→HK | **Complete** |
| **MVP-2** | Decide with real places: search, cards, details, save | **14–19, 21–22, 24–26** | 已登录用户 runs Decide on a real pin → real vendor cards → details + why → save → Saved → unsave | **Complete** |
| **MVP-3** | Agent chat + history (chat history browser-local only) | **20, 23, 27** | 列表 chat + place chat with real agent replies → transcripts survive refresh → cleared on logout → History | **Complete**（2026-08-20 签收） |
| **MVP-4** | Polish Decide + chat UX（**产品收尾切片**） | **28–35** (+ **decide-03** behavior update) | Sort; reshuffle 重查; list chat resize/rich/pending; place chat scroll; price on cards; criteria draft across locale; persist chat panel size | **Complete**（pending user confirm） |

**构建顺序：** MVP-1 → MVP-2 → MVP-3 → MVP-4（each slice to DoD before the next）。one user story to DoD at a time within each slice. **MVP-4 为 what2eat 当前计划内最后一切片**（Dismiss / cool-off 仍明确不在范围）。

**MVP-1 说明：** No places-agent dependency. Auth and profile use the real app DB and real session cookies. Email flows use Resend sandbox or dev outbox — not a fake “success” banner without a server path.

**MVP-2 说明：** BFF calls places-agent HTTP only ([ADR-020](../../workspace-specs/adr/ADR-020-http-only-chat-and-enrich.md)). DoD requires live probe: restaurant names/ids from vendors, **no `fixture_` native ids** ([ADR-021](../../workspace-specs/adr/ADR-021-live-vendor-no-fixture.md)). Chat deferred to MVP-3.

**MVP-3 说明：** Chat uses `POST /v1/chat` via BFF (HTTP-only). Transcripts in browser-local storage only — verified in E2E and contract tests (no DB rows). **DoD 已通过**（`make test-e2e-mvp3-live`，2026-08-20 Clerkenwell；lessons: [`what2eat-mvp3-lessons.md`](../../workspace-specs/knowledge/web-app-development/what2eat-mvp3-lessons.md)）。

**MVP-4 说明：** Sort + reshuffle 重查 vendor；chat UX（NW napkin grip resize、rich blocks、pending、place 内滚动）；卡片/详情价格；Decide 条件草稿跨 locale（[ADR-029](../../workspace-specs/adr/ADR-029-decide-criteria-draft-hydrate.md)）；list chat 尺寸持久化。部分代码可能已合入主干，**故事状态以本表 To-do / DoD 为准**，未签收前不算 Complete。

---

# 第一部分 — 产品 backlog

Feature 按 **MVP** 排序 以便MVP-1 items stay grouped.

**状态列：** `Done` 表示该 feature 已通过 story DoD（含 live 探针与用户确认）。未交付默认为 `To-do`。MVP-1–3 签收后对应 features 标 **Done**；MVP-4 在 DoD 通过前保持 **To-do**。此处不用 `In progress` 或 `live-honest` — live 姿态见 [`2eat-test-plan.md`](./2eat-test-plan.md) 诚实性矩阵。

| 编号 | 模块 | Feature code | 功能名 | 功能描述 | Story | MVP | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Header | `header-01` | App header & navigation | Sticky header on signed-in pages: logo, Decide / Profile / Saved, active section, mobile menu | [§1 header-01](#1-header-header-01--app-header--navigation) | **MVP-1** | Done |
| 2 | Header | `header-02` | 已登录用户 chrome | Greeting with display name, avatar initial, Log out | [§2 header-02](#2-header-header-02--signed-in-user-chrome) | **MVP-1** | Done |
| 3 | Header | `header-03` | Locale switcher (app) | EN / CN / HK / TW switcher in the app header | [§3 header-03](#3-header-header-03--locale-switcher-app) | **MVP-1** | Done |
| 4 | Footer | `footer-01` | Family footer (app) | places.family row on signed-in pages, styled like the app header | [§4 footer-01](#4-footer-footer-01--family-footer-app) | **MVP-1** | Done |
| 5 | Footer | `footer-02` | Family footer (public) | places.family row on public pages, seamless with the page cloth | [§5 footer-02](#5-footer-footer-02--family-footer-public) | **MVP-1** | Done |
| 6 | i18n | `i18n-01` | Four-locale catalogs | All user-visible strings via i18n keys; EN / CN / HK / TW | [§6 i18n-01](#6-i18n-i18n-01--four-locale-catalogs) | **MVP-1** | Done |
| 7 | Home | `home-01` | Public landing | Question-led home, mini preview cards, register and sign-in CTAs | [§7 home-01](#7-home-home-01--public-landing) | **MVP-1** | Done |
| 8 | Account | `account-01` | Register | Create account with personal fields, default location, password, optional photo | [§8 account-01](#8-account-account-01--register) | **MVP-1** | Done |
| 9 | Account | `account-02` | Sign in | Email and password sign-in; failed sign-in message | [§9 account-02](#9-account-account-02--sign-in) | **MVP-1** | Done |
| 10 | Account | `account-03` | Reset password | Request password reset email | [§10 account-03](#10-account-account-03--reset-password) | **MVP-1** | Done |
| 11 | Account | `account-04` | Set password | Set new password from invite or reset link; expired link state | [§11 account-04](#11-account-account-04--set-password) | **MVP-1** | Done |
| 12 | Profile | `profile-01` | Personal information | Edit name, email, gender, age, default location, optional photo; separate save | [§12 profile-01](#12-profile-profile-01--personal-information) | **MVP-1** | Done |
| 13 | Profile | `profile-02` | Tastes & constraints | Cuisine likes/dislikes, spice, party size, hard constraints, meal contexts; separate save | [§13 profile-02](#13-profile-profile-02--tastes--constraints) | **MVP-1** | Done |
| 14 | Decide | `decide-01` | Search criteria | Area or pin, meal context, budget per person, optional craving; Find restaurants | [§14 decide-01](#14-decide-decide-01--search-criteria) | **MVP-2** | Done |
| 15 | Decide | `decide-02` | Results header & summary | Results title with last-updated time; showing X–Y of Z summary | [§15 decide-02](#15-decide-decide-02--results-header--summary) | **MVP-2** | Done |
| 16 | Decide | `decide-03` | Reshuffle | Same filters; show next picks from the current short list | [§16 decide-03](#16-decide-decide-03--reshuffle) | **MVP-2** | Done |
| 17 | Decide | `decide-04` | Results pagination | Numbered pages with Previous / Next over the short list | [§17 decide-04](#17-decide-decide-04--results-pagination) | **MVP-2** | Done |
| 18 | Decide | `decide-05` | Pick cards | Photo, facts, source ids, fit badge, walk time / warnings; Details and Open map | [§18 decide-05](#18-decide-decide-05--pick-cards) | **MVP-2** | Done |
| 19 | Decide | `decide-06` | Empty & partial results | Empty state with widen-filters action; partial vendor banner | [§19 decide-06](#19-decide-decide-06--empty--partial-results) | **MVP-2** | Done |
| 20 | Decide | `decide-07` | List-level agent chat | Floating chat panel scoped to current list and filters; transcript in browser-local storage only | [§20 decide-07](#20-decide-decide-07--list-level-agent-chat) | **MVP-3** | Done |
| 21 | Place | `place-01` | Place details — facts | Dialog with image + restaurant facts and honest missing states | [§21 place-01](#21-place-place-01--place-details--facts) | **MVP-2** | Done |
| 22 | Place | `place-02` | Place details — why | Why it fits, also nearby alternatives, menu/allergen disclaimer | [§22 place-02](#22-place-place-02--place-details--why) | **MVP-2** | Done |
| 23 | Place | `place-03` | Place-level agent chat | Chat inside details dialog about this restaurant; transcript per place in browser-local storage only | [§23 place-03](#23-place-place-03--place-level-agent-chat) | **MVP-3** | Done |
| 24 | Place | `place-04` | Open map & save | Secret-free map link; Save / Unsave from details | [§24 place-04](#24-place-place-04--open-map--save) | **MVP-2** | Done |
| 25 | Saved | `saved-01` | Saved places list | Saved pick cards; Details; empty state | [§25 saved-01](#25-saved-saved-01--saved-places-list) | **MVP-2** | Done |
| 26 | Saved | `saved-02` | Unsave | Remove a place from saved list or details | [§26 saved-02](#26-saved-saved-02--unsave) | **MVP-2** | Done |
| 27 | History | `history-01` | Decision history | Recent places you went to, meal context, re-run Decide; empty state | [§27 history-01](#27-history-history-01--decision-history) | **MVP-3** | Done |
| 28 | Decide | `decide-08` | Results sort | Re-order the short list by rank, rating, distance, or price level | [§28 decide-08](#28-decide-decide-08--results-sort) | **MVP-4** | Done |
| 29 | Chat | `chat-02` | Resizable chat panel | List chat panel: sticky composer, no dead space; drag resize with current size as minimum | [§29 chat-02](#29-chat-chat-02--resizable-chat-panel) | **MVP-4** | Done |
| 30 | Chat | `chat-03` | Rich agent replies | Structured assistant messages with pick cards, photos, and external map links (new tab) | [§30 chat-03](#30-chat-chat-03--rich-agent-replies) | **MVP-4** | Done |
| 31 | Chat | `chat-04` | Pending + place chat scroll | Waiting indicator while agent replies; place chat transcript scrolls inside a fixed chat box | [§31 chat-04](#31-chat-chat-04--pending--place-chat-scroll) | **MVP-4** | Done |
| 32 | Decide | `decide-09` | Show price on cards | Display agent `price_level` (and optional `price_per_person`) on pick cards and place details — honest missing when absent | [§32 decide-09](#32-decide-decide-09--show-price-on-cards) | **MVP-4** | Done |
| 33 | Decide | `decide-10` | Keep location draft | Area/pin input keeps the latest typed value across locale switches; profile default fills only once when virgin | [§33 decide-10](#33-decide-decide-10--keep-location-draft) | **MVP-4** | Done |
| 34 | Decide | `decide-11` | Keep other criteria drafts | Meal context, budget, craving keep latest input across locale switches (same draft rules as location) | [§34 decide-11](#34-decide-decide-11--keep-other-criteria-drafts) | **MVP-4** | Done |
| 35 | Chat | `chat-05` | Persist chat panel size | Remember list chat width/height in localStorage across refresh (min still default floor) | [§35 chat-05](#35-chat-chat-05--persist-chat-panel-size) | **MVP-4** | Done |

Backlog 为 **features 1–35**（MVP-4 = **28–35** + decide-03 行为更新）。Dismiss / cool-off **永久不在范围**。

---

# 第二部分 — Story mapping

## 1. Header · `header-01` — App header & navigation

**用户故事 1 — Navigate between main sections**

作为已登录用户, 我希望navigation between Decide, Profile, and Saved 以便I can move through the app without losing context.

- **AC1:** 给定 I am signed in, 当 I open any app page, 则 Decide, Profile, and Saved are available in the header navigation.
- **AC2:** 给定 I am on Decide, 当 the page loads, 则 Decide is indicated as the current section.
- **AC3:** 给定 I am on a narrow viewport, 当 I open the mobile menu, 则 the same navigation destinations are reachable.

---

## 2. Header · `header-02` — 已登录用户 chrome

**用户故事 1 — See who is signed in**

作为已登录用户, 我希望to see my name and avatar in the header 以便I know which account is active.

- **AC1:** 给定 I am signed in as Mei Chen, 当 I view an app page, 则 the greeting shows my display name.
- **AC2:** 给定 I uploaded a profile photo, 当 I view an app page, 则 the header avatar shows a circular photo thumbnail (not only initials).
- **AC3:** 给定 I am signed in, 当 I choose Log out, 则 my session ends and I return to the public home.

---

## 3. Header · `header-03` — Locale switcher (app)

**用户故事 1 — Switch locale on app pages**

作为user, 我希望to switch language from the app header 以便labels match my preferred locale.

- **AC1:** 给定 I am on an app page, 当 I select HK, 则 user-visible strings render in Hong Kong Traditional Chinese where catalog entries exist.
- **AC2:** 给定 a string has no translation in the selected locale, 当 the page renders, 则 the app falls back without breaking the page.

---

## 4. Footer · `footer-01` — Family footer (app)

**用户故事 1 — Family links on signed-in pages**

作为已登录用户, 我希望the places.family footer on Decide, Profile, Saved, and History 以便I can reach sibling products without leaving the app chrome.

- **AC1:** 给定 I am on Decide, Profile, Saved, or History, 当 the page loads, 则 the footer shows one row: `places.family:` · where2play.place (underlined, new tab) · what2eat.food (current, not a link, no underline) · places.agent-mate.ai (underlined, new tab) · copyright.
- **AC2:** 给定 the page has an app header, 当 the footer renders, 则 its bar fill and top border match the app header; product marks have transparent logos and no chip/highlight backgrounds.
- **AC3:** 给定 I switch EN → CN → HK → TW, 当 I view the footer, 则 Latin footer type stays the same size (Figtree/Fredoka at 12px — not CJK UI metrics).

---

## 5. Footer · `footer-02` — Family footer (public)

**用户故事 1 — Discover sibling products on public pages**

作为visitor on home or auth pages, 我希望places.family links that sit on the same picnic cloth as the page 以便the footer does not look like a separate bar.

- **AC1:** 给定 I am on home, register, sign-in, reset, set-password, or the mock gallery, 当 the page loads, 则 the footer matches the same row contract as footer-01 (label with colon, logos, current mark, sibling new-tab links, copyright).
- **AC2:** 给定 the page has no app header, 当 the footer renders, 则 it uses the page background with no top border, no distinct footer fill, and no chip/highlight backgrounds behind logos or labels.
- **AC3:** 给定 I switch locale on a public page, 当 the footer renders, 则 mark size stays consistent with EN (same as footer-01 AC3).

---

## 6. i18n · `i18n-01` — Four-locale catalogs

**用户故事 1 — Localized product copy**

作为user, 我希望the product in EN, CN, HK, or TW 以便the experience matches my language preference.

- **AC1:** 给定 the locale is TW, 当 I view register, Decide, or place details, 则 visible labels resolve through the locale catalog (not raw key names).
- **AC2:** 给定 HK and TW are both Traditional Chinese, 当 I switch between them, 则 wording differs where the catalogs differ (not a single shared Traditional file).
- **AC3:** 给定 protocol ids such as AMAP or GOOGLE_MAPS appear, 当 the locale changes, 则 those ids stay untranslated.

**用户故事 2 — Locale on public pages**

作为visitor, 我希望a locale switcher on public pages 以便I can read home and auth flows in my language.

- **AC1:** 给定 I am on the public home or an auth page, 当 I change locale, 则 the page copy updates without signing in.

---

## 7. Home · `home-01` — Public landing

**用户故事 1 — Understand the product**

作为visitor, 我希望a clear landing page 以便I know what what2eat does before creating an account.

- **AC1:** 给定 I open the public home, 当 the page loads, 则 I see a headline, supporting lead copy, and preview cards illustrating restaurant picks.
- **AC2:** 给定 I am not signed in, 当 I choose Find places, 则 I am taken to register.
- **AC3:** 给定 I already have an account, 当 I choose Sign in, 则 I am taken to the sign-in flow.

---

## 8. Account · `account-01` — Register

**用户故事 1 — Create an account**

作为new user, 我希望to register with my basics and default location 以便Decide can start near where I usually eat.

- **AC1:** 给定 I complete required fields (name, email, gender, default location, password, confirm password), 当 I submit registration, 则 an account is created and I can continue to profile setup. Age is optional.
- **AC2:** 给定 I leave a required field empty, 当 I submit, 则 registration does not complete and I see which field needs attention.
- **AC3:** 给定 I optionally add a profile photo, 当 registration succeeds, 则 the photo is stored with my account and the signed-in header shows a circular photo thumbnail 当 available.

**用户故事 2 — Default location at signup**

作为new user, 我希望help setting default location 以便I do not have to type it every time.

- **AC1:** 给定 location detection succeeds, 当 the register form loads, 则 default location is prefilled and marked as detected.
- **AC2:** 给定 location detection fails, 当 the form loads, 则 I can enter location manually and see that detection failed.

---

## 9. Account · `account-02` — Sign in

**用户故事 1 — Sign in with email and password**

作为returning user, 我希望to sign in 以便I can reach Decide with my saved profile.

- **AC1:** 给定 valid credentials, 当 I sign in, 则 I reach Decide with an authenticated session.
- **AC2:** 给定 invalid credentials, 当 I sign in, 则 I remain on sign-in and see that email or password is wrong.
- **AC3:** 给定 I forgot my password, 当 I follow the reset link from sign-in, 则 I reach the reset-password flow.

---

## 10. Account · `account-03` — Reset password

**用户故事 1 — Request a reset email**

作为user who forgot my password, 我希望to request a reset email 以便I can regain access.

- **AC1:** 给定 an account exists for the email I enter, 当 I submit reset password, 则 the app confirms that instructions were sent (without revealing whether the email exists, if that is the security policy).
- **AC2:** 给定 I submit without an email, 当 I try to continue, 则 the request does not send and I am prompted for email.

---

## 11. Account · `account-04` — Set password

**用户故事 1 — Set a new password from a valid link**

作为user with a valid reset or invite link, 我希望to set a new password 以便I can sign in.

- **AC1:** 给定 a valid set-password link, 当 I enter matching new passwords and submit, 则 my password is updated and I can sign in with the new password.
- **AC2:** 给定 passwords do not match, 当 I submit, 则 the password is not changed and I see a validation message.

**用户故事 2 — Expired link**

作为user with an expired link, 我希望a clear outcome 以便I know to request a new reset.

- **AC1:** 给定 my set-password link is expired, 当 I open it, 则 I see that the link expired and how to request a new one.

---

## 12. Profile · `profile-01` — Personal information

**用户故事 1 — Edit personal information**

作为已登录用户, 我希望to update my personal details separately from tastes 以便account facts stay accurate.

- **AC1:** 给定 I change my name or default location, 当 I save personal information, 则 the new values persist and a last-saved time is shown.
- **AC2:** 给定 I save personal information, 当 save succeeds, 则 a confirmation message appears and tastes are unchanged.
- **AC3:** 给定 I am on Profile, 当 I choose reset password, 则 I reach the reset-password flow without losing unsaved personal edits (or I am warned before navigating away).

**用户故事 2 — Optional profile photo**

作为user, 我希望an optional profile photo 以便my account feels personal.

- **AC1:** 给定 I add or replace a photo, 当 I save personal information, 则 the new photo appears in the profile panel.

---

## 13. Profile · `profile-02` — Tastes & constraints

**用户故事 1 — Save cuisine preferences**

作为已登录用户, 我希望to record cuisines I like and skip 以便Decide can match restaurants to me.

- **AC1:** 给定 I toggle preset cuisine chips and add a custom cuisine, 当 I save tastes, 则 my selections persist and last-saved time updates.
- **AC2:** 给定 I save tastes, 当 save succeeds, 则 personal information is unchanged.

**用户故事 2 — Constraints and meal contexts**

作为user with dietary or situational needs, 我希望hard constraints and meal contexts saved 以便matching reflects them.

- **AC1:** 给定 I set spice level, party size, hard constraints, and meal contexts, 当 I save tastes, 则 those values are stored for future Decide runs.
- **AC2:** 给定 I leave tastes empty, 当 I run Decide, 则 the app still returns results using Decide criteria alone (with weaker or generic fit labels as appropriate).

---

## 14. Decide · `decide-01` — Search criteria

**用户故事 1 — Run Decide with location and meal context**

作为已登录用户, 我希望to set where and 当 I am eating 以便the short list matches this meal.

- **AC1:** 给定 I enter area or pin, meal context, and budget per person, 当 I choose Find restaurants, 则 a new short list loads for those criteria.
- **AC2:** 给定 I optionally enter a craving, 当 I submit, 则 results respect that craving in matching copy or filtering where the BFF supports it.

**用户故事 2 — Meal context presets and free text**

作为user, 我希望preset meal contexts plus free text 以便I can describe ad-hoc situations.

- **AC1:** 给定 I pick a preset from meal context suggestions, 当 I submit, 则 that context is used for this Decide run.
- **AC2:** 给定 I type a custom meal context, 当 I submit, 则 the custom value is accepted and shown in results context.

---

## 15. Decide · `decide-02` — Results header & summary

**用户故事 1 — See 当 results were fetched**

作为user reviewing picks, 我希望to know 当 the list was last updated 以便I can judge freshness.

- **AC1:** 给定 a Decide run completed at 16:40 local time, 当 results display, 则 the results heading includes that last-updated time in locale-aware format.
- **AC2:** 给定 eight picks exist and four are shown on page 1, 当 the first page loads, 则 the summary states showing 1–4 of 8.

---

## 16. Decide · `decide-03` — Reshuffle

**用户故事 1 — Fresh picks without changing filters**

作为user who wants variety, 我希望reshuffle to **re-query map vendors** with the same criteria, **ignore any active sort**, and show a newly ranked short list.

- **AC1:** 给定 I have results for my current filters, 当 I choose Reshuffle, 则 the criteria stay the same, the sort resets to **By rank (default)**, and the BFF calls `search_restaurants` again (not a cursor rotate on the cached slice).
- **AC2:** 给定 I reshuffle, 当 new picks appear, 则 **last-updated time** reflects the refetch timestamp.
- **AC3:** 给定 I had sorted by rating or price, 当 I reshuffle, 则 the new list uses default rank order until I pick another sort.

---

## 17. Decide · `decide-04` — Results pagination

**用户故事 1 — Browse pages of the short list**

作为user with many picks, 我希望numbered pagination 以便I can browse without one long scroll.

- **AC1:** 给定 more picks exist than one page holds, 当 results load, 则 numbered page controls and Previous / Next are available.
- **AC2:** 给定 I am on page 1, 当 I choose page 2, 则 the next set of pick cards replaces the current page and the summary updates.
- **AC3:** 给定 I am on the first page, 当 the page loads, 则 Previous is unavailable; on the last page, Next is unavailable.

---

## 18. Decide · `decide-05` — Pick cards

**用户故事 1 — Scan a pick at a glance**

作为user, 我希望each pick card to show honest place facts and how well it fits me 以便I can compare options quickly.

- **AC1:** 给定 a place has a vendor rating, 当 its card renders, 则 name, rating, category, address, and source ids (e.g. AMAP) are visible.
- **AC2:** 给定 the BFF computed a fit level, 当 the card renders, 则 a fit badge shows strong, partial, or weak/conflict as appropriate.
- **AC3:** 给定 walk time was computed from my pin, 当 the card renders, 则 walk minutes from my pin are shown; if unknown, an honest unknown label is shown.

**用户故事 2 — Act on a pick from the card**

作为user, 我希望Details and Open map on cards 以便I can drill in or navigate externally.

- **AC1:** 给定 a pick card is shown, 当 I choose Details, 则 the place details dialog opens for that restaurant.
- **AC2:** 给定 a secret-free map link exists for the place, 当 I choose Open map, 则 a map opens in a new context without exposing vendor API keys.

**用户故事 3 — Honest warnings on cards**

作为user, 我希望warnings 当 data is missing or travel is long 以便I am not misled.

- **AC1:** 给定 hours or price are not available from the vendor, 当 the card renders, 则 a visible note states that fact rather than inventing values.
- **AC2:** 给定 walk time exceeds the product threshold for this meal, 当 the card renders, 则 a long-travel warning is shown.

---

## 19. Decide · `decide-06` — Empty & partial results

**用户故事 1 — Empty search**

作为user whose filters are too tight, 我希望an empty state with next steps 以便I know how to get results.

- **AC1:** 给定 no restaurants match my criteria, 当 results load, 则 an empty state explains nothing matched and offers to widen filters (e.g. link to Profile).

**用户故事 2 — Partial vendor success**

作为user 当 one map vendor fails, 我希望partial results with explanation 以便I still get usable picks.

- **AC1:** 给定 a map vendor timed out or failed, 当 results load, 则 the partial banner names the skipped provider(s) and does **not** claim “only AMAP” (or similar) 当 cards from that provider are still visible.
- **AC2:** 给定 at least one vendor returned results, 当 partial failure occurred, 则 the results grid is not blank.

---

## 20. Decide · `decide-07` — List-level agent chat

**用户故事 1 — Ask about the current list**

作为user on Decide, 我希望to chat about my current list and filters 以便I can refine without leaving the page.

- **AC1:** 给定 I have an active Decide list, 当 I open Chat with agent, 则 a panel shows the current area, meal context, and budget as chat context.
- **AC2:** 给定 the chat panel is open, 当 I send a message about filters or nearby options, 则 I receive a reply labeled as a suggestion (not as verified menu or hours fact).
- **AC3:** 给定 the chat panel is open, 当 I close it, 则 I return to the list without losing my current results until I explicitly run a new search or reshuffle.

**用户故事 2 — Chat 历史 stays on this device**

作为user, 我希望my list chat history kept in this browser 以便I can read earlier messages without storing them in my account database.

- **AC1:** 给定 I sent messages in list chat, 当 I close and reopen the chat panel on the same browser, 则 prior messages for this Decide context are shown from browser-local storage (`w2e.chat.list`).
- **AC2:** 给定 I sent messages in list chat, 当 I sign in on another device or browser, 则 those transcripts are not available (no server-side chat history).
- **AC3:** 给定 I log out on this browser, 当 I sign in again, 则 list chat transcripts from the prior session are cleared from browser-local storage.
- **AC4:** 给定 I sent messages in list chat for the current Decide session, 当 I run Find restaurants again (new `searchId`), 则 the list chat transcript remains visible and is still stored under `w2e.chat.list` (agent context updates to the new short list; history is not wiped).

**用户故事 3 — Chat is not the only search path**

作为user, 我希望primary search via Find restaurants 以便chat supplements rather than replaces structured Decide.

- **AC1:** 给定 I have not run Find restaurants, 当 I open list chat, 则 the app still expects a Decide run for a full short list (chat may prompt me to search first).

**用户故事 4 — BFF does not persist chat**

As an operator, 我希望chat orchestration to stay stateless on the server 以便transcripts are not written to the database.

- **AC1:** 给定 a user sends a list-chat message, 当 the BFF returns a reply, 则 no chat transcript row is created or updated in the application database.

---

## 21. Place · `place-01` — Place details — facts

**用户故事 1 — View restaurant facts in a dialog**

作为user, 我希望place details in a dialog 以便I stay on Decide or Saved while reading facts.

- **AC1:** 给定 I open Details from a pick card, 当 the dialog opens, 则 it shows Place details with a photo area and fact fields for name, rating, cuisine/category, address, phone, and hours.
- **AC2:** 给定 hours were not returned by the vendor, 当 the dialog opens, 则 hours show an honest unavailable message, not fabricated hours.
- **AC3:** 给定 the dialog is open, 当 I choose Close, press Escape, or activate the backdrop per accessibility rules, 则 the dialog closes and I return to the underlying page.

**用户故事 2 — Freshness of place facts**

作为user, 我希望to know 当 facts were fetched 以便I can judge staleness.

- **AC1:** 给定 place facts were loaded at 16:40, 当 the dialog opens, 则 a last-updated time for place facts is shown in locale-aware format.

---

## 22. Place · `place-02` — Place details — why

**用户故事 1 — Understand why this pick fits**

作为user, 我希望why-this-pick in the same dialog 以便I do not navigate to a separate page.

- **AC1:** 给定 I open details for a pick, 当 the Why this pick section loads, 则 bullet reasons reference my profile and current Decide context (e.g. budget band, walk time, meal context).
- **AC2:** 给定 other places exist in the same search list, 当 the dialog opens, 则 Also nearby lists alternative restaurants with short fit notes.
- **AC3:** 给定 menu and allergen data are not available, 当 the dialog opens, 则 a disclaimer tells me to confirm dishes and allergens with the restaurant.

**用户故事 2 — Open an alternative from why**

作为user, 我希望to jump to another nearby pick from the why section 以便I can compare quickly.

- **AC1:** 给定 Also nearby lists an alternative, 当 I select it, 则 details open for that alternative (or the list focuses that pick per product navigation rules).

---

## 23. Place · `place-03` — Place-level agent chat

**用户故事 1 — Ask about this restaurant**

作为user viewing details, 我希望place-scoped chat 以便follow-ups stay about this restaurant and nearby options.

- **AC1:** 给定 the details dialog is open, 当 I send a place-scoped message, 则 the reply is labeled as a suggestion and references the selected place context.
- **AC2:** 给定 list chat and place chat both exist, 当 I use place chat, 则 messages do not appear in the Decide list chat transcript (separate scopes).

**用户故事 2 — 详情 chat history stays on this device**

作为user, 我希望place chat history kept in this browser 以便follow-ups persist while I stay on this device.

- **AC1:** 给定 I sent messages in place chat for St. JOHN, 当 I close and reopen details for the same place on the same browser, 则 prior place-chat messages are shown from browser-local storage.
- **AC2:** 给定 I sent place chat for one restaurant, 当 I open details for a different restaurant, 则 I see that place’s own transcript (or an empty transcript), not the other place’s messages.
- **AC3:** 给定 I sent place chat messages, 当 I sign in on another device, 则 those transcripts are not available (no server-side chat history).

**用户故事 3 — BFF does not persist place chat**

As an operator, 我希望place-scoped chat orchestration to stay stateless on the server.

- **AC1:** 给定 a user sends a place-chat message, 当 the BFF returns a reply, 则 no chat transcript row is created or updated in the application database.

---

## 24. Place · `place-04` — Open map & save

**用户故事 1 — Open map from details**

作为user who chose a restaurant, 我希望Open map from details 以便I can navigate there.

- **AC1:** 给定 a secret-free map deeplink exists in place sources, 当 I choose Open map in details, 则 the map opens without vendor secrets in the URL shown to me.

**用户故事 2 — Save from details**

作为user, 我希望to save a place from details 以便I can find it later on Saved.

- **AC1:** 给定 the place is not saved, 当 I choose Save in details, 则 the place appears on my Saved list.
- **AC2:** 给定 the place is already saved, 当 details open, 则 Unsave is available instead of Save.

---

## 25. Saved · `saved-01` — Saved places list

**用户故事 1 — Review saved restaurants**

作为已登录用户, 我希望a Saved page with the same pick-card pattern as Decide 以便favorites feel familiar.

- **AC1:** 给定 I have saved places, 当 I open Saved, 则 each saved restaurant appears as a pick card with Details and Unsave.
- **AC2:** 给定 I open Details from Saved, 当 the dialog opens, 则 the same place details, why, and place chat content is available as on Decide.

**用户故事 2 — Empty saved list**

作为new user with no saves, 我希望guidance 当 Saved is empty.

- **AC1:** 给定 I have no saved places, 当 I open Saved, 则 an empty state explains how to save from a card or details and offers a path to Decide.

---

## 26. Saved · `saved-02` — Unsave

**用户故事 1 — Remove a saved place**

作为user, 我希望to unsave a restaurant 以便my Saved list stays current.

- **AC1:** 给定 a place is on my Saved list, 当 I choose Unsave on the card, 则 the place is removed from Saved after confirmation or immediate action per product rules.
- **AC2:** 给定 I unsave from details, 当 I return to Saved, 则 that place no longer appears in the list.

---

## 27. History · `history-01` — Decision history

**用户故事 1 — Review recent decisions**

作为已登录用户, 我希望recent places I went to 以便I can remember where I ate.

- **AC1:** 给定 I previously saved or opened the map for a place from Decide, 当 I open History, 则 each row shows place name, area, meal context, and a Went status.
- **AC2:** 给定 我希望to eat again in the same area, 当 I choose Find places again on a history row, 则 I am taken to Decide with criteria prefilled or easily restorable per product rules.

**用户故事 2 — Empty history**

作为user who has never completed Decide, 我希望a clear empty history state.

- **AC1:** 给定 I have no recorded decisions, 当 I open History, 则 an empty state invites me to run Decide once.

**用户故事 3 — Reach history from Saved**

作为user browsing favorites, 我希望a path to History 以便I can switch between saved places and past decisions.

- **AC1:** 给定 I am on History, 当 the page loads, 则 I can navigate back to Saved from the page toolbar.

---

## 28. Decide · `decide-08` — Results sort

**用户故事 1 — Re-order the current short list**

作为已登录用户 reviewing Decide results, 我希望to sort the full short list by recommendation rank, rating, walking distance, or price level 以便I can compare options without changing my search criteria.

- **AC1:** 给定 results are visible, 当 the page loads, 则 a sort control is shown with **By rank (default)**, **By rating**, **By distance**, and **By price** (i18n keys `eat.decide.sort.*`).
- **AC2:** 给定 the default sort, 当 results display, 则 card order matches BFF `rankPicks` (fit → **vendor region priority on mainland** → rating → vendor tie-break overseas → name).
- **AC3:** 给定 I choose **By rating**, 当 the list updates, 则 higher ratings appear first; picks without a vendor rating appear last with the existing honest missing label.
- **AC4:** 给定 I choose **By distance**, 当 the list updates, 则 shorter walk times appear first; unknown distance appears last.
- **AC5:** 给定 I choose **By price**, 当 the list updates, 则 picks sort by agent `price_level` ascending (`FREE` → `$` → `$$` → `$$$` → `$$$$`); picks without `price_level` appear last (no invented prices).
- **AC6:** 给定 I change sort, 当 the response returns, 则 pagination resets to page 1 and the summary `{shown}–{end} of {total}` stays correct for the full list.
- **AC7:** 给定 a new **Find restaurants** run, 当 results load, 则 sort resets to **By rank**.

**用户故事 2 — Vendor data priority by region**

作为product rule, 当 the search pin is in **mainland China**, place facts and primary source ids should prefer **AMAP**; outside mainland China, prefer **GOOGLE_MAPS** / **TRIPADVISOR** 当 multiple vendor records exist for the same place.

- **AC1:** 给定 the pin is in mainland China (excluding HK/MO/TW bounding boxes), 当 cards are built, 则 `sources[]` is ordered AMAP-first and the primary provider fields reflect AMAP 当 present.
- **AC2:** 给定 the pin is outside mainland China, 当 cards are built, 则 `sources[]` is ordered GOOGLE_MAPS / TRIPADVISOR before AMAP.
- **AC3:** 给定 the pin is in mainland China, 当 the default rank sort applies, 则 picks with **AMAP** as primary provider appear before **GOOGLE_MAPS** picks at the same fit level (even 当 Google has a higher rating).

**Dependencies:** places-agent returns optional `price_level` on search/detail cards (`FREE` | `$` | `$$` | `$$$` | `$$$$`). **Live 2026-08-20:** field present on a majority of Google/AMAP sample cards ([`price-level-live.md`](../../workspace-specs/knowledge/maps/price-level-live.md)). Display of the band on cards is **decide-09**; sort uses the same field.

---

## 29. Chat · `chat-02` — Resizable chat panel

**用户故事 1 — Composer stays at the bottom**

作为 Decide 用户, 我希望list chat 输入框紧贴面板底部 以便不会在输入区下方出现大块空白。

- **AC1:** 给定 list chat 已打开, 当面板内消息较少, 则 transcript 区域在上方滚动，composer（输入 + 发送）固定在面板底部，composer 下方无多余留白（≤ 设计 token 的 `panel-padding`）。
- **AC2:** 给定消息较多, 当 transcript 溢出, 则仅 transcript 滚动，composer 仍可见且不被推出视口。

**用户故事 2 — Drag to resize**

作为 Decide 用户, 我希望拖拽改变 list chat 面板大小 以便在需要时看到更多对话或推荐卡片。

- **AC1:** 给定 list chat 已打开, 当我在**左上角** resize grip 上拖拽, 则面板宽高随指针变化（右下角锚定）。
- **AC2:** 给定默认尺寸（当前 mock：`22.5rem` × `28rem`）, 当缩小面板, 则不能小于该默认尺寸（min-width / min-height）。
- **AC3:** 给定放大面板, 当超过视口, 则 clamp 在 `calc(100vw - 2rem)` × `calc(100vh - 2rem)` 内。
- **AC4:** 给定我使用键盘, 则 resize grip 可聚焦；Escape 仍关闭面板（decide-07 AC3 不变）。
- **AC5:** 给定 list chat 已打开, 当面板渲染, 则左上角 grip 为可见控件（热区 ≥ `2rem`、**无方钮描边**、三条平行斜握纹清晰可见），`data-testid="agent-chat-resize"`。

**用户故事 3 — Place chat 布局一致**

作为查看详情的用户, 我希望详情内 place chat 采用相同的「transcript 滚动 + 底部 composer」布局（不要求拖拽 resize）。

- **AC1:** 给定 place chat 在详情对话框内, 当消息与 composer 同屏, 则 composer 下方无大块空白。
- **AC2:** （详见 **chat-04**）多轮对话时 transcript 在 chat 盒内滚动，不把整页对话框撑到必须拖动才能看到输入框。

**Out of scope（本 story）：** 无 — 尺寸持久化见 **chat-05**。

---

## 30. Chat · `chat-03` — Rich agent replies

**用户故事 1 — Structured assistant message**

作为用户, 我希望助手回复以结构化卡片展示 以便快速扫读店名、评分、图片与地图链接。

- **AC1:** 给定助手回复包含对当前 list 中餐厅的推荐, 当消息渲染, 则每条推荐显示为 **pick card**（缩略图、店名、评分/品类 meta、地图链接），而非单一 `<p>` 纯文本块。
- **AC2:** 给定 pick card 上的地图/外链, 当用户点击, 则在**新浏览器标签页**打开（`target="_blank"` + `rel="noopener noreferrer"`）。
- **AC3:** 给定助手回复, 当渲染, 则仍显示 **Suggestion** 标签（`eat.why.kind_model`），且文案仍为建议性质（非 verified menu/hours fact — 延续 decide-07 AC2）。
- **AC4:** 给定图片不可用, 当渲染 pick card, 则显示与 Decide pick card 一致的空图占位，不编造照片 URL。

**用户故事 2 — List 与 place scope 共用渲染**

作为实现约束, 我希望list chat 与 place chat 共用同一套 rich block 渲染组件。

- **AC1:** 给定 place chat 推荐附近备选, 当仅一条 pick, 则仍使用相同 card 组件（可单列布局）。
- **AC2:** 给定 list chat 与 place chat, 当存储 transcript, 则 localStorage 存 **结构化 JSON blocks** + 可选 `fallbackText`（供搜索/无障碍），不存 HTML 字符串。

**用户故事 3 — BFF enriches cards from real data**

作为诚实性约束, 我希望卡片上的图片、评分、链接来自 BFF 已知的 pick / place 数据，而非模型臆造 URL。

- **AC1:** 给定模型返回 `pick_ref` block（provider + nativeId）, 当 BFF 响应, 则 BFF 从当前 SearchCache picks、place snapshot、或 agent 本轮工具返回的 `places[]` **hydrate** 名称、photoUrl、rating、mapUrl。
- **AC2:** 给定模型引用不在 context 且不在本轮 `places[]` 内的餐厅, 当无法 hydrate, 则降级为纯文本行（无假图、无假链接）。
- **AC3:** 给定 `POST /api/chat`, 当成功, 则响应体为 `{ reply: { role, blocks[], fallbackText? } }`；客户端向后兼容：若仅收到 legacy `content` 字符串，则渲染为单段 paragraph block。
- **AC4:** 给定助手介绍餐厅, 当渲染, 则优先 **pick card**（短 lead + cards），避免长段地址/坐标/分类枚举纯文本（card-first prompt）。

**用户故事 4 — Security**

- **AC1:** 给定 rich 渲染, 当展示链接, 则仅允许 `https:`（及地图 deeplink 方案）；禁止 `javascript:`。
- **AC2:** 给定用户 locale, 则 block 内可见文案仍走 i18n / catalog keys；模型自由文本作为 block `text` 字段原样显示（不执行 HTML）。

**Dependencies:** places-agent `/v1/chat` 输出 JSON `blocks[]`（见 [`2eat-design.md`](./2eat-design.md) §3.6）；BFF hydrate `pick_ref`。

---

## 31. Chat · `chat-04` — Pending + place chat scroll

**用户故事 1 — Waiting for the agent**

作为用户, 我希望发送消息后立刻看到「助手正在回复」的提示 以便知道系统在工作、不会重复狂点发送。

- **AC1:** 给定 list chat 或 place chat, 当我发送一条消息且请求尚未返回, 则 transcript 出现 **pending** 气泡（`data-testid="chat-pending"`），文案为 i18n `eat.chat.pending`（四 locale）。
- **AC2:** 给定 pending 可见, 当请求成功或失败, 则 pending 消失，代之以 assistant 消息或错误消息。
- **AC3:** 给定 pending 期间, 当我再次点发送, 则发送按钮保持 disabled（已有 busy），输入框不可提交。
- **AC4:** 给定 `prefers-reduced-motion: reduce`, 则 pending 不用闪烁动画（可用静态文案 + 省略号）。

**用户故事 2 — Place chat scrolls inside its box**

作为打开详情的用户, 我希望多轮对话时只在 chat 区域内滚动 以便输入框始终在对话区底部可见，不必拖动整个详情对话框。

- **AC1:** 给定详情对话框已打开且 place chat 有 ≥3 条消息, 当 transcript 超出 chat 盒高度, 则 **仅** `.place-why-chat__transcript` 出现纵向滚动条；composer 仍贴在 chat 盒底部。
- **AC2:** 给定 chat 盒, 当高度, 则受设计 token 约束（默认 `max-height: min(16rem, 40vh)` 于 transcript，或 chat 盒整体 `max-height: min(20rem, 45vh)` — 实现取其一并在 design §3.7 写死）。
- **AC3:** 给定新消息到达（含 pending）, 当渲染, 则 transcript 自动滚到底部。
- **AC4:** 给定详情对话框本身仍可因「为何推荐」等内容溢出视口, 当滚动对话框, 则 chat 盒内滚动与对话框滚动互不抢夺焦点（各自独立）。

**Out of scope：** list chat 外层面板已有固定高度 + 内部 scroll（chat-02）；本 story 不改 list 面板尺寸策略。

---

## 32. Decide · `decide-09` — Show price on cards

**用户故事 1 — Price band on pick cards**

作为 Decide 用户, 我希望卡片上看到 vendor 给出的价格档 以便和预算对照。

- **AC1:** 给定 pick 有 agent `price_level`, 当卡片渲染, 则显示价格档（i18n `eat.card.price`，vars `{ band }` = `FREE`/`$`/`$$`/`$$$`/`$$$$`），`data-testid="pick-price"`。
- **AC2:** 给定 pick 无 `price_level`, 当卡片渲染, 则显示诚实缺失文案 `eat.card.price_unavailable`（或同等 missing 样式），**不**编造 `$$`。
- **AC3:** 给定 AMAP 另返回 `price_per_person`（人均元）, 当存在, 则卡片可在 band 旁或下一行显示 `eat.card.price_per_person`（vars `{ amount }`）；无该字段则不显示。

**用户故事 2 — Price on place details**

作为查看详情的用户, 我希望事实区有价格一行 与营业时间同级。

- **AC1:** 给定详情打开, 当 place / pick 有 `price_level`, 则 facts 列表含 **Price** 行（`eat.details.price` + band；可选人均）。
- **AC2:** 给定无价格, 当渲染, 则该行显示 `eat.card.price_unavailable`（`is-missing` 样式），与 hours 缺失一致。

**用户故事 3 — Sort stays honest**

- **AC1:** 给定 **By price** sort（decide-08）, 当 live 数据含 `price_level`, 则有价格的店按档位升序；仍无价格的排末尾（行为不变，覆盖率提高）。

**Dependencies:** places-agent **已确认 live 输出** `price_level`（2026-08-20 探针：Google ~55%、AMAP ~60% 覆盖；见 [`price-level-live.md`](../../workspace-specs/knowledge/maps/price-level-live.md)）；可选 `price_per_person`（AMAP）。what2eat `PlaceCard` / `PickDto` 需透传 `price_per_person`（当前 types 仅有 `priceLevel`，decide-09 实现时补）。

---

## 33. Decide · `decide-10` — Keep location draft

**用户故事 1 — Locale switch does not reset area**

作为 Decide 用户, 我希望切换语言后地区/定位输入框仍显示我刚输入的内容 以便不必反复重打。

- **AC1:** 给定我已在 Decide 地区框输入非空文本（可与 profile 默认不同）, 当我切换 header locale（EN/CN/HK/TW）后页面刷新文案, 则 `data-testid="decide-location"` 的值 **仍为切换前的最新输入**，不回到 profile `defaultLocation`。
- **AC2:** 给定我清空地区框或改写后再切 locale, 当切完, 则仍保留清空/改写后的最新值（含空字符串）。
- **AC3:** 给定 URL 带 `?location=…`（如 History 重跑）, 当打开 Decide, 则优先 URL，再切 locale 亦不被 profile 默认覆盖。

**用户故事 2 — Profile default only seeds virgin field**

作为新会话用户, 我希望首次进入 Decide 时仍能用上 profile 默认地区 以便少打字。

- **AC1:** 给定无 URL `location`、无 session 草稿、用户尚未编辑地区框, 当加载 profile personal, 则可用 `defaultLocation`（及 lat/lng pin）填充一次。
- **AC2:** 给定用户已编辑过地区框（`locationTouched`）或 session 已有草稿, 当 profile 再次返回 / locale refresh 触发 hydrate, 则 **禁止** 用 `defaultLocation` 覆盖输入框。
- **AC3:** 给定 SearchCache / `decide/current` 已带回 `criteria.location`, 当无 URL location, 则优先 criteria；其后 profile 不得覆盖。

**实现约束（设计）：**

- 最新输入写入 **sessionStorage** 草稿键（如 `w2e.decide.draft.location`），locale `router.refresh()` 或 remount 后优先恢复。
- Profile hydrate 必须检查：URL → session draft → criteria → profile default；且尊重 `locationTouched`。
- 不写入 profile（改输入 ≠ 改默认地址）；持久默认仍走 Profile 页保存。

**Out of scope：** 跨浏览器标签同步；把 Decide 草稿写回 Profile 默认地址。

---

## 34. Decide · `decide-11` — Keep other criteria drafts

**用户故事 1 — Meal / budget / craving survive locale switch**

作为 Decide 用户, 我希望切换语言后用餐场景、人均预算、craving 仍显示我刚输入的内容 以便与地区框行为一致。

- **AC1:** 给定我已编辑 meal context / budget / craving 中任一项, 当切换 locale 后, 则对应控件值仍为切换前最新输入（含清空后的空值）。
- **AC2:** 给定 URL 带 `?meal=` / `?budget=` / `?craving=`, 当打开 Decide 再切 locale, 则 URL 值优先且不被 profile / 默认 preset 覆盖。
- **AC3:** 给定字段仍 virgin（无草稿、未编辑）, 当首次 hydrate, 则可用 SearchCache criteria 或产品默认（meal preset）；**不得**在已有草稿后用默认盖写。

**实现：** 与 decide-10 相同 sessionStorage 模式与 hydrate 顺序（[ADR-029](../../workspace-specs/adr/ADR-029-decide-criteria-draft-hydrate.md)）。草稿键建议：`w2e.decide.draft.meal` / `budget` / `craving`。

---

## 35. Chat · `chat-05` — Persist chat panel size

**用户故事 1 — Remember resized list chat**

作为使用 list chat 的用户, 我希望刷新页面后仍保留我拖到的面板宽高 以便不必每次重调。

- **AC1:** 给定我已用 NW grip 把面板调到大于最小值, 当刷新 Decide 再打开 chat, 则宽高恢复为上次尺寸（夹在 min/max token 内）。
- **AC2:** 给定 localStorage 无记录或值非法, 当打开 chat, 则使用默认 `22.5rem × 28rem`。
- **AC3:** 给定登出, 当清除 chat transcript keys 时, **可**同时清除尺寸键（实现二选一并写死：登出清 / 登出保留；推荐登出清，与 chat 隐私一致）。
- **AC4:** 存储键 i18n 无关（如 `w2e.chat.panelSize`）；仅存宽高数字，不存文案。

**Dependencies:** chat-02 resize 行为已存在。

---

## Mock-up 追溯

| Mock-up | 覆盖 feature |
| --- | --- |
| `01-home.html` | home-01, footer-02, i18n-01 |
| `02-register.html` | account-01, footer-02, i18n-01 |
| `03-login.html` (+ error variant) | account-02, footer-02 |
| `04-reset.html` | account-03, footer-02 |
| `05-set-password.html` (+ expired) | account-04, footer-02 |
| `06-decide.html` (+ empty, partial, `?open=details`, `?open=details&pending=1`, `?open=chat`, `?open=chat&pending=1`, `?open=chat&tall=1`, `?open=chat&plain=1`) | decide-01–11, place-01–04, chat-02–05, header-*, footer-01 |
| `07-profile.html` | profile-01, profile-02, footer-01 |
| `08-saved.html` (+ empty) | saved-01, saved-02, place-01–04, footer-01 |
| `09-history.html` (+ empty) | history-01, footer-01 |
| `index.html` | gallery + footer-02 |
| `10-why.html` | Redirect only — why content is place-02 inside details dialog |
