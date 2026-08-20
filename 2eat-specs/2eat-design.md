# what2eat — 设计规范

**what2eat**（`what2eat.food`）视觉、技术架构与页面契约。产品边界见 [`2eat-prod-specs.md`](./2eat-prod-specs.md)；用户故事与 AC 见 [`2eat-stories.md`](./2eat-stories.md)；测试见 [`2eat-test-plan.md`](./2eat-test-plan.md)。家族架构摘要见 [`../../workspace-specs/2.architecture.md`](../../workspace-specs/2.architecture.md)（thin client、同源 BFF、ADR-001/002）。

**冲突优先级：** 与 [`ui-mockup/`](./ui-mockup/) + `mockup.css` 冲突时，**以 mock 为准**。`index.html`、`10-why.html` 非产品路由。

---

## §1 视觉与交互

### 1.1 产品气质

**野餐布 + 蒸汽碗。** 平静、放松：坐下后的片刻，不是配送冲刺，也不是 spa 薄荷圆点。

个性集中在：**柔和格子布** + **煎蛋 mark + 蒸汽**。卡片如 placemat；其余保持安静 — 无 01/02/03 编号、无细线 broadsheet、无黑底 acid-green operator 风。places-agent 管理台刻意性冷淡；消费者选餐 UI 不得像发 key 的控制台。

| 应当 | 禁止 |
| --- | --- |
| 大圆角、双色布、主按钮仅用 citrus | places-agent token（`#fafafa`、radius 0、全站 mono 大写眉） |
| 匹配度用**文字标签** +  calm chip | 仅靠颜色的红绿灯 |
| 短名单（约 3–5 张卡）、原地 reshuffle | 无限 feed、浏览器内 map vendor  chrome |
| Locale `EN CN HK TW` 全 shell | 仅 中文/EN 二选一 |
| 空态/错误说明该改什么 | 模糊道歉、整页空白 |

### 1.2 Design tokens

```css
--cloth-a: #dcefe6;
--cloth-b: #fff7ec;
--ink: #243832;
--ink-2: #3a524c;
--mute: #5c726b;
--glaze: #2a7a68;
--glaze-deep: #1f5c4f;
--zest: #e9a825;
--blossom: #f4c4ce;
--plate: #fffdf8;
--line: #c9ddd4;
--alert: #b6542a;
--danger: #9b2c2c;
--fit-strong-bg: #d8efe6;
--fit-partial-bg: #f8e8c4;
--fit-weak-bg: #f8d9d0;
--radius-bowl: 1.75rem;
--radius-chip: 999px;
--radius-control: 0.85rem;
--control-h: 2.75rem;
--font-display: "Fredoka", system-ui, sans-serif;
--font-ui: "Figtree", system-ui, sans-serif;
--font-mono: "IBM Plex Mono", ui-monospace, monospace;
--max-app: 72rem;
--max-auth: 26rem;
```

CJK：**獅尾腿圓**。`CN` → 簡體；`HK`/`TW` → 繁體（独立目录，ADR-011）。`logo-word` 保持 Fredoka。

### 1.3 Shell 与导航

| Shell | 路由 | Chrome |
| --- | --- | --- |
| 公开首页 | `/` | 居中列，无 app nav；CTA 有 session 则 `/decide`，否则 register/login |
| Auth | register / login / reset / set-password | 窄列 `--max-auth`；family footer 与页面布无缝 |
| App | decide / profile / saved / history | Sticky header；问候 + avatar + locale + 登出 |

**App 导航（i18n key）：** `eat.nav.decide` · `eat.nav.profile` · `eat.nav.saved`；History 从 Saved 工具栏进入（`eat.nav.history`），非第四顶栏项。

**places.family footer：** 单行 `places.family:` · where2play（新标签）· what2eat.food（当前，非链接）· places.agent-mate.ai（新标签）· copyright。公开页透明无底边；App 页 `.family-footer--app` 与 header 同底纹。**Footer 拉丁字体固定 12px**，换 locale 不改变 mark 尺寸。

### 1.4 组件要点

