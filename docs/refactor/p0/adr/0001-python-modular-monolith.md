# ADR-0001：采用 Python 模块化单体

- 状态：Proposed（技术基线候选，待独立评审）
- 日期：2026-10-07

## 背景

原始 PDF 指定 Node.js，但本次目标是以 Python 重构后端，同时保持业务范围和前端稳定。当前规模不足以支撑微服务的部署和事务成本。

## 决策

采用 Python 3.12、FastAPI、Ariadne、SQLAlchemy 2、Alembic 和 pydantic-settings，按 `resolver -> application service -> repository/integration` 建设模块化单体。领域规则不得堆积在 resolver 中。

Node.js 改 Python 是经本重构计划明确提出的技术偏离；PDF 业务验收项全部保留。该偏离须随 P0 评审一起由 PO 签字。

## 后果

- 可直接加载 Schema First 契约，减少前端改动。
- 事务仍可在单进程边界内处理，部署和排障简单。
- 需要重新实现并验证全部业务语义，不能机械翻译 TypeScript。
- 不在本轮拆微服务；未来拆分必须有独立 ADR 和量化依据。
