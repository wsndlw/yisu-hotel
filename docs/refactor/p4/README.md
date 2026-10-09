# P4：认证、用户与 RBAC

> 状态：进行中（第 1、2、3、4 项已完成，第 5 项未开始）
> 启动日期：2026-10-08
> 负责人：厉飞雨

## 阶段拆分

P4 按依赖关系拆成以下五项，逐项实现、验证和标记，不要求一次性完成全部内容。

| 序号 | 内容 | 状态 | 本次交付位置 |
|---:|---|---|---|
| 1 | 认证基础：bcrypt 密码校验、JWT 颁发/解析、Bearer 请求、旧 JWT 兼容窗口 | ✅ 已完成 | `app/modules/auth/security.py`、`app/modules/auth/service.py` |
| 2 | 用户功能：用户名/密码注册登录、当前用户、个人资料更新 | ✅ 已完成 | `app/modules/user/service.py`、`app/api/graphql/schema.py` |
| 3 | 邮箱验证码和 Redis：验证码 TTL、单次使用、失败计数、锁定、发送频率 | ✅ 已完成 | `app/modules/auth/email_codes.py`、`app/modules/auth/limits.py` |
| 4 | RBAC：CUSTOMER/MERCHANT/ADMIN 权限矩阵、中间件/装饰器、资源归属校验 | ✅ 已完成 | `app/modules/auth/rbac.py` |
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

### 3. 邮箱验证码和 Redis

- 验证码只保存摘要，不保存明文；验证码 TTL 默认 5 分钟，默认单次消费。
- Redis 原子校验失败次数，达到阈值后锁定；发送间隔通过 `SET NX EX` 限流。
- 密码登录失败计数和锁定也使用 Redis，不写入用户表的失败计数字段。
- 邮件发送使用可替换 `EmailSender`，生产可启用 SMTP；默认开发配置关闭实际投递，测试使用记录型 sender。
- 验证码、认证存储不可用和投递失败均返回稳定错误码，不泄露验证码内容。

### 4. RBAC

- 建立 CUSTOMER、MERCHANT、ADMIN 三角色权限矩阵。
- 提供 `require_permissions` GraphQL resolver 装饰器、角色/权限校验和统一 `FORBIDDEN` 错误。
- 提供资源归属校验；管理员可按策略跨用户操作，普通角色只能操作自己的资源。
- JWT 中的 role 不作为最终授权依据，授权使用数据库加载的当前用户角色。

## 明确未包含

- 本次不实现第 5 项完整安全验收套件；越权、角色篡改、限流、过期、锁定解锁和敏感信息泄露的系统级回归仍待单独验收。
- SMTP 投递已提供同步适配器，但邮件异步重试、熔断和外部服务降级属于后续外部集成阶段。
- `ADMIN` 注册已被公开入口拒绝；管理员受审计创建流程仍需后续管理端流程实现。

## 验证记录

- 静态检查：Ruff、Mypy 通过。
- 单元测试：31 项通过，覆盖率 75.18%（高于 75% 门禁）。
- 隔离 MySQL 验证：`scripts.verify_auth_user_flow` 通过，覆盖注册、登录、JWT claims、当前用户、资料更新、重复用户名、ADMIN 注册拦截和 GraphQL Bearer 链路。
- 隔离 MySQL + Redis 验证：`scripts.verify_auth_rbac_flow` 通过，覆盖验证码 TTL/单次使用/失败锁定、登录失败锁定、RBAC 矩阵和 GraphQL 邮箱登录注册。
- 验证后的专用数据库已删除；未修改现有开发库和原始 SQL dump。
- 本地 pre-commit 门禁已通过；远程 CI 需在本次变更提交并推送后触发。

本阶段对应总计划中的 [P4：认证、用户与 RBAC](/Users/sweet_77/Developer/test/YISU_HOTEL_PYTHON_BACKEND_REFACTOR_PLAN.md:385)。
