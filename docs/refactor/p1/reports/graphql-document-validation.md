# P1 GraphQL 文档全量校验报告

> 校验方式：将 PC/移动端源码中的每个 `gql` 文档（包含 fragment 插值）完整解析，并使用 GraphQL 标准校验规则对 P1 Schema 基线执行校验。

## 汇总

- Operation：61
- 校验通过：59
- 校验失败：2
- 已被页面使用且失败：1

## 校验失败项

| 客户端 | Operation | 是否使用 | 结果 | 错误 |
|---|---|---:|---|---|
| Mobile | `GetTagsForH5` | 是 | INVALID | Cannot query field "getTagsForH5" on type "Query". |
| PC | `RoomTypeCalendar` | 否 | INVALID | Cannot query field "roomTypeCalendar" on type "Query". |

失败项均已在 `reports/node-baseline.md` 登记：移动端 `GetTagsForH5` 为 NB-05；PC 未使用的 `RoomTypeCalendar` 为 NB-06。除这两项外，其余前端 operation 均通过完整文档校验。

## 可重复执行

```bash
node docs/refactor/p1/scripts/validate-graphql-documents.mjs
node docs/refactor/p1/scripts/validate-graphql-documents.mjs --write
```
