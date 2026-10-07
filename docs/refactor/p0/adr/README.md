# P0 架构决策记录索引

| ADR | 决策 | 状态 |
|---|---|---|
| [ADR-0001](./0001-python-modular-monolith.md) | Python 模块化单体与框架 | Accepted，阿格尼评审通过 |
| [ADR-0002](./0002-graphql-compatibility.md) | 保持 GraphQL 契约 | Accepted，阿格尼评审通过 |
| [ADR-0003](./0003-mysql-and-migrations.md) | 保持 MySQL，使用 Alembic | Accepted，阿格尼评审通过 |
| [ADR-0004](./0004-jwt-and-rbac.md) | JWT 兼容与服务端 RBAC | Accepted，阿格尼评审通过 |
| [ADR-0005](./0005-celery-and-redis.md) | Redis 与 Celery 异步任务 | Accepted，阿格尼评审通过 |
| [ADR-0006](./0006-container-deployment.md) | 容器化模块单体与并行替换 | Accepted，阿格尼评审通过 |
| [ADR-0007](./0007-production-safety-corrections.md) | 安全修正优先于缺陷兼容 | Accepted，阿格尼评审通过 |

以上 ADR 已由阿格尼完成非作者技术评审并接受。对应评审记录已纳入正式 `p0-baseline-v1`，P0 状态为 `DONE`。

ADR 一经签字不得直接改写结论。新事实导致结论变化时，新建 ADR 并将旧 ADR 标记为 `Superseded by ADR-XXXX`。
