# P1 Node.js 行为与缺陷基线

> 状态：P1 Node 静态盘点、全量文档校验与核心请求/响应快照已完成。
> 基线 commit：`d9f33c657d2e401cb0ad58f21d9907b0581d790a`
> 分支：`feat/customer-order-api`

## 1. 安全执行的现有测试

执行命令：

```bash
./node_modules/.bin/jest --config ./test/jest-e2e.json --runInBand --runTestsByPath \
  test/calendar.e2e-spec.ts \
  test/order.service.e2e-spec.ts \
  test/order.e2e-spec.ts
```

结果：3 个 suite、11 个 test 全部通过，耗时约 1.8 秒。

覆盖的现有行为：

- 最低价日历、停售/售罄处理、默认 90 天和最大 366 天校验。
- 订单逐晚计价、库存扣减、无权限访问阻断、取消回补和事务回滚。
- SQL.js 集成环境中的注册/登录与订单隔离。

默认 `npm test` 当前匹配不到这些 `.e2e-spec.ts` 文件并以 code 1 退出；必须使用 `test/jest-e2e.json`。这是测试配置缺陷，P2 需统一测试入口。

未运行 `test/app.e2e-spec.ts`：它加载 `AppModule`，当前会连接硬编码本机 MySQL 并启用 `synchronize: true`，存在修改开发数据结构的风险。

P1 新增隔离契约测试 `test/p1-contract.e2e-spec.ts`：6 个 test、6 个快照全部通过。该测试显式连接 `yisu_p1_contract_*` 数据库、关闭 `synchronize`，覆盖首页、搜索、详情、认证、酒店管理、审核、日历和订单的成功、失败、未认证与越权响应。详情见 `reports/node-runtime-contract.md`。

## 2. 前端现状检查

- 移动端 `npm run test:detail-regression` 通过：19 项语法/Babel/语义/import 检查及 10 项流程不变量全部通过。
- PC `npm run build` 未执行成功：当前 `client-pc` 依赖未安装，环境中找不到 `tsc`。为避免改动用户现有未提交的 lock/package 文件，本轮未自动安装依赖；该项保持待验证。

## 3. 已知缺陷和批准差异

| ID | 现状 | 分类 | Python 目标处理 |
|---|---|---|---|
| NB-01 | `register`/`emailRegister` 可由客户端选择 `ADMIN` | 严重安全缺陷 | 不兼容；生产自助注册拒绝 ADMIN |
| NB-02 | 数据库账号硬编码且 `synchronize: true` | 严重数据/配置缺陷 | 不兼容；强类型环境变量 + Alembic |
| NB-03 | JWT 存在默认密钥，缺少 issuer/audience | 严重安全缺陷 | 不兼容；启动必填并增加声明 |
| NB-04 | 邮箱验证码明文入库并被日志输出 | 严重敏感信息缺陷 | 不兼容；Redis 哈希、TTL、单次消费、日志脱敏 |
| NB-05 | 移动端使用 `getTagsForH5`，但 Schema/后端不存在该字段 | 前后端契约缺陷 | P1 标记失败快照；实现前由兼容评审决定复用 `getFacilitiesForH5` 还是补字段 |
| NB-06 | PC 定义未使用的 `roomTypeCalendar`，Schema 只有 `merchantRoomTypeCalendar` | 死代码/契约缺陷 | 不实现缺失字段；保留实际使用字段 |
| NB-07 | `submitForReview` 未限制来源状态 | 状态机缺陷 | 按 P0 状态机拒绝非法转换 |
| NB-08 | 订单创建没有幂等键 | 数据一致性缺陷 | P8 增加幂等唯一约束 |
| NB-09 | 金额在服务内使用 JS `number` 累加 | 精度风险 | Python 内部全程 Decimal |
| NB-10 | 管理仪表盘总交易额是稳定伪随机值 | 演示数据 | 字段兼容，改为真实统计或明确空值策略 |
| NB-11 | PC GraphQL URL 硬编码 localhost | 配置缺陷 | P9 改为 `VITE_GRAPHQL_URL` |
| NB-12 | OSS policy 未限制 key 前缀、文件大小和内容类型，host 使用 HTTP | 上传安全缺陷 | P5 最小权限、HTTPS、前缀/大小/类型限制 |
| NB-13 | 外部 SMTP/OSS 缺少完整连接/读取超时与可观测重试 | 可用性缺陷 | P5 adapter、超时、有限重试、fake/降级 |
| NB-14 | 默认 `npm test` 不执行现有 e2e 测试 | 质量门禁缺陷 | P2 提供单一可重复测试命令 |
| NB-15 | `merchantRoomTypeCalendar` 对开始日期晚于结束日期返回空 `days`，未明确报错 | 输入校验缺陷 | Python 对倒置日期范围返回稳定的参数错误 |

## 4. 兼容原则

- 合法的 GraphQL 字段、返回结构、分页、日期和错误语义进入快照基线。
- 上表安全/正确性缺陷依据 ADR-0007 修正，并在 P9 差异报告中明确列出。
- 61 个前端文档已全部执行标准 GraphQL 解析/校验；59 个通过，NB-05 和 NB-06 为已批准的基线差异。
- 核心运行时链路已经在隔离 MySQL fixture 上采集规范化快照；快照不代表批准 NB-01～NB-15，Python 仍按 ADR-0007 和本表目标处理。
