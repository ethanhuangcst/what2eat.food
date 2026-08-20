# what2eat — 部署计划

**what2eat 专属**部署输入。家族总览、端口注册 §0、NPM/Portainer 通用流程见 [`../../workspace-specs/6.deployment-plan.md`](../../workspace-specs/6.deployment-plan.md) 与 [`../../0.2.release-bot/`](../../0.2.release-bot/)。release-bot 逐步操作见 `0.2.release-bot/knowledge/03-semi-auto-release.md`。

**密钥：** 本文与 git 仅列 env **名称**；值在 Portainer / 运营密钥库。

| 相关 | 位置 |
| --- | --- |
| 技术栈与 BFF | [`2eat-design.md`](./2eat-design.md) §2 |
| 测试 / MVP DoD | [`2eat-test-plan.md`](./2eat-test-plan.md) |
| 家族技术锁定 | [`../../workspace-specs/3.tech-specs.md`](../../workspace-specs/3.tech-specs.md) |
| Env 名称目录 | [`../.env.example`](../.env.example) |

---

## 0. Meta

| 字段 | 值 |
| --- | --- |
| 产品 | what2eat — thin Next.js 消费者 Web + 同源 BFF |
| App repo | `ethanhuangcst/what2eat.food` |
| 本地目录 | `2.what2eat/` |
| 目标节点 | **野草云3** · `38.55.192.140`（[`hk_vps_3_setting.md`](../../0.2.release-bot/svr_hk_vps_3/hk_vps_3_setting.md)） |
| **本地 dev** | **`PORT=3020`** · `PUBLIC_BASE_URL=http://localhost:3020` — **非** `:3010`（places-agent） |
| **Prod host debug** | **`3004→3000`**（部署前确认端口空闲） |
| Stack | **`what2eat`** · 容器 **`what2eat-web`** |
| 公网域名 | **`what2eat.food`** |
| 镜像 | `ghcr.io/ethanhuangcst/what2eat.food/web:${IMAGE_TAG}` |
| 网络 | 外部 **`portainer_network`**（勿删勿重建） |
| 上游 | places-agent 已 live（`https://places.agent-mate.ai`）；需为 `what2eat.food` 签发 **caller API key** |

### Blockers（app repo 就绪前勿 Portainer 部署）

| 产物 | 状态 |
| --- | --- |
| Next app + BFF（`2.what2eat/`） | **Has**（同步至 GitHub repo 后再 GHCR） |
| `Dockerfile`（standalone + migrate on boot） | **Blocker** |
| `docker-compose.prod.yml` | **Blocker** |
| `.github/workflows/ghcr.yml` | **Blocker** |
| `.env.prod.example` | **Blocker** |
| `docker-compose.dev.yml`（Postgres `:5435`） | **Has** |
| `Makefile` `dev`/`up`/`down` | **Has** |
| `2eat-specs/` | **Has** |

**上游门禁：** BFF `search_restaurants` 须 **live-honest**（ADR-021）。`portainer_network` 内 BFF 可用 `PLACES_AGENT_BASE_URL=http://places-agent:3000`。

---

## 1. 运行时架构

```text
[浏览器]
  → Cloudflare（LE 前 grey cloud）
  → NPM :443
  → what2eat-web:3000（stack what2eat）
       → PostgreSQL what2eat @ 101.132.156.250:5432（Aliyun，非 VPS 内）
       → HTTPS → places-agent（Bearer PLACES_AGENT_CALLER_KEY）
       → Resend（重置密码）
Browser localStorage ← chat（永不进 DB）
```

| 项 | 选择 |
| --- | --- |
| 容器数 | **1** — `what2eat-web` |
| 进程内 | Next 页面 + `/api/*` Route Handlers |
| **不在此镜像** | Map vendor、MCP、agent 管理 UI、产品侧 `OPENAI_*` |
| Chat LLM | places-agent `POST /v1/chat`（ADR-020） |

### 公开面

| 表面 | NPM 公开？ | 认证 |
| --- | --- | --- |
| `/`, `/register`, `/decide`, … | 是 | Session（登录后路由） |
| `/api/*` | 是（同源） | Session + CSRF（变更） |
| Host `3004→3000` | 仅 debug | 非主路径 |
| Aliyun Postgres | **否** | Portainer secret |
| `PLACES_AGENT_CALLER_KEY` | **永不** 进浏览器/git | Portainer only |

### 持久化

| 数据 | 存储 |
| --- | --- |
| Users、tastes、saved、history | **PostgreSQL** + Prisma（ADR-023） |
| Prod `DATABASE_URL` | `…@101.132.156.250:5432/what2eat` |
| Local | `postgresql://what2eat:what2eat@localhost:5435/what2eat` |
| Chat | **localStorage only** — 无卷 |
| 启动 | entrypoint：`prisma migrate deploy` → `node server.js` |

---

## 2. 服务表

| Service | 镜像 | 容器端口 | Host debug | NPM Forward |
| --- | --- | --- | --- | --- |
| web | `ghcr.io/.../web:${IMAGE_TAG}` | **3000** | **3004** | `http://what2eat-web:3000` |

