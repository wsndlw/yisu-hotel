# P0 领域规则与状态机

## 1. 用户角色

角色集合冻结为 `CUSTOMER`、`MERCHANT`、`ADMIN`，不引入角色继承。

| 能力 | CUSTOMER | MERCHANT | ADMIN | 未登录 |
|---|---:|---:|---:|---:|
| 浏览已发布酒店、设施、Banner、POI | 允许 | 允许 | 允许 | 允许 |
| 管理本人资料 | 允许 | 允许 | 允许 | 拒绝 |
| 创建/查询/取消本人订单 | 允许 | 拒绝 | 拒绝 | 拒绝 |
| 管理本人酒店、房型、图片和日历 | 拒绝 | 仅本人资源 | 拒绝 | 拒绝 |
| 查询全量酒店、审核、发布、下线、恢复 | 拒绝 | 拒绝 | 允许 | 拒绝 |
| 管理 Banner/设施、查看审核记录和仪表盘 | 拒绝 | 拒绝 | 允许 | 拒绝 |
| 获取 OSS 上传凭据 | 拒绝 | 允许 | 允许 | 拒绝 |

规则：

- 所有授权以服务端数据库中的当前角色为准，不信任 JWT 载荷中的角色做最终授权。
- 自助注册只能创建 `CUSTOMER` 或 `MERCHANT`；生产环境忽略或拒绝 `ADMIN` 输入。
- `ADMIN` 只能通过受审计的运维命令创建。一期不实现邀请系统。
- `MERCHANT` 对酒店、房型、图片和日历的操作必须逐级校验 `merchantId` 归属。
- 角色变更不在公开 GraphQL 契约中提供。

## 2. 酒店状态机

状态集合及数据库兼容值冻结如下：

| GraphQL 状态 | 数据库存量值 | 含义 | C 端可见/可订 |
|---|---:|---|---:|
| `DRAFT` | 0 | 草稿或已发布酒店编辑后的未提交版本 | 否 |
| `REVIEWING` | 1 | 已提交，等待管理员处理 | 否 |
| `REJECTED` | 2 | 审核驳回，必须保留原因 | 否 |
| `PUBLISHED` | 3 | 已发布 | 是 |
| `OFFLINE` | 4 | 已下线，可恢复 | 否 |

允许的转换：

| 当前状态 | 动作/执行者 | 下一状态 | 说明 |
|---|---|---|---|
| 无 | 新建草稿 / MERCHANT | `DRAFT` | 可保存不完整字段 |
| 无 | 新建并提交 / MERCHANT | `REVIEWING` | 必须通过完整校验 |
| `DRAFT`、`REJECTED`、`OFFLINE` | 提交审核 / 所属 MERCHANT | `REVIEWING` | 清空旧驳回原因并写 `SUBMIT` |
| `REVIEWING` | 撤回 / 所属 MERCHANT | `DRAFT` | 写 `WITHDRAW` |
| `REVIEWING` | 审核通过 / ADMIN | `REVIEWING` | 只写 `APPROVE`；发布仍是独立动作，以兼容现有流程 |
| `REVIEWING` | 驳回 / ADMIN | `REJECTED` | 驳回原因必填，写 `REJECT` |
| `REVIEWING` | 发布 / ADMIN | `PUBLISHED` | 写 `PUBLISH`，设置 `hasEverPublished=true` |
| `PUBLISHED` | 保存编辑 / 所属 MERCHANT | `DRAFT` | 沿用当前可观察语义，修改后立即退出公开列表 |
| `PUBLISHED` | 申请下线 / 所属 MERCHANT | `OFFLINE` | 沿用当前直接下线语义，写 `OFFLINE_REQUEST` |
| `PUBLISHED` | 下线 / ADMIN | `OFFLINE` | 写 `OFFLINE` |
| `OFFLINE` | 恢复 / ADMIN | `PUBLISHED` | 写 `RESTORE` |
| `OFFLINE` | 发布 / ADMIN | `PUBLISHED` | 兼容当前 `publishHotel` 行为，写 `PUBLISH` |

补充约束：