- **Header：** mark + 导航 + `eat.header.hello` + 圆形 avatar（有 photo 则缩略图）+ locale（10.5rem 四等分）+ Logout（min-width 5.75rem）。
- **按钮：** Primary（glaze）· Quiet（plate+边框）· Danger outline · Text link。
- **字段错误：** `.field.is-invalid` + `.field-error` + `role="alert"`；控件背景保持 `--plate`。Email 唯一性冲突仅标在 email 字段。
- **Pick card：** 名称、评分、`sources[]`（mono、不翻译）、类型、地址、**仅 fit badge**、步行/警告、Details + Open map（或 Unsave）。菜系/Why 在详情对话框。
- **详情对话框：** 事实 + Why + Also nearby + 详情 chat + Open map + Save/Unsave。Why 无独立全页。
- **列表 chat：** Decide 右下角 FAB；transcript **仅 localStorage**；BFF 不落库。
- **空态/部分失败：** 空态引导放宽条件；`eat.decide.partial_banner` 诚实命名被 skip 的 provider，且不得与卡片上 provider 矛盾。

### 1.5 i18n 与 a11y

- 全部用户可见字符串为 key；locale：`EN` / `CN` / `HK` / `TW`。
- 协议 id（`AMAP`、`GOOGLE_MAPS`）不翻译；vendor 店名/地址 Layer B 原样展示。
- Skip link、`focus-visible`、对话框 Escape/ backdrop、触摸目标 ≥44px；fit/ready 不得仅靠颜色。

### 1.6 动效

蒸汽曲线、卡片 hover 微抬、对话框 180ms 淡入；`prefers-reduced-motion: reduce` 关闭循环动画。

---

## §2 技术架构

### 2.1 目标与非目标

| 目标 | 非目标 |
| --- | --- |
| Thin client + 同源 BFF | 浏览器调 MCP / 持有 map key |
| BFF HTTP 调 places-agent | 生产硬编码餐厅列表 |
| Chat → `POST /v1/chat`；历史 localStorage | 服务端 chat 持久化 |
| 四 locale 独立 catalog | OpenCC；HK↔TW 共文件 |
| MVP 分片可独立交付 | dismiss / cool-off |

```text
Browser → what2eat /api/* → places-agent /v1/*
Browser localStorage ← list/place chat
App DB ← users, profile, saved, history（无 chat 表）
```

职责划分详见 [`2eat-prod-specs.md`](./2eat-prod-specs.md) 与 [`../../workspace-specs/2.architecture.md`](../../workspace-specs/2.architecture.md)。

### 2.2 技术栈

与家族锁定版本一致：[`../../workspace-specs/3.tech-specs.md`](../../workspace-specs/3.tech-specs.md)。实现目录 `2.what2eat/`。

| 类别 | 选型 |
| --- | --- |
| Next.js App Router 16.3 · React 19.2 · TS 7.0 | 页面 + BFF Route Handlers |
| Tailwind 4.3 · TanStack Query · Zustand · RHF + Zod | UI 与表单 |
| Prisma + **PostgreSQL**（ADR-023） | 用户、口味、收藏、历史 |
| Resend | 重置密码邮件 |
| Vitest + Python Playwright | 单测/契约 + E2E |
| places-agent `fetch` 客户端 | **无** MCP、**无** 浏览器 Quanzil |

入口：`next dev` / standalone `node server.js`（非 places-agent 式 `server.ts`）。

### 2.3 BFF 路由表

| 路径 | 方法 | 职责 |
| --- | --- | --- |
| `/api/auth/*` | POST | 注册、登录、登出、重置/设置密码 |
| `/api/profile/personal` | GET/PUT | 个人信息 |
| `/api/profile/tastes` | GET/PUT | 口味与约束 |
| `/api/decide/search` | POST | geocode + search + 匹配 → 短名单 DTO |
| `/api/decide/current` | GET | 读取未过期 SearchCache，刷新后恢复 Decide 列表与表单 criteria |
| `/api/decide/reshuffle` | POST | 分页或 **reshuffle**（重查 vendor） |
| `/api/decide/sort` | POST | 对缓存全量列表排序后分页 |
| `/api/places/[source]/[nativeId]` | GET | 详情 + why DTO |
| `/api/saved` | GET/POST/DELETE | 收藏 CRUD |
| `/api/history` | GET/POST | 决策历史 |
| `/api/chat` | POST | 无状态转发 `POST /v1/chat`；响应 **rich blocks**（chat-03）或 legacy `content` |
| `/api/geocode/reverse` | POST | 反向 geocode（profile/Decide 默认位置） |

