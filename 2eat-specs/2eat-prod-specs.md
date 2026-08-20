# what2eat — 产品规格

**what2eat**（`what2eat.food`）产品需求。地图工具、vendor 密钥、行程引擎在 **places-agent**。家族架构见 [`workspace-specs/2.architecture.md`](../../workspace-specs/2.architecture.md)；agent 能力见 [`1.places-agent/agent-specs/`](../../1.places-agent/agent-specs/)。用户故事与 AC 见 [`2eat-stories.md`](./2eat-stories.md)；设计与实现见 [`2eat-design.md`](./2eat-design.md)。

## 产品定义

帮助「不知道吃什么」的用户：一次保存偏好，在 **Decide** 输入位置、用餐场景、人均预算和可选 craving，获得**短名单**餐厅。每条展示匹配理由、places-agent 返回的**场所事实**，以及追问 / 打开地图的入口。

餐厅事实（搜索、详情、geocode、无密钥地图链接、`sources[]`）经 BFF 以 **HTTP + caller API key** 调用 places-agent。浏览器不持有 map vendor 密钥、caller key 或 LLM 密钥。

**不做：** 下单、支付、菜单/过敏原权威、医疗饮食建议、`plan_itinerary`（where2play）、大众点评/美团抓取、places-agent 管理 UI。

## 目标用户

个人与小团体快速决策（今晚吃什么、工作午餐、旅行、混合饮食家庭）。

## 职责划分

| 层级 | 负责 | 不负责 |
| --- | --- | --- |
| **Web 应用** | 账号、偏好、Decide UX、卡片/详情、收藏/历史、匹配文案、聊天 UX、**浏览器 本地 chat  transcript** | Map adapter、agent 管理 UI |
| **BFF（同源）** | Session、`providers[]`、地图 deeplink 选择、偏好匹配、聊天编排（无状态） | Vendor 密钥；**持久化 chat** |
| **places-agent** | `search_restaurants`、`get_place_details`、geocode、`navigate`、`sources[]`、可选 Tripadvisor enrich | 消费者界面、偏好 profile |

```text
Browser → what2eat /api/* → places-agent HTTP (/v1)
Browser → what2eat /api/chat → places-agent /v1/chat（非 MCP）
```

- BFF 仅用 **HTTP**，不用 MCP。
- **Caller-driven vendors：** BFF 传 `providers[]`（如大陆 `["AMAP","GOOGLE_MAPS"]`）。
- **主搜索路径：** `search_restaurants`；chat 补充说明，不替代搜索。
- **Chat 历史：** 列表 chat / 详情 chat 仅存 **浏览器 localStorage**；BFF 不落库、不同步跨设备。

## 国际化

全部用户可见字符串为 **i18n key**。Locale：`EN`、`CN`（zh-CN）、`HK`（zh-HK）、`TW`（zh-TW）；HK 与 TW 目录独立。

## 功能域（概要）

AC 细节见 [`2eat-stories.md`](./2eat-stories.md)。

| 域 | 内容 |
| --- | --- |
| **Shell** | 登录后 sticky header（Decide / Profile / Saved、问候、locale、登出）；全站 **places.family** footer |
| **Home** | 公开落地页、注册/登录 CTA |
| **Account** | 注册、登录、重置/设置密码 |
| **Profile** | 个人信息；口味/约束/用餐场景（分卡保存）；预算在 Decide 填写 |
| **Decide** | 搜索条件；短名单 + 更新时间；**排序**（rank/rating/distance/price）；**Reshuffle**（重查 vendor）；分页；卡片（含 **价格档**）；空态/部分 vendor banner；列表 chat（可 resize 且 **尺寸可持久化**；助手 **rich** pick 卡 + 地图新标签；**pending** 等待态）；**条件草稿跨 locale** |
| **Place details** | 对话框：事实（含价格）、Why、Also nearby、详情 chat（内滚动 + pending）、Open map、Save |
| **Saved / History** | 收藏列表；决策历史（Went、再跑 Decide） |

## 数据诚实

- 展示事实更新时间；缺失字段用占位，不编造。
- 区分 **场所事实**（vendor）、**偏好匹配**（BFF）、**agent 建议**（chat）。
- 单个 vendor 失败时结果区不全空；partial banner 不得与卡片上的 provider 矛盾。

## 非目标

- 浏览器持有 map/caller/LLM 密钥；浏览器调 MCP
- 服务端或 DB 存储 chat；跨设备 chat 同步
- Dismiss / cool-off（隐藏某店一段时间）— **不在范围**
- 独立全页「Why this pick」（内容在详情对话框）

## 成功标准

用户完成注册 → 保存偏好 → 用真实 vendor 数据跑 Decide → 浏览分页短名单 → 打开详情看事实与 Why → 可选 chat → 打开地图 → 收藏 → 查看历史；且不把产品当作菜单或健康权威。
