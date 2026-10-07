# ADR-0003：保持 MySQL，并使用 Alembic 管理结构

- 状态：Proposed（技术基线候选，待独立评审）
- 日期：2026-10-07

## 背景

历史文档/dump 指向 MySQL 5.7.44，2026-10-07 当前测试 dump 来自 MySQL 9.7.1；代码依赖 MySQL 空间距离函数，且 TypeORM 当前开启 `synchronize: true`。重构计划推荐 MySQL 8.0 作为目标兼容基线。

## 决策

数据库类型保持 MySQL。Python 目标兼容基线使用 MySQL 8.0；历史 MySQL 5.7 和当前测试 MySQL 9.7.1 dump 都作为迁移来源验证。P1 必须以当前 dump、当前实体和业务代码三方核对，P3 从核对后的结构建立 Alembic baseline。

应用启动禁止建表或改表；所有结构变化只允许通过评审过的 Alembic migration。金额使用 DECIMAL/Decimal，关键库存事务在真实 MySQL 上测试，不用 SQLite 替代。

## 后果

- 避免同期更换数据库带来的额外风险。
- 必须验证 SQL mode、字符集/排序规则、空间函数以及 5.7、8.0、9.7.1 之间的兼容差异。
- 空库升级、现有库 stamp/升级、备份恢复都成为 P3 门禁。
