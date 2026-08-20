# what2eat 规格文档

**what2eat**（`what2eat.food`）产品规格，位于 monorepo `2.what2eat/2eat-specs/`。

## 阅读顺序

| 顺序 | 文档 | 用途 |
| --- | --- | --- |
| 1 | [2eat-prod-specs.md](./2eat-prod-specs.md) | 产品定位、边界、功能域 |
| 2 | [2eat-stories.md](./2eat-stories.md) | 用户故事、验收标准（AC）、MVP 计划 |
| 3 | [2eat-design.md](./2eat-design.md) | 视觉规范、技术架构、页面契约 |
| 4 | [2eat-test-plan.md](./2eat-test-plan.md) | 测试策略、DoD、质量门、用例矩阵 |
| 5 | [2eat-deployment-plan.md](./2eat-deployment-plan.md) | 部署与本地运行（what2eat 专属） |

## 相关资源

| 资源 | 说明 |
| --- | --- |
| [ui-mockup/](./ui-mockup/) | 可点击静态 mock，像素级参考；与 Next 实现冲突时以 mock + `mockup.css` 为准 |
| [../../workspace-specs/2.architecture.md](../../workspace-specs/2.architecture.md) | 家族架构、BFF 信任边界 |
| [../../workspace-specs/3.tech-specs.md](../../workspace-specs/3.tech-specs.md) | 锁定技术栈版本 |
| [../../workspace-specs/6.deployment-plan.md](../../workspace-specs/6.deployment-plan.md) | 家族部署总览、端口注册 §0 |
| [../../1.places-agent/agent-specs/](../../1.places-agent/agent-specs/) | places-agent 工具与 HTTP 契约 |
| [../../0.2.release-bot/](../../0.2.release-bot/) | release-bot 半自动发布流程 |

## 约定

- 用户可见文案一律 **i18n key**；locale：`EN` / `CN` / `HK` / `TW`。
- 协议 id（`AMAP`、`GOOGLE_MAPS`、`TRIPADVISOR`）不翻译。
- 地图 vendor 密钥、caller key、LLM 密钥不在浏览器端。
