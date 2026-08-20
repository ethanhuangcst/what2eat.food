# what2eat — 测试计划

在 workspace **common-test-strategy** 基线上扩展 what2eat 增量规则。不降低金字塔层级、不跳过 auth 测试、不削弱质量检查清单。

| 绑定 | 位置 |
| --- | --- |
| 基线 | `common-test-strategy`（always-on rule） |
| 产品规格 | [`2eat-prod-specs.md`](./2eat-prod-specs.md) |
| 用户故事 | [`2eat-stories.md`](./2eat-stories.md) |
| 设计 | [`2eat-design.md`](./2eat-design.md) |
| places-agent 测试 | [`../../1.places-agent/agent-specs/4.test-strategy.md`](../../1.places-agent/agent-specs/4.test-strategy.md) |
| Agent HTTP 用例 | [`../../1.places-agent/agent-specs/8.user-test-cases.md`](../../1.places-agent/agent-specs/8.user-test-cases.md) |
| ADR live | [ADR-021](../../workspace-specs/adr/ADR-021-live-vendor-no-fixture.md) |
| ADR HTTP chat | [ADR-020](../../workspace-specs/adr/ADR-020-http-only-chat-and-enrich.md) |

**状态：** active — §3 MVP DoD 为交付门禁。

---

## §1 与 common-test-strategy 的关系

| 增量 | 规则 |
| --- | --- |
| Thin client | Decide、详情、地图链接、chat 须经 BFF HTTP 到达 places-agent；浏览器不持有 caller key / map key / LLM key |
| 不编造餐厅 | BFF 不得在 agent 空/失败时返回 canned 餐厅名 |
| Live honesty（ADR-021） | MVP-2+ DoD：live `PLACES_VENDOR_MODE`；签收探针无 `fixture_` native id |
| Chat 历史 | 列表/详情 chat **仅 browser localStorage**；契约测试断言 DB **无** chat 行 |
| Chat 传输 | BFF → `POST /v1/chat`（ADR-020）；浏览器不调 MCP |
| 四 locale | `EN`/`CN`/`HK`/`TW`；HK ≠ TW；测试用 key / `data-testid` / role |
| 双信任模式 | 用户 session（cookie）访问 what2eat；caller key 仅 BFF→agent 服务端 |
| 默认 PR CI | 注入 agent HTTP（快）；** alone 不满足** MVP-2/3/4 DoD |
| MVP E2E 签收 | 真实 what2eat + 真实 places-agent（live vendor）+ 隔离测试 DB |

### 1.1 双通道：Fast CI vs Live DoD

| 通道 | 目的 | 餐厅数据 | 阻塞合并？ |
| --- | --- | --- | --- |
| **Fast CI** | 单测、BFF 契约、auth、i18n | 注入 agent 响应 | 是 — 每 PR |
| **MVP DoD / live probe** | 证明 thin client 对真实 vendor 可用 | Live agent + live keys | 是 — MVP-2/3/4 关闭前 |

**反模式：** Fast CI 用 stub `search_restaurants` 即标 Decide done（`fixture-only`，非 MVP DoD）。

---

## §2 测试金字塔

目标 mix ~70 / 20 / 10。

| 层 | 内容 | 工具 |
| --- | --- | --- |
| 单元/组件 (~70%) | preference-match、sort-picks、partial-banner、vendor-priority、meal-contexts、chip-selection、i18n、chat localStorage、Zod | Vitest |
| 集成/契约 (~20%) | `/api/*` + 注入 agent fetch；session；DB CRUD；chat 不 INSERT | Vitest + `TEST_DATABASE_URL` |
| E2E (~10%) | 每 MVP 一条完整旅程 | Python Playwright + live 栈（MVP-2+ 双进程） |

不得仅用硬编码餐厅数组的单测代替 Decide E2E。

---

## §3 MVP DoD 质量门

MVP-2/3/4 涉及 place 数据时，**全部**满足方可关闭：

1. **真实栈：** what2eat + places-agent 运行；BFF 使用真实 caller key。
2. **Live vendors：** agent `PLACES_VENDOR_MODE=live`（探针 pin）。
3. **无 fixture id：** 卡片 `native_id` 不以 `fixture_` 开头。
4. **运营探针 pin：** 每区域至少一处（如 EN Clerkenwell + GOOGLE_MAPS；CN 杭州 + AMAP）— 写入 retrospective。
5. **Playwright MVP 旅程** 在 live 栈上绿（§6）。
6. **用户确认：** 「Do you confirm this MVP is usable?」（workspace DoD）。
7. **状态标签：** place 路径为 `live-honest` 或 `fail-closed` — 非 `implemented` / `fixture-only`。

