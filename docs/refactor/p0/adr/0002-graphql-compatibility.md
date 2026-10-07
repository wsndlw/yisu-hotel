# ADR-0002：保持 GraphQL 对外契约

- 状态：Proposed（技术基线候选，待独立评审）
- 日期：2026-10-07

## 背景

PC 和移动端均依赖 Apollo/GraphQL。同期改为 REST 会扩大为后端和两个前端的数据层重写。

## 决策

Python 服务继续提供 `/graphql`，以 `server/schema.gql` 为 P1 基线来源。Query、Mutation、输入/输出、枚举、nullable、错误语义、分页、价格和日期格式保持兼容。

使用 Schema diff、operation 快照、新旧只读影子比对和隔离库写入比对控制差异。生产安全缺陷按 ADR-0007 修正，不作为兼容目标。

## 后果

- 前端主要改 API 地址和统一错误处理。
- Ariadne 采用 Schema First，避免由 Python 类型意外生成不同 Schema。
- 现有 GraphQL `Float` 金额字段暂时保留；内部仍必须使用 Decimal。
- RESTful 若要引入，应作为共享 application service 上的新 adapter 独立演进。
