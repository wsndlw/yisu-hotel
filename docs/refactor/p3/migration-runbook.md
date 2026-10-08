# P3 数据库迁移运行手册

## 1. 安全原则

- 禁止首先在共享库或正式库试跑。
- MySQL DDL 不是完整事务；升级前必须有经过校验的备份。
- `alembic stamp` 只记录版本，不执行结构变化。只有结构已经与 P1 baseline 核对一致的现有库才能 stamp `20261008_0001`。
- 禁止使用 `stamp head` 绕过 migration。
- 应用进程不负责自动迁移；部署流程必须先完成 migration 和验证，再启动新版本。

## 2. 全新数据库

配置 `.env` 指向确认无业务数据的新库，然后执行：

```bash
cd server-python
uv sync --frozen --all-groups
uv run alembic upgrade head
uv run python -m scripts.verify_database
uv run alembic check
```

预期 revision：`20261008_0002`，业务表数量：14。

## 3. 现有数据库升级

1. 创建维护窗口并停止所有写入。
2. 对源库执行一致性备份并记录文件大小、SHA-256 和 MySQL 版本。
3. 将备份恢复到新建的隔离实例。
4. 在隔离实例逐表核对行数、外键、字符集和金额字段。
5. 执行 P3 migration 的数据预检。预检失败时修复数据并重新从备份恢复，不允许修改 migration 跳过坏数据。
6. 确认结构与 P1 `database-schema.sql` 一致后执行：

```bash
uv run alembic stamp 20261008_0001
uv run alembic upgrade head
uv run python -m scripts.verify_database
uv run alembic check
```

7. 比较升级前后 14 张表行数，并抽样核对金额、日期、订单关系和酒店状态。
8. 通过后才允许在目标环境执行相同流程。

## 4. 迁移会主动阻断的情况

- 非空邮箱重复。
- 引用标识超过 36 字符。
- 日期不是严格有效的 `YYYY-MM-DD`。
- 日历、POI、审核、订单存在关键孤儿引用。
- 酒店状态、星级、评分、坐标越界。
- 价格、金额、库存、排序或失败次数为负。
- 入住人数不为正，或离店日期不晚于入住日期。

## 5. 失败与回滚

### 尚未执行 DDL

预检失败时数据库未发生 P3 结构变化。修复数据来源或迁移方案后，从源备份重新建立隔离副本复验。

### 已部分执行 DDL

不要假设 `alembic downgrade` 能原子撤销 MySQL 部分 DDL。应当：

1. 阻止应用启动和继续发布。
2. 保存迁移日志与当前 `SHOW CREATE TABLE` 证据。
3. 删除失败的隔离/目标库并从升级前备份恢复。
4. 核对 14 表行数和关键抽样。
5. 恢复旧 Node 服务连接，确认冒烟后再开放流量。

空库的 `downgrade base -> upgrade head` 已用于验证 migration 的可逆声明，但生产恢复路径仍以完整备份恢复为准。

## 6. 部署门禁

- `alembic current` 必须是代码对应的唯一 head。
- `scripts.verify_database` 必须成功。
- `alembic check` 必须显示 `No new upgrade operations detected`。
- migration 失败、验证失败或健康检查失败时，部署必须停止。