MVP-1 不调 agent，但仍需真实 DB、真实 session、真实邮件路径（Resend sandbox 或 dev outbox）。

### MVP-1 — 账号与 profile

| 门禁 | 要求 |
| --- | --- |
| 功能 | 注册、登录、重置/设置密码、profile 双卡持久化 |
| 测试 | `make test` 绿；`make test-e2e-mvp1` 绿 |
| 真实集成 | 测试 DB；session；邮件 outbox |
| 质量 | common-test-strategy + §4（URL 无 password、i18n key） |
| 用户 | 明确可用性确认 |
| Retrospective | 运行 `retrospective` skill |

### MVP-2 — 真实 Decide

| 门禁 | 要求 |
| --- | --- |
| 功能 | Live Decide → 详情 → why → 收藏 → Saved → 取消收藏 |
| 测试 | `make test` + **`make test-e2e-mvp2-live`** |
| Live | ADR-021 探针通过；更新诚实性矩阵 |
| 质量 | 不编造餐厅；地图链接无 secret |
| 用户 | 在 **live pin** 上确认可用性 |
| Retrospective | 附探针位置 + 样例卡片 JSON（无密钥） |

### MVP-3 — Chat 与历史 — **Complete**（2026-08-20 签收）

| 门禁 | 要求 |
| --- | --- |
| 功能 | 列表 + 详情 chat 真实 agent 回复；历史记录 |
| 测试 | `make test` + **`make test-e2e-mvp3-live`** — **passed** 2026-08-20 Clerkenwell |
| Chat 存储 | localStorage only；登出清除；E2E 验证 |
| 质量 | 回复标为 suggestion；非菜单/过敏原权威 |
| 用户 | 明确可用性确认 — **confirmed** |
| Retrospective | [`what2eat-mvp3-lessons.md`](../../workspace-specs/knowledge/web-app-development/what2eat-mvp3-lessons.md)；ADR-027 / ADR-028 |

### MVP-4 — 排序、chat UX、价格、条件草稿、尺寸持久化 — **Complete**（2026-08-21 签收）

| 门禁 | 要求 |
| --- | --- |
| 功能 | sort；reshuffle 重查；list chat napkin-corner resize + rich + pending；place chat 内滚动；`price_level`；Decide 条件草稿跨 locale（decide-10/11）；chat 尺寸 localStorage（chat-05） |
| 测试 | `make test`（149）+ **`make test-e2e-mvp4-live`** — **passed**（用户确认已跑；基线 2026-08-20） |
| 质量 | 价格仅来自 agent；无则 honest missing；chat 卡片图/链仅 BFF hydrate；profile 默认不覆盖已编辑条件 |
| 用户 | 明确可用性确认 — **confirmed** 2026-08-21 |
| Retrospective | [`what2eat-mvp4-lessons.md`](../../workspace-specs/knowledge/web-app-development/what2eat-mvp4-lessons.md) + follow-ups；ADR-029（drafts）；ADR-031（空 AMAP→Google，places-agent） |

---

## §4 质量检查清单（what2eat 增量）

在 common-test-strategy 全量清单之上，另需：

- [ ] Token 表单：E2E 提交后 URL 不含 `password=`
- [ ] 用户 session 不能从浏览器直连 places-agent `/v1/*`
- [ ] Caller key 不在 client bundle / localStorage / sessionStorage
- [ ] Chat 仅 localStorage；DB 检查无 chat 行
- [ ] 登出清除 list/place chat keys
- [ ] MVP-2 live：卡片无 `fixture_` id；至少一个真实 vendor source id
- [ ] 部分 vendor 失败时结果区不全空（live 可复现时）
- [ ] HK 与 TW 非同一 catalog；测试不用 OpenCC 代替
- [ ] 默认 PR CI 不要求 live map keys
- [ ] MVP DoD 不用 `ui-mockup/` 静态 HTML 代替 Next 产品证明
- [ ] Story 状态 honest 矩阵与 §8 一致
- [ ] 无 dismiss/cool-off UI/API（产品范围外）

---

## §5 测试用例矩阵

从 `2.what2eat/tests/` 与 `e2e/` 归纳。