Mutating 路由：session + CSRF。Caller key 仅服务端 env。

### 2.4 Decide 流程

1. 加载用户 `TasteProfile`。
2. 必要时 geocode（agent）。
3. `search_restaurants`，`providers[]` 由 BFF 按区域设定（大陆 `["AMAP","GOOGLE_MAPS"]`；海外 `["GOOGLE_MAPS"]` + 可选 Tripadvisor enrich，ADR-005）。
4. BFF：`rankPicks`（fit → **大陆 AMAP 优先** → rating → vendor tie-break → name）、步行分钟、警告、why reason keys。
5. 缓存 canonical rank 序、`sort` 模式、时间戳；**排序在分页前服务端完成**。
6. 返回页 slice + `partialBanner`（基于 `skipped[]` 与**全部** picks，非仅当前页）。
7. **刷新恢复：** mount 时 `GET /api/decide/current` 读取未过期 cache（见 ADR-027）；URL query 优先于 cache criteria。

**Sort 模式：** `rank`（默认）· `rating` · `distance` · `price`（agent `price_level`，缺失排末尾）。

**Reshuffle：** 同条件重新 `search_restaurants`；忽略当前 sort，重置为 `rank`；更新 `updatedAt`。

**Chat：** BFF 组装 list/place context → agent → 客户端 append 到 `w2e.chat.list.{searchId}` / `w2e.chat.place.{source}:{nativeId}`；登出清除 `w2e.chat.*`。Assistant 回复以 **ChatBlock[]** 渲染（§3.6）；list 面板可拖拽 resize（§3.5）。

### 2.5 数据模型（App DB）

| 实体 | 要点 | MVP |
| --- | --- | --- |
| `User` | email、密码、姓名、性别、年龄、photo、defaultLocation、defaultLat/Lng | 1 |
| `TasteProfile` | likes/dislikes、spice、party、constraints、meal contexts | 1 |
| `SavedPlace` | vendor id + snapshot json | 2 |
| `DecisionHistory` | 快照、区域、meal context、went | 3 |
| `PasswordResetToken` | 哈希 token、过期 | 1 |

**无表：** chat transcript、dismiss/cool-off。

### 2.6 模块布局

```text
2.what2eat/
  app/(routes)/ + app/api/
  src/core/          preference-match, sort-picks, partial-banner, vendor-priority, meal-contexts
  src/places-agent/  client.ts, types.ts
  src/auth/ src/i18n/ src/db/ src/chat/local-storage.ts
  messages/{EN,CN,HK,TW}.json
  tests/  e2e/
```

依赖方向：`app/api` → `core` + `places-agent/client` → `db`；`core` 不 import Next。

### 2.7 环境变量（名称）

完整列表见 [`../.env.example`](../.env.example) 与 [`2eat-deployment-plan.md`](./2eat-deployment-plan.md)。what2eat **不含** `OPENAI_*`、`AMAP_*`、`GOOGLE_MAPS_*` 等 map vendor 密钥。

| 变量 | 用途 |
| --- | --- |
| `PORT` | 本地 **3020**（非 3010） |
| `DATABASE_URL` | PostgreSQL |
| `SESSION_SECRET` | Session cookie |
| `PLACES_AGENT_BASE_URL` / `PLACES_AGENT_CALLER_KEY` | MVP-2+ BFF → agent |
| `RESEND_*` / `FEATURE_EMAIL` | MVP-1 邮件 |

### 2.8 MVP 实现顺序

与 [`2eat-stories.md`](./2eat-stories.md) 一致：MVP-1 账号/profile → MVP-2 Decide+详情+收藏 → MVP-3 chat+历史 → **MVP-4（收尾）** 排序+reshuffle + chat resize/rich/pending/scroll + 价格 + Decide 条件草稿 + chat 尺寸持久化。

---

## §3 页面契约

像素级 DOM/HTML 以 [`ui-mockup/`](./ui-mockup/) 为真源。下表为路由与测试/Story 索引。

