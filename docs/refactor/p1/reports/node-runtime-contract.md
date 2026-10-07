# P1 Node.js 运行时契约快照报告

> 验证日期：2026-10-07
> 数据库：隔离 MySQL `yisu_p1_contract_20261007`
> 数据来源：`baseline/database-schema.sql` + `baseline/test-fixture.sql`，全部为合成数据

## 结果

- 契约测试：6/6 通过。
- Jest 快照：6/6 通过。
- 既有安全/订单/日历测试：3 suite、11/11 test 通过。
- 基线完整性校验：通过。

快照文件：`server/test/__snapshots__/p1-contract.e2e-spec.ts.snap`。

## 覆盖范围

| 业务域 | 成功路径 | 失败或权限路径 |
|---|---|---|
| 认证/用户 | 合成 CUSTOMER 登录 | 用户不存在；未登录访问 `me` |
| 移动端首页 | 首页 Banner、城市、快捷设施 | — |
| 搜索/详情 | 上海酒店搜索、已发布酒店详情 | 不存在的酒店 |
| 商户酒店 | 商户查询自己的酒店 | CUSTOMER 角色访问被拒绝 |
| 管理审核 | ADMIN 查询审核记录 | MERCHANT 角色访问被拒绝 |
| 日历运营 | 商户查询闰日价格与库存 | CUSTOMER 越权；倒置日期范围的现有行为 |
| 订单 | CUSTOMER 查询四种状态订单 | MERCHANT 越权；未登录访问被拒绝 |

覆盖内容对应 P1 需求追踪矩阵中的首页、列表、详情、认证、酒店管理、审核、日历和订单核心链路。写操作的事务与库存行为由既有 `calendar.e2e-spec.ts`、`order.service.e2e-spec.ts`、`order.e2e-spec.ts` 继续覆盖。

## 规范化规则

- JWT 替换为 `<JWT>`，防止签发时间导致快照漂移。
- `createdAt`、`updatedAt` 替换为 `<TIMESTAMP>`。
- 合成 UUID、日期、价格、库存和角色保留原值，用于发现语义变化。
- GraphQL 错误码、消息和响应结构保留，用于后续 Python 新旧服务比对。

## 新发现

`merchantRoomTypeCalendar` 在 `startDate > endDate` 时返回成功响应和空 `days`，没有参数错误。该行为已登记为 NB-15；依据生产安全修正原则，Python 实现应返回明确、稳定的参数错误，并在最终差异报告中说明。

## 可重复执行

从仓库根目录运行：

```bash
node docs/refactor/p1/scripts/run-node-contract-baseline.mjs
node docs/refactor/p1/scripts/validate-graphql-documents.mjs
node docs/refactor/p1/scripts/validate-baselines.mjs
```

第一条命令只允许重置名称以 `yisu_p1_contract_` 开头的隔离数据库。数据库连接可通过 `P1_DB_HOST`、`P1_DB_PORT`、`P1_DB_USER`、`P1_DB_PASSWORD`、`P1_DB_NAME` 覆盖。只有在评审确认响应变化后，才可附加 `--update-snapshots` 更新快照。
