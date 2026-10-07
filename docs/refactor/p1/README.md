# P1：现状基线与契约测试

> 状态：DONE
> 启动日期：2026-10-07
> 完成日期：2026-10-07
> 负责人：厉飞雨

P0 已由阿格尼完成独立评审并创建正式标签 `p0-baseline-v1`。P1 已完成现状固化、前端 GraphQL 文档全量校验、隔离 MySQL fixture 恢复和核心运行时响应快照。

## 当前进度

| 工作项 | 状态 | 证据 |
|---|---|---|
| GraphQL Schema 固化 | 已完成 | `baseline/schema.graphql` 与 `server/schema.gql` 字节一致，SHA-256 `4b74702f...d34` |
| 数据库结构固化 | 已完成首版 | `baseline/database-schema.sql`，14 张表，无 INSERT 数据 |
| 当前数据规模登记 | 已完成 | P0 `database-baseline.md` |
| 环境变量/硬编码配置盘点 | 已完成 | `environment-inventory.md` |
| PC/移动端 operation 盘点 | 已完成首轮 | 61 个 operation，见 JSON/Markdown 报告 |
| operation 到页面映射 | 已完成首轮 | 除 1 个未使用死文档外均追踪到页面/容器 |
| 需求追踪矩阵 | 已完成首版 | `requirements-traceability.md` |
| Node 安全测试基线 | 已完成首轮 | 3 suite / 11 test 通过 |
| Node 已知缺陷登记 | 已完成首版 | `reports/node-baseline.md` |
| 可重复合成测试数据 | 已在隔离 MySQL 9.7.1 验证 | `baseline/test-fixture.sql`、`reports/mysql-fixture-validation.md` |
| 全量 operation 文档校验 | 已完成 | 61 个文档中 59 个通过；2 个失败均为已登记差异，见 `reports/graphql-document-validation.md` |
| 成功/失败/权限响应快照 | 已完成 | 6 个契约测试、6 份快照通过，见 `reports/node-runtime-contract.md` |
| 核心运行时链路 | 已完成 | 首页、搜索、详情、认证、酒店管理、审核、日历和订单均有运行时证据 |

## 已发现的契约差异

- 移动端实际引用 `Query.getTagsForH5`，但当前 Schema 不存在。
- PC 存在未引用的 `Query.roomTypeCalendar` 文档，当前 Schema 不存在；实际使用 `merchantRoomTypeCalendar`。
- Node 对倒置的日历日期范围返回空列表而不是明确错误，已登记为 NB-15，Python 实现不得照搬。
- 前两项已登记为 Node 基线缺陷，不会静默加入 Python Schema；第三项作为批准的安全修正差异处理。

## 目录

- `baseline/schema.graphql`：GraphQL 基线快照。
- `baseline/manifest.json`：基线 commit、校验值和来源清单。
- `baseline/database-schema.sql`：无数据的数据库结构基线。
- `baseline/test-fixture.sql`：合成 fixture。
- `reports/graphql-operations.json`：机器可读 operation 清单。
- `reports/graphql-operations.md`：页面使用矩阵。
- `reports/graphql-document-validation.json`：61 个前端 GraphQL 文档的机器可读完整校验结果。
- `reports/graphql-document-validation.md`：全量文档校验摘要。
- `reports/node-baseline.md`：现有行为、测试结果和缺陷。
- `reports/node-runtime-contract.md`：隔离数据库运行时响应快照报告。
- `scripts/`：可重复生成/盘点脚本。

## P1 出口结论

- PC 和移动端 operation 识别率为 100%（61/61）。
- 59/61 个文档通过完整 GraphQL Schema 校验；其余 2 个是 NB-05、NB-06 已知差异，不作为 Python 的隐式兼容目标。
- 核心成功、业务失败、未认证和角色越权响应均已有规范化快照；JWT 与时间戳已替换为稳定占位符。
- 测试只使用 `yisu_p1_contract_*` 隔离数据库和合成数据，复跑脚本会拒绝重置其他数据库。
- P1 验收通过，可以进入 P2。后续任何基线变更必须更新 manifest、报告和快照并接受评审。
