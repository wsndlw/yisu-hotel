# P1 MySQL Fixture 恢复验证

> 验证日期：2026-10-07
> MySQL：9.7.1 Homebrew
> 隔离数据库：`yisu_p1_contract_20261007`

## 安全边界

- 创建前已查询 `INFORMATION_SCHEMA.SCHEMATA`，确认隔离库名未被占用。
- 只对新建隔离库执行 `database-schema.sql` 和 `test-fixture.sql`。
- 未读取、修改或覆盖现有 `yisu_hotel` 数据库。
- 隔离库暂时保留，用于 P1 Node 响应快照；P1 完成后再明确清理。

## 恢复结果

- 结构文件执行成功：14 张表。
- Fixture 执行成功，无 INSERT 警告。
- 核心行数：users 4、hotels 5、room_types 3、orders 4、calendar_price 3、calendar_stock 3。
- 酒店状态 0～4 各 1 条，覆盖 DRAFT、REVIEWING、REJECTED、PUBLISHED、OFFLINE。
- 订单 PENDING、PAID、CANCELLED、COMPLETED 各 1 条。
- 房型到酒店、酒店到商户、订单到用户/酒店/房型的孤儿记录均为 0。

结构导入产生的 warning 来自当前 DDL 与 MySQL 9.7.1 的兼容提示；未影响建表。P3 需在 Alembic baseline 中消除旧式 DDL，并在目标 MySQL 8.0 兼容基线上复验。

## 复验依据

- Schema SHA-256：`d2dcd97983961aa801a263340b4ab125dd22ef6f6592cc77027ffa403690820c`
- Fixture SHA-256：`d5693bc833dbeb22507b635e46aca700c913c124643f4830b91ce09867261ce9`
- 校验脚本：`docs/refactor/p1/scripts/validate-baselines.mjs`