| Feature / MVP | 单元/契约 | E2E 脚本 | Makefile |
| --- | --- | --- | --- |
| **MVP-1** auth/profile/shell | `tests/api/auth-*.test.ts`, `profile-*.test.ts`, `locale.test.ts`, `i18n.test.ts`, `register-validation.test.ts`, `csrf.test.ts` | `e2e/test_mvp1.py`, `test_login_failed.py`, `test_reset_set_password.py`, `test_register_errors.py` | `make test`, `make test-e2e-mvp1` |
| **MVP-2** decide/details/saved | `decide-search`, `decide-reshuffle`, `places-details`, `preference-match`, `partial-banner`, `saved.test.ts`, `nearby-alternatives`, `location`, `geocode-reverse` | `e2e/test_mvp2_live.py` | `make test-e2e-mvp2-live` |
| **MVP-3** chat/history | `chat.test.ts`, `history.test.ts`, `decide-current.test.ts`, `chat-local-storage.test.ts`, `meal-contexts.test.ts` | `e2e/test_mvp3_live.py` | `make test-e2e-mvp3-live` |
| **MVP-4** sort/reshuffle/chat UX | `decide-sort.test.ts`, `sort-picks.test.ts`, `decide-draft.test.ts`, `chat-panel-size.test.ts`, `chat-composer-pending.test.tsx`, chat blocks/hydrate unit | `e2e/test_mvp4_live.py` | `make test-e2e-mvp4-live` |

**支撑模块（跨 MVP）：** `chip-selection`, `session-token`, `mail-outbox`, `places-agent-config`, `public-url`, `build-system-context`, `locales`.

---

## §6 关键 E2E 旅程步骤

| 旅程 | MVP | 步骤摘要 |
| --- | --- | --- |
| 注册 → profile → 登出 → 登录 → profile 仍在 | MVP-1 | 含 EN→HK locale；family footer |
| 登录失败提示 | MVP-1 | `test_login_failed.py` |
| 重置/设置密码 | MVP-1 | 无 URL 泄露 token |
| 登录 → Decide（真实 pin）→ 卡片含 source id → 详情 → Why → 收藏 → Saved → 取消收藏 | MVP-2 | live 卡片；无 `fixture_` |
| Reshuffle + 分页 | MVP-2 | decide-03/04 |
| Open map URL 无 API key | MVP-2 | popup 或新标签 |
| 列表 chat 真实回复 → 刷新 → localStorage 仍在 → 登出清除 | MVP-3 | 与 list transcript 分离 |
| 详情 place chat | MVP-3 | 不与 list chat 混 |
| Decide → 历史行 → 再跑 Decide | MVP-3 | history-01 |
| Sort 控件 + rating 顺序 + reshuffle 重查 | MVP-4 | decide-08 + decide-03 更新 |
| List chat resize + sticky composer | MVP-4 | chat-02 |
| List/place chat rich pick cards + 地图新标签 | MVP-4 | chat-03 |
| Chat pending + place chat 内滚动 | MVP-4 | chat-04 |
| Pick card / details 展示 price_level | MVP-4 | decide-09 |
| 切 locale 保留 Decide 地区输入 | MVP-4 | decide-10 |
| 切 locale 保留 meal/budget/craving | MVP-4 | decide-11 |
| List chat 尺寸刷新后恢复 | MVP-4 | chat-05 |

**Harness：** MVP-1 单进程 what2eat；MVP-2+ 加 places-agent（`scripts/with_server.py`）。Playwright：`domcontentloaded` + 显式 `data-testid` 等待。

---

## §7 CI 命令表

| 命令 | 时机 | 内容 |
| --- | --- | --- |
| `make test` | 每 PR | Vitest 全量（注入 agent） |
| `make test-e2e-mvp1` | MVP-1 DoD | 真实 DB 旅程 |
| `make test-e2e-mvp2-live` | MVP-2 DoD | 双服 live；诚实断言 |
| `make test-e2e-mvp3-live` | MVP-3 DoD | chat + history live |
| `make test-e2e-mvp4-live` | MVP-4 DoD | sort + reshuffle + chat resize/rich live |
| `make lint` / typecheck | 每 PR | `tsc --noEmit` |
| Coverage | 可测时 | 关键路径 100%；整体 ≥80% |

失败阻塞合并。不得 skip auth、Decide、chat 持久化测试换绿。

---

## §8 探针 pin 与诚实性矩阵

运营探针（示例 — 签收时写入 retrospective）：

| 区域 | Pin / 区域 | 期望 primary provider |
| --- | --- | --- |
| EN | Clerkenwell, London | `GOOGLE_MAPS` |
| CN | 杭州（或大陆探针） | `AMAP` |

