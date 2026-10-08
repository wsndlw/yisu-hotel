# P3 MySQL 迁移与恢复验证记录

> 验证日期：2026-10-08
> MySQL：Docker `mysql:8.4`
> 数据均位于本机命名明确的隔离数据库；未修改原始 dump 和现有开发库。

## 1. 空库路径

- 数据库：`yisu_p3_empty_20261008`
- `upgrade head`：通过。
- `downgrade base`：通过。
- 再次 `upgrade head`：通过，未出现旧式整数 display width 警告。
- 最终 revision：`20261008_0002`。

## 2. P1 fixture 旧库路径

- 数据库：`yisu_p3_legacy_20261008`
- 输入：P1 `database-schema.sql` + `test-fixture.sql`。
- 操作：结构核对后 stamp `20261008_0001`，再升级 head。
- 结果：通过。
- 核心行数保持：users 4、hotels 5、room_types 3、orders 4、calendar_price 3、calendar_stock 3。
- 日期类型：日历和订单入住/离店字段均为 `DATE`。
- 金额类型：`room_types.basePrice` 为 `decimal(10,2)`；`orders.totalAmount` 为 `decimal(12,2)`。

## 3. 完整 dump 路径

- 数据库：`yisu_p3_full_20261008`
- 输入：`yisu_hotel-2026-10-07_152046-dump.sql`；导入时只过滤了 GTID/二进制日志全局会话语句。
- 原始业务字段值未写入报告。
- 迁移预检：通过。
- Alembic revision：`20261008_0002`。
- schema drift：`No new upgrade operations detected`。

| 表 | 迁移后行数 | P0 dump 基线 | 结果 |
|---|---:|---:|---|
| banners | 13 | 13 | 一致 |
| calendar_price | 796 | 796 | 一致 |
| calendar_stock | 1,103 | 1,103 | 一致 |
| facilities | 56 | 56 | 一致 |
| hotel_audit_records | 86 | 86 | 一致 |
| hotel_facilities | 57 | 57 | 一致 |
| hotel_images | 124 | 124 | 一致 |
| hotel_poi | 0 | 0 | 一致 |
| hotel_tags | 0 | 0 | 一致 |
| hotels | 44 | 44 | 一致 |
| orders | 3 | 3 | 一致 |
| poi | 139 | 139 | 一致 |
| room_types | 114 | 114 | 一致 |
| users | 4 | 4 | 一致 |
| **合计** | **2,539** | **2,539** | **一致** |

关键关系孤儿记录为 0。迁移后共有 25 个 CHECK、16 个 FOREIGN KEY、7 个 UNIQUE 和 15 个 PRIMARY KEY 约束（包含 Alembic 版本表主键统计差异由 MySQL 元数据决定；业务表主键均存在）。

## 4. 备份恢复路径

- 迁移后备份：单事务 `mysqldump`，权限 `0600`。
- 临时备份大小：336,441 bytes。
- SHA-256：`0a2bb919ab056f86e0c8721dbdd16e88ebafafd39584d38291e9b6af973f87ba`。
- 恢复数据库：`yisu_p3_restore_20261008`。
- 恢复结果：revision `20261008_0002`，14 张业务表逐表行数与迁移库完全一致。
- 临时备份在验证完成后删除，不提交 Git，不保留业务数据副本。

## 5. 结论

P3 已证明以下路径可重复：空库初始化、旧结构升级、完整 dump 升级、迁移后备份与独立恢复。生产或共享环境仍必须按 `migration-runbook.md` 重新执行备份、隔离演练和人工批准，不得直接复用本地结论。

## 6. 远程流水线复核

- GitHub Actions 运行：[#5](https://github.com/wsndlw/yisu-hotel/actions/runs/37768596124)。
- 验证提交：`61e068b`。
- 结果：质量检查、MySQL 8.4 空库迁移、schema drift 检查和 Docker 镜像构建全部成功。
- 完成时间：2026-10-08。

## 7. CHECK 预检阻断整改

- 原问题复现：旧库存在 `hotels.latitude = 999` 时，旧 migration 在部分日期列、外键和 CHECK 已落库后才失败，revision 仍停留在 `20261008_0001`。
- 修复：25 个 CHECK 约束与对应违规条件合并为同一份 `CHECK_CONSTRAINTS` 清单，`preflight()` 在首个 DDL 前逐项检查。
- 回归范围：酒店经纬度、POI 经纬度与评分、用户登录/邮箱失败次数、酒店图片排序、Banner 排序和时间范围，共 10 个无效值场景。
- 失败原子性验证：每个场景执行前后分别抓取 Alembic revision、全部列定义、表约束和索引；10 次比较均完全一致。
- 可重跑验证：逐项修正坏数据后，同一个 baseline 数据库可直接升级到 `20261008_0002`。
- 最终结构：14 张业务表、16 个 FOREIGN KEY、25 个 CHECK；`alembic check` 返回 `No new upgrade operations detected`。
- 隔离数据库：`yisu_p3_preflight_fix_20261008`，验证完成后已删除，不包含原始业务数据。
- 整改远程复验：[GitHub Actions #6](https://github.com/wsndlw/yisu-hotel/actions/runs/37782424146)，提交 `e496962`，quality 与 image jobs 均成功。