勿占用 **3007**（places-agent）。端口全表见 [`../../workspace-specs/6.deployment-plan.md`](../../workspace-specs/6.deployment-plan.md) §0。

---

## 3. 镜像与 CI

- **构建：** GitHub Actions（非节点上 build）
- **标签：** `latest` + git sha + `v*`
- **Dockerfile：** Next 16 standalone；`npm ci` → `prisma generate` → `next build`
- **不含：** Playwright、MCP SDK、map SDK、`openai` SDK

Pull：**Recreate + Pull**（仅 Update 可能不拉新 `latest`）。

---

## 4. 环境变量（名称）

模板：[`../.env.example`](../.env.example) → 落地 `.env.prod.example`（无密钥值）。

### 必需

| 名称 | MVP | 说明 |
| --- | --- | --- |
| `APP_NAME` | all | `what2eat` |
| `APP_ENV` / `NODE_ENV` | all | `production` |
| `PORT` | all | 容器内 **3000** |
| `HOSTNAME` | all | `0.0.0.0` |
| `DATABASE_URL` | all | PostgreSQL（见上） |
| `SESSION_SECRET` | all | ≥32 随机字节 |
| `PUBLIC_BASE_URL` / `APP_URL` | all | `https://what2eat.food` |
| `PLACES_AGENT_BASE_URL` | MVP-2+ | 节点内 `http://places-agent:3000` 或公网 smoke URL |
| `PLACES_AGENT_CALLER_KEY` | MVP-2+ | places-agent admin 签发 |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | MVP-1 | `FEATURE_EMAIL=true` 时 |
| `IMAGE_TAG` | deploy | GHCR 已发布 tag |

### 可选

| 名称 | 说明 |
| --- | --- |
| `PLACES_AGENT_TIMEOUT_MS` | 默认 25000 |
| `W2E_DEFAULT_PROVIDERS` | JSON，如 `["GOOGLE_MAPS"]` |
| `W2E_ENRICH_TRIPADVISOR` | `true` / `false` |
| `TEST_DATABASE_URL` | 本地/CI 隔离库 |

### 禁止在此栈

`OPENAI_*`、`AMAP_*`、`GOOGLE_MAPS_*`、`GMAPS_MCP_*`、`TRIPADVISOR_*`、`NEXT_PUBLIC_PLACES_AGENT_*` — 均在 places-agent 或浏览器外。

---

## 5. 本地开发与联调

```text
Terminal A: cd 1.places-agent && make dev     # :3010
Terminal B: cd 2.what2eat && make up          # Postgres :5435 + app :3020
```

`.env.local` 示例（名称见 `.env.example`）：

- `DATABASE_URL=postgresql://what2eat:what2eat@localhost:5435/what2eat`
- `PLACES_AGENT_BASE_URL=http://localhost:3010`
- `PLACES_AGENT_CALLER_KEY=<places-agent admin 签发>`

MVP-2 DoD：agent `PLACES_VENDOR_MODE=live`。`make down` 停止 compose + app。

---

## 6. DNS 与 TLS

| 项 | 值 |
| --- | --- |
| Zone | `what2eat.food` |
| Apex A | `38.55.192.140` |
| Cloudflare | LE 成功前 **grey cloud** |
| NPM | Forward `what2eat-web:3000`；Force SSL |

---

## 7. 部署后 Smoke

顺序：migrate 健康 → 容器 up → DNS → NPM → HTTPS。

**MVP-1：** 首页、注册→profile→登出→登录、locale EN→HK、HTML 无 ClickFix IOC。

**MVP-2（产品 live）：** agent health；Decide **live** 卡片（无 `fixture_`）；详情 + Open map 无 key；收藏/取消收藏；[`2eat-test-plan.md`](./2eat-test-plan.md) §3。

**MVP-3：** 列表/详情 chat 真实回复；刷新后 localStorage 仍在、登出清除；Postgres 无 chat 行；History。

每轮 spot-check ≥1 既有 app（如 `places.agent-mate.ai/v1/health`）。

---

## 8. 隔离与运维要点

- Stack/容器/DB 名均为 **`what2eat`**；勿用 kb/mypoke 等库名。
- **`portainer_network`** 勿重建；勿改其他 NPM host。
- Schema 变更前 **pg_dump `what2eat`**；镜像回滚不还原 DB。
- `IMAGE_TAG` 仅用已发布 GHCR tag — 非分支名 `main`。
- MVP-1 可无 caller key 做 auth smoke；**不得**在无 live agent 探针时声称 MVP-2 done。

---

## 9. 交叉链接

| 文档 | 角色 |
| --- | --- |
| [`../../workspace-specs/6.deployment-plan.md`](../../workspace-specs/6.deployment-plan.md) | 家族三栈与端口 §0 |
| [`../../workspace-specs/2.architecture.md`](../../workspace-specs/2.architecture.md) | 信任拓扑 |
| [`2eat-design.md`](./2eat-design.md) | BFF、env、模块 |
| [`2eat-test-plan.md`](./2eat-test-plan.md) | Live DoD |
| `0.2.release-bot/svr_hk_vps_3/places.family/what2eat-instruction.md` | release-bot job |
