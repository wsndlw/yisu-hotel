# P4：认证、用户与 RBAC

> 状态：进行中（第 1、2 项已完成）
> 启动日期：2026-10-08
> 负责人：厉飞雨

## 阶段拆分

P4 按依赖关系拆成以下五项，逐项实现、验证和标记，不要求一次性完成全部内容。

| 序号 | 内容 | 状态 | 本次交付位置 |
|---:|---|---|---|
| 1 | 认证基础：bcrypt 密码校验、JWT 颁发/解析、Bearer 请求、旧 JWT 兼容窗口 | ✅ 已完成 | `app/modules/auth/security.py`、`app/modules/auth/service.py` |
| 2 | 用户功能：用户名/密码注册登录、当前用户、个人资料更新 | ✅ 已完成 | `app/modules/user/service.py`、`app/api/graphql/schema.py` |
| 3 | 邮箱验证码和 Redis：验证码 TTL、单次使用、失败计数、锁定、发送频率 | ⬜ 未开始 | 后续阶段 |
| 4 | RBAC：CUSTOMER/MERCHANT/ADMIN 权限矩阵、中间件/装饰器、资源归属校验 | ⬜ 未开始 | 后续阶段 |
| 5 | 安全验收：越权、角色篡改、限流、过期、锁定解锁和敏感信息泄露测试 | ⬜ 未开始 | 后续阶段 |

## 本次已完成

### 1. 认证基础

- 使用 bcrypt 生成和校验密码哈希，兼容现有 `$2b$` bcrypt 密码格式。
- 新签发 JWT 包含 `sub`、`role`、`iat`、`exp`、`iss`、`aud`、`jti`。
- 统一解析 `Authorization: Bearer <token>`。
- 通过 `JWT_LEGACY_COMPATIBILITY_ENABLED` 和 `JWT_LEGACY_COMPATIBILITY_UNTIL` 显式控制旧 JWT 兼容窗口。
- 旧 token 仍按 `sub` 从数据库重新加载用户，不把 token 中的角色作为最终授权依据。
- 公开注册拒绝创建 `ADMIN`，避免沿用旧实现的管理员提权缺陷。

### 2. 用户功能

- `register(input: RegisterInput!)`：创建 CUSTOMER/MERCHANT 用户并返回 JWT。
- `login(input: LoginInput!)`：使用用户名和密码登录并返回 JWT。
- `me`：从 Bearer JWT 加载当前数据库用户。
- `updateMe(input: UpdateMeInput!)`：更新用户名、密码、头像、常用标签和常用设施。
- 用户名重复、密码长度、无效 token、用户不存在等情况返回稳定 GraphQL 错误码。
- 密码哈希、密码明文、JWT secret 不进入响应或日志。

## 明确未包含

- 本次不实现邮箱验证码登录/注册、SMTP、Redis 验证码 TTL、单次消费、失败锁定和发送频率；这些属于第 3 项。
- 本次不实现完整角色权限矩阵和酒店/订单资源归属拦截；这些属于第 4 项。
- `ADMIN` 注册虽已被公开入口拒绝，但管理员受审计创建流程将在后续 RBAC 阶段实现。

## 验证记录

- 静态检查：Ruff、Mypy 通过。
- 单元测试：26 项通过，覆盖率 76.54%（高于 75% 门禁）。
- 隔离 MySQL 验证：`scripts.verify_auth_user_flow` 通过，覆盖注册、登录、JWT claims、当前用户、资料更新、重复用户名、ADMIN 注册拦截和 GraphQL Bearer 链路。
- 验证后的专用数据库已删除；未修改现有开发库和原始 SQL dump。
- 本地 pre-commit 门禁已通过；远程 CI 需在本次变更提交并推送后触发。

本阶段对应总计划中的 [P4：认证、用户与 RBAC](/Users/sweet_77/Developer/test/YISU_HOTEL_PYTHON_BACKEND_REFACTOR_PLAN.md:385)。
