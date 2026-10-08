# P3：数据库模型与 Alembic 基线

> 状态：DONE
> 启动日期：2026-10-08
> 完成日期：2026-10-08
> 负责人：厉飞雨

## 交付物

| 项目 | 实现位置 | 状态 |
|---|---|---|
| 14 张表的 SQLAlchemy 2 模型 | `server-python/app/db/models.py` | 已完成 |
| 数据库枚举和统一 metadata | `server-python/app/db/enums.py`、`base.py` | 已完成 |
| 异步 engine/session factory | `server-python/app/db/session.py` | 已完成 |
| P1 旧结构 Alembic baseline | `20261008_0001_legacy_baseline.py` | 已完成 |
| P3 结构修复 migration | `20261008_0002_schema_hardening.py` | 已完成 |
| 安全数据预检 | `20261008_0002` 的 `preflight()` | 已完成 |
| 结构和行数验证脚本 | `server-python/scripts/verify_database.py` | 已完成 |
| 数据字典与 ER 说明 | `data-dictionary.md` | 已完成 |
| 新库/旧库/回滚运行手册 | `migration-runbook.md` | 已完成 |
| 完整 dump 迁移与恢复演练 | `migration-validation.md` | 已完成 |
| CI 空库迁移和 drift 门禁 | `.github/workflows/python-backend.yml` | 已通过远程 CI |

## P3 结构决策

- P1 基线 revision `20261008_0001` 忠实表示旧库结构，供现有数据库经过核对后 stamp。
- head revision `20261008_0002` 是 Python 后端的数据库真相；应用不得调用 `create_all()` 或运行时同步结构。
- `calendar_price.date`、`calendar_stock.date`、`orders.checkIn`、`orders.checkOut` 从 `VARCHAR(10)` 转换为 MySQL `DATE`。
- 标识引用统一收紧到 `VARCHAR(36)`；迁移拒绝超过 36 字符的数据，禁止静默截断。
- 为日历、POI、审核和订单补齐外键；订单关系使用 `RESTRICT`，日历和酒店从属数据使用 `CASCADE`。
- `users.email` 增加唯一约束，为 P4 邮箱认证提供可靠前提。
- 增加 25 个 CHECK 约束，覆盖价格、库存、人数、状态、经纬度、日期顺序和非负计数。
- Banner 的目标酒店继续作为软引用，不增加外键；失效 Banner 必须在 P5 查询层安全降级。
- 所有金额保持 `DECIMAL`，Python 模型使用 `Decimal`，不得用浮点数参与订单金额计算。

## 本地出口门禁

- [x] 14 张业务表全部存在 SQLAlchemy 映射。
- [x] 空库可以从 base 执行 `alembic upgrade head`。
- [x] 空库可以 `downgrade base` 后再次升级到 head。
- [x] P1 旧结构＋合成 fixture 可以 stamp baseline 后升级。
- [x] 完整 dump 的 2,539 行数据迁移前后逐表行数一致。
- [x] 完整 dump 迁移后关键孤儿关系为 0。
- [x] `alembic check` 返回 `No new upgrade operations detected`。
- [x] 迁移后备份可恢复到另一隔离数据库，revision 和 14 表行数一致。
- [x] 日期列为 `DATE`；金额列精度保持 `DECIMAL(10,2)`/`DECIMAL(12,2)`。
- [x] Ruff、Mypy、Pytest 和覆盖率门禁通过。
- [x] 远程 CI 的质量、空库迁移、schema drift 和镜像构建全部通过。

## 远程 CI 记录

- GitHub Actions：[#5](https://github.com/wsndlw/yisu-hotel/actions/runs/37768596124)
- 验证提交：`61e068b`（`fix(p3): align empty schema coordinate types`）
- 结果：成功；quality job 约 1 分 5 秒，image job 约 17 秒，总耗时约 1 分 30 秒。
- 覆盖门禁：Ruff、Mypy、22 项 Pytest（95.46% 覆盖率）、MySQL 8.4 空库迁移、结构验证、`alembic check` 和 Docker 镜像构建。

至此 P3 的本地验证、迁移演练和远程门禁均已完成。