| 路由 | Mock | 主要区块 | 关键 `data-testid` | Story |
| --- | --- | --- | --- | --- |
| `/` | `01-home.html` |  headline、mini stack、CTA | — | home-01, footer-02, i18n-01 |
| `/register` | `02-register.html` | 双列表单 + 圆形 photo | `register-submit` | account-01 |
| `/login` | `03-login.html` | email/password | `login-submit` | account-02 |
| `/reset-password` | `04-reset.html` | 发信 / sent callout | — | account-03 |
| `/set-password` | `05-set-password.html` | 新密码 / 过期态 | — | account-04 |
| `/decide` | `06-decide.html` | 搜索区、结果头、sort、卡 grid（含价格档）、分页、partial banner、FAB chat | `agent-chat-open`, `agent-chat-close`, `agent-chat-resize`, `chat-agent-msg`, `chat-pending`, `chat-pick-card`, `pick-price`, `decide-location`, pick 卡上 `data-open-dialog` | decide-01–11, chat-02–05, place-01–04, header-*, footer-01 |
| `/profile` | `07-profile.html` | 个人信息卡 + 口味卡（分 save） | — | profile-01, profile-02 |
| `/saved` | `08-saved.html` | pick grid、空态 | — | saved-01, saved-02 |
| `/history` | `09-history.html` | Went 行、再跑 Decide；header Saved active | — | history-01 |

### 3.1 Decide 布局要点

- **搜索表单：** area/pin · meal context（preset key + 自定义文本，见 `meal-contexts`）· budget per person · craving · `Find restaurants`。
- **地区草稿（decide-10）+ 其他条件草稿（decide-11）：** 输入框值按 **URL → sessionStorage 草稿 → SearchCache criteria → profile/default（仅 virgin）** 填充；切 locale / `router.refresh()` 不得用默认覆盖已输入内容。键：`w2e.decide.draft.location|meal|budget|craving`。[ADR-029](../../workspace-specs/adr/ADR-029-decide-criteria-draft-hydrate.md)。
- **结果头：** `Results (last updated {time})` · **Sort** 控件（`eat.decide.sort.*`：rank / rating / distance / price）· **Reshuffle** · `{shown}–{end} of {total}`。
- **Partial banner：** 当某 provider skip 时显示；文案须与仍展示的卡片 provider 一致（decide-06 AC）。
- **Sort（decide-08）：** 换 sort 重置到第 1 页；新 Find restaurants 重置为 By rank；大陆默认 rank 下相同 fit 时 **AMAP 优先于 GOOGLE_MAPS**。

### 3.2 Profile 布局要点

- 两卡独立保存：personal（含 optional photo）· tastes（chip 存 option id、constraints、meal contexts）。
- 保存成功：`.callout.is-info` 出现在**该表单** submit 上方，非页顶。

### 3.3 详情对话框

- `data-testid="details-close"` · `details-unsave`（Saved 场景）。
- 面板：Place facts · Why + Also nearby · place chat · Open map · Save/Unsave。
- 无 vendor hours 时诚实占位，不编造。

### 3.4 非产品路由

| 文件 | 说明 |
| --- | --- |
| `ui-mockup/index.html` | 评审画廊 |
| `10-why.html` | 重定向 stub；Why 仅在详情对话框（place-02） |

### 3.5 List chat 面板（`chat-02`）

**布局（flex column，消除 composer 下方空白）：**

```text
┌ agent-chat__panel (resizable) ─────────────┐
│ [NW grip]  header: title + context · close │
├────────────────────────────────────────────┤
│ transcript (flex:1; overflow:auto)         │
│   user bubble / agent rich message         │
├────────────────────────────────────────────┤
│ composer (flex-shrink:0)  [input] [Send]   │
└────────────────────────────────────────────┘
```

| Token | 值 | 说明 |
| --- | --- | --- |
| 默认宽 | `22.5rem` | 与现网 mock 一致 |
| 默认高 | `28rem` | 面板总高（含 header） |
| min 宽/高 | 同默认 | 不可小于当前尺寸 |
| max 宽 | `min(36rem, 100vw - 2rem)` | |
| max 高 | `min(42rem, 100vh - 2rem)` | |
| 定位 | `fixed; right/bottom: 1.25rem` | 右下角锚定；从左上角拖拽改宽高 |

