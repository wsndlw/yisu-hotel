# P1 可重复测试数据

## 文件

- `baseline/database-schema.sql`：从当前完整 dump 提取的 14 表纯结构基线，不含业务数据、GTID 或全局会话语句。
- `baseline/test-fixture.sql`：完全合成、可重复加载的测试数据；不包含真实个人信息。
- `../p0/database-baseline.md`：真实测试 dump 的只读规模统计。

## Fixture 覆盖

- CUSTOMER、两个 MERCHANT 和 ADMIN，支持商户隔离测试。
- DRAFT、REVIEWING、REJECTED、PUBLISHED、OFFLINE 五种酒店状态。
- 在售、售罄、停售房型。
- 设施、标签、图片、POI、Banner 和审核记录。
- 跨月和闰日的价格/库存覆盖，以及售罄日期。
- PENDING、PAID、CANCELLED、COMPLETED 四种订单状态。

所有 fixture 用户密码统一为 `TestOnly!2026`，仅允许用于隔离测试数据库。

## 加载顺序

1. 新建专用空数据库，禁止指向开发现有库或生产库。
2. 执行 `baseline/database-schema.sql`。
3. 执行 `baseline/test-fixture.sql`。
4. 执行逐表行数和关键关系断言。

Fixture 自带清表语句，因此具有破坏性，只能在明确标记的临时测试数据库中执行。已在新建隔离库 `yisu_p1_contract_20261007` 上完成恢复验证，结果见 `reports/mysql-fixture-validation.md`；现有 `yisu_hotel` 未被读取或修改。P2/P3 将把加载动作包装为带数据库名称保护的自动命令。
