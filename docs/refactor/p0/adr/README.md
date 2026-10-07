# P0 架构决策记录索引

| ADR | 决策 | 状态 |
|---|---|---|
| [ADR-0001](./0001-python-modular-monolith.md) | Python 模块化单体与框架 | Proposed，待独立评审 |
| [ADR-0002](./0002-graphql-compatibility.md) | 保持 GraphQL 契约 | Proposed，待独立评审 |
| [ADR-0003](./0003-mysql-and-migrations.md) | 保持 MySQL，使用 Alembic | Proposed，待独立评审 |
| [ADR-0004](./0004-jwt-and-rbac.md) | JWT 兼容与服务端 RBAC | Proposed，待独立评审 |
| [ADR-0005](./0005-celery-and-redis.md) | Redis 与 Celery 异步任务 | Proposed，待独立评审 |
| [ADR-0006](./0006-container-deployment.md) | 容器化模块单体与并行替换 | Proposed，待独立评审 |
| [ADR-0007](./0007-production-safety-corrections.md) | 安全修正优先于缺陷兼容 | Proposed，待独立评审 |

当前 ADR 是已进入版本控制的技术候选，不代表治理批准。只有独立非作者评审完成、结论落盘并创建正式 `p0-baseline-v1` 标签后，P0 才整体进入 `DONE`。

ADR 一经签字不得直接改写结论。新事实导致结论变化时，新建 ADR 并将旧 ADR 标记为 `Superseded by ADR-XXXX`。