**Resize（白话）：** 用户按住面板**左上角**把手拖动，窗口可变大或变小（向左/上拖 → 变大；向右/下拖 → 变小，直至下限）。面板右下角固定在屏幕角落。实现为 **自定义 pointer 拖拽**。

**NW grip 可见性（必须能一眼认出，且克制好看）：**

| Token | 值 |
| --- | --- |
| 热区 | ≥ `2rem × 2rem`（透明，易点） |
| 外观 | **无方钮描边**；仅左上角 **三条平行斜握纹**（glaze-deep），像餐巾一角的折痕 |
| 默认 | 握纹清晰可见（opacity ~0.85），不依赖 hover 才出现 |
| 悬停 | 握纹略加深、间距微扩；`cursor: nwse-resize` |
| 焦点 | `focus-visible` 圆角 outline 包住热区 |
| 测试 | `data-testid="agent-chat-resize"`；`eat.a11y.chat_resize` |
| Header | 左侧 padding ≥ `2.25rem`，标题不压住握纹 |

**不做：** 绿色小方块按钮、半透明细斜线、装饰性 L 角标叠阴影（上一版已否）。

**不**在 chat-02 强制持久化；**chat-05** 将宽高写入 `localStorage`（键如 `w2e.chat.panelSize`），刷新后恢复；仍受 min/max 约束。登出时建议与 transcript 一并清除。

**Place chat（详情内）：** 同样 transcript + bottom composer；**不**拖拽 resize。chat 盒高度受约束（§3.7）；`.place-why-chat__transcript` 内滚动。

### 3.6 Rich assistant 回复（`chat-03`）

**目标：** 助手消息由可扫读的 block 列表组成，pick 推荐带真实缩略图与地图外链（新标签页）。

**ChatBlock 类型（TypeScript 契约）：**

| type | 字段 | 渲染 |
| --- | --- | --- |
| `paragraph` | `text` | `<p>` |
| `heading` | `level: 2\|3`, `text` | `<h3>` / `<h4>` |
| `list` | `items: string[]` | `<ul><li>` |
| `pick_ref` | `provider`, `nativeId`, `note?` | **pick card** — BFF hydrate 后含 `name`, `photoUrl?`, `rating?`, `category?`, `mapUrl` |
| `link` | `label`, `href` | `<a target="_blank" rel="noopener noreferrer">` |

**API 响应（`POST /api/chat`）：**

```json
{
  "reply": {
    "role": "assistant",
    "blocks": [
      { "type": "paragraph", "text": "..." },
      {
        "type": "pick_ref",
        "provider": "GOOGLE_MAPS",
        "nativeId": "ChIJ…",
        "note": "4.0 · Japanese · quiet for groups"
      }
    ],
    "fallbackText": "Plain summary for a11y"
  }
}
```

Legacy：`content: string` only → 客户端包一层 `{ type: "paragraph", text: content }`。

**Hydrate 规则：** BFF 在返回前对 `pick_ref` 查当前 list `picks[]`（list scope）或 place snapshot（place scope）；填充 `photoUrl` / `rating` / `mapUrl`（`pickMapUrl`）；缺失则 omit 该 card 的图片或整条降为 `paragraph`。

**Agent 侧（已定）：** places-agent `/v1/chat` 在 system prompt 中要求输出 **JSON `blocks[]`**（非自由 Markdown）。what2eat BFF 校验 schema → hydrate `pick_ref` → 返回前端。若模型偶发只回纯文本，BFF 降级为单段 `paragraph`（legacy 兼容）。**不做** Markdown 解析路径。Mock-up 以 **hydrated pick card HTML** 为展示真源。

**卡片动作：** pick card 仅含缩略图、店名、meta、「在地图中打开」；**不**加「详情」进 place dialog（用户仍从 Decide 列表卡打开详情）。

**安全：** 渲染器禁止 `dangerouslySetInnerHTML`；链接 scheme 白名单 `https:`；`pick_ref` 不得含任意 URL 字段（仅 BFF 注入 `mapUrl`）。

**i18n：** 标签 `eat.why.kind_model`、按钮 `eat.chat.open_maps`、grip `eat.a11y.chat_resize`；block 内模型文本不硬编码英文为唯一 locale。