- 除上表外的转换全部拒绝，且不能产生部分写入。
- 当前 Node.js `submitForReview` 缺少来源状态限制，是已知缺陷，不作为兼容目标。
- 仅从未发布过的 `DRAFT` 或 `REJECTED` 酒店允许物理删除；删除仍需评估关联订单，存在订单时必须拒绝。已发布过的酒店只允许下线。
- 每个状态动作都必须在同一事务内写入审核记录；记录至少包含酒店、动作、操作人、时间和可选原因。

## 3. 订单状态机与取消规则

状态集合冻结为 `PENDING`、`PAID`、`CANCELLED`、`COMPLETED`。

| 当前状态 | 动作 | 下一状态 | 一期规则 |
|---|---|---|---|
| 无 | CUSTOMER 创建订单 | `PENDING` | 单事务计价、锁库存、写订单；要求幂等键 |
| `PENDING` | 支付成功 | `PAID` | 状态保留用于兼容；真实支付延期，Python 一期不主动触发 |
| `PENDING`、`PAID` | 订单本人取消 | `CANCELLED` | 允许取消并按原扣减明细回补库存 |
| `PAID` | 完成入住 | `COMPLETED` | 状态保留；自动完成任务延期，不能由公开接口任意修改 |
| `CANCELLED`、`COMPLETED` | 任意取消 | 不变并报错 | 终态不可取消 |

取消规则冻结为：

- 仅订单本人可以查询或取消。
- 为保持当前业务语义，一期对 `PENDING`/`PAID` 不设置入住日前截止时间，也不计算取消费。
- 一期没有真实退款：取消 `PAID` 只改变订单与库存状态，不得声称资金已退回。
- 回补范围以订单创建时保存的 `inventoryDates` 为准；无库存上限语义的日期不回补。
- 取消与回补必须在同一数据库事务中完成，并锁定订单与相关库存行。
- 后续引入时间限制、取消费或退款时必须走变更流程并新增 ADR。

## 4. 价格与金额

- 币种固定为人民币 `CNY`，对外单位为“元”。
- 数据库使用 `DECIMAL(p, 2)`，Python 全链路使用 `Decimal`，禁止用二进制浮点数参与计价。
- GraphQL 现有字段仍为 `Float` 以保持 Schema 兼容，只允许在序列化边界从量化后的 `Decimal` 转换。
- 输入价格必须 `>= 0` 且最多两位小数；金额使用 `ROUND_HALF_UP` 量化到 `0.01` 元。
- 订单总价为区间 `[checkIn, checkOut)` 内逐晚价格之和：日期覆盖价优先，否则使用房型基础价。
- 客户端传入的显示金额不参与最终计价；订单保存服务端计算的酒店名、房型名和总金额快照。
- `miniPrice` 是展示/筛选派生值，不是订单结算依据。

## 5. 日期、时间和时区

| 数据类型 | 规范 |
|---|---|
| 入住、离店、日历价格/库存、开业日 | 无时区营业日期，格式严格为 `YYYY-MM-DD` |
| 计价区间 | `[checkIn, checkOut)`，离店日不计费、不扣库存 |
| 业务时区 | `Asia/Shanghai` |
| 审计、创建、更新、登录锁定、任务时间 | 数据库存 UTC，接口使用带时区 ISO 8601；前端按业务时区展示 |
| JWT `iat`/`exp` | Unix UTC 时间戳 |

校验规则：

- 日期必须是真实公历日期，`checkOut` 必须晚于 `checkIn`。
- 日期枚举以 date-only 算法完成，不用服务器本地时区的午夜时间戳逐日相加。
- 默认日历范围和允许的最大跨度属于接口约束，将在 P1 以现有前端 operation 和基线行为确认；确认前不得静默改变。

## 6. JWT 兼容窗口

- 继续接受 `Authorization: Bearer <token>`。
- 切换窗口内使用与 Node.js 相同的 HMAC 密钥验证未过期旧 token，并按 `sub` 重新加载当前用户。
- Python 新签 token 必须带 `sub`、`role`、`iat`、`exp`、`iss`、`aud` 和 `jti`。
- 为兼容旧 token，旧 token 缺少 `iss`/`aud` 时仅在显式兼容开关和截止时间内接受；截止后关闭。
- 兼容截止日由发布计划在 P11 填写，不能无限期开放。