**诚实性矩阵（what2eat 层）：**

| 路径 | Live 依赖 | Fast CI | Live probe | MVP | 最近 live pass |
| --- | --- | --- | --- | --- | --- |
| Register / login / profile | App DB | Vitest + E2E | 真实登录 | MVP-1 | 2026-08-19 |
| Decide → 卡片 | `search_restaurants` | 注入 HTTP | `test-e2e-mvp2-live` | MVP-2 | 2026-08-20 Clerkenwell |
| Place details | `get_place_details` | 注入 | 同上 | MVP-2 | 2026-08-20 |
| Save / unsave | App DB | Vitest + E2E | live 旅程 | MVP-2 | 2026-08-20 |
| List chat | `POST /v1/chat` | 注入 | `test-e2e-mvp3-live` | MVP-3 | 2026-08-20 Clerkenwell |
| Place chat | `POST /v1/chat` | 注入 | 同上 | MVP-3 | 2026-08-20 Clerkenwell |
| Reload hydrate (`/api/decide/current`) | App DB (`SearchCache`) | `decide-current.test.ts` | 同上（reload 步骤） | MVP-3 | 2026-08-20 |
| History | App DB | Vitest + E2E | live 旅程 | MVP-3 | 2026-08-20 Clerkenwell |
| Sort + reshuffle | search + cache | unit + `/api/decide/sort` | `test-e2e-mvp4-live` | MVP-4 | 2026-08-20 |
| Chat resize (`chat-02`) | 组件 + Playwright | composer 贴底；`agent-chat-resize`；min 22.5×28rem | `test-e2e-mvp4-live` | MVP-4 | 2026-08-20 |
| Rich chat (`chat-03`) | 组件 + BFF + Playwright | `blocks[]` hydrate pick card；`target="_blank"`；legacy `content` 降级 | `test-e2e-mvp4-live` | MVP-4 | 2026-08-20 |
| Pending + place scroll (`chat-04`) | 组件 + Playwright | `chat-pending` 在 busy 时出现；place transcript 溢出可滚；composer 可见 | `test-e2e-mvp4-live` | MVP-4 | 2026-08-20 |
| Price display (`decide-09`) | 组件 + live | 有 `price_level` 显示 band；无则 unavailable；详情事实行 | `test-e2e-mvp4-live` | MVP-4 | 2026-08-20（UI + agent；见 price-level-live） |
| Location draft (`decide-10`) | 组件 + Playwright | 改地区后切 locale，`decide-location` 值不变；profile 默认不覆盖 touched | `test-e2e-mvp4-live` | MVP-4 | 2026-08-20 |
| Criteria drafts (`decide-11`) | 组件 + Playwright | 改 meal/budget/craving 后切 locale，值不变 | `test-e2e-mvp4-live` | MVP-4 | 2026-08-20 |
| Persist panel size (`chat-05`) | 组件 + Playwright | resize 后 reload，面板尺寸恢复 | `test-e2e-mvp4-live` | MVP-4 | 2026-08-20 |

Agent 层 live 探针细节见 [`../../1.places-agent/agent-specs/4.test-strategy.md`](../../1.places-agent/agent-specs/4.test-strategy.md) 与 [`8.user-test-cases.md`](../../1.places-agent/agent-specs/8.user-test-cases.md) — 此处不重复 TC 明细。

---

## §9 TDD 与 AC 映射

1. 从 [`2eat-stories.md`](./2eat-stories.md) 取**一条** user story（incremental delivery）。
2. 每条 AC：**Red**（可观测 Then）→ **Green** → **Refactor**。
3. 命名：`should_[expected]_when_[condition]`。

| Story 区域 | 主层 | DoD 需 live？ |
| --- | --- | --- |
| Shell、home、i18n、footer | 组件 + Playwright | MVP-1：仅真实 app |
| Account、profile | 集成 + Playwright | MVP-1：真实 DB |
| Decide、place、saved | 单测 + BFF + Playwright | MVP-2：**是** |
| Chat | 集成 + Playwright | MVP-3 基线：**是**；MVP-4 resize/rich：**是** |
| History | 集成 + Playwright | MVP-3：需 live Decide 前置 |
| Sort | 单测 + BFF + Playwright | MVP-4：**是** |

---

## §10 失败处理

修生产代码或错误测试；不得删/ skip AC 测试换绿。反模式：硬编码卡片、仅用单测签 MVP-2、DB 存 chat、把 `make test` fixture 绿当作 live 诚实。