**localStorage：** transcript 存 `{ role, blocks, fallbackText? }[]`；读取时兼容 legacy `{ role, content }`。

### 3.7 Chat pending + place scroll（`chat-04`）

**原则：** List chat（右下角面板）与 Place chat（详情内）使用**同一套** pending 视觉与组件，避免两套等待态。

**签名元素：** 助手侧「釉点三点」脉冲 — 与 what2eat 的 glaze 圆点语言一致（非通用灰色 typing bar）。

**状态机：**

```text
idle → (user send) → pending → (ok) assistant bubble
                           ↘ (fail) error bubble
```

**视觉（list = place）：**

```text
┌ transcript ─────────────────────────────────┐
│  [user bubble]                              │
│  [assistant rich / plain]                   │
│  ┌ pending ─────────────────────────────┐   │
│  │  ● ● ●   助手正在回复…                 │   │  ← 左对齐，与 assistant 同侧
│  │  (无「模型建议」标签 — 尚未成文)        │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
│ composer: input disabled · Send disabled      │
```

| Token | 值 |
| --- | --- |
| 容器 | `.bubble.is-pending`（复用 bubble 底色 `--cloth-a`，略降对比） |
| 文案 | `eat.chat.pending`（EN / CN / HK / TW） |
| 测试 id | `chat-pending` |
| a11y | transcript 或 pending 节点 `aria-busy="true"`；文案可读，三点 `aria-hidden` |
| 动效 | 三点错相脉冲 ~1.1s；`prefers-reduced-motion: reduce` → 静态三点 + 文案 |
| 生命周期 | 请求发出时插入并滚到底；响应到达（成功/失败）**立即**移除，再 append 正式消息 |

**List chat：** 面板高度已固定（chat-02）；pending 落在 transcript 末尾，不改变面板外尺寸。

**Place chat 盒高度（防对话框被撑高）：**

```text
┌ place-why-chat (max-height: min(22rem, 48vh)) ──┐
│ label                                             │
│ transcript (flex:1; overflow:auto; min-h: 5.5rem) │
│ composer (flex-shrink:0)                          │
└───────────────────────────────────────────────────┘
```

- 详情对话框仍可整体 `overflow: auto`（事实区很长时）
- 新消息 / pending 追加后 `scrollTop = scrollHeight`

**Mock：** `06-decide.html?open=chat&pending=1`（list）· `?open=details&pending=1`（place）

### 3.8 价格展示（`decide-09`）

**Agent 前提（已 live 确认 2026-08-20）：** `search_restaurants` 卡片可带 `price_level`；AMAP 常带 `price_per_person`。覆盖非 100% — UI 必须诚实缺失。探针：[`price-level-live.md`](../../workspace-specs/knowledge/maps/price-level-live.md)。

| 表面 | 有 `price_level` | 无 |
| --- | --- | --- |
| Pick card | `eat.card.price` + band；可选 `eat.card.price_per_person` | `eat.card.price_unavailable` |
| Place details facts | `eat.details.price` 行 + band（+ 可选人均） | 同 hours：`is-missing` + unavailable |

- **不**在客户端把预算文本反推成 `$$`
- `price_per_person` 仅透传 agent 数值；格式用 locale number（元单位文案在 key 内）
- Sort **By price** 继续用 `priceLevel`（decide-08）
- BFF：`PlaceCard.price_level` → `PickDto.priceLevel`；实现 decide-09 时补 `price_per_person` 透传

---

## 相关文档

| 文档 | 角色 |
| --- | --- |
| [`2eat-prod-specs.md`](./2eat-prod-specs.md) | 产品边界 |
| [`2eat-stories.md`](./2eat-stories.md) | AC |
| [`2eat-test-plan.md`](./2eat-test-plan.md) | 质量门 |
| [`2eat-deployment-plan.md`](./2eat-deployment-plan.md) | 部署 |
| [`../../1.places-agent/agent-specs/`](../../1.places-agent/agent-specs/) | Agent HTTP 契约 |
| [`../../workspace-specs/6.deployment-plan.md`](../../workspace-specs/6.deployment-plan.md) §0 | 端口注册 |
