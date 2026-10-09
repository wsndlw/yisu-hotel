# P4 安全验收清单

## 验收范围

本清单覆盖当前 P4 已迁移的认证、用户资料和 RBAC 代码，不替代后续酒店、订单等业务 resolver 的专项越权回归。

| 安全场景 | 验证内容 | 自动化用例 |
|---|---|---|
| 未认证 | 缺失、空白、Basic 和空 Bearer token 被拒绝 | `test_malformed_bearer_headers_are_not_accepted`、`test_protected_graphql_field_rejects_missing_auth` |
| 越权 | 普通用户不能访问其他用户资源；未认证不能执行权限检查 | `test_registration_cannot_create_admin_or_cross_user_resources` |
| 角色篡改 | JWT 中伪造 ADMIN 不改变数据库中的 CUSTOMER 身份 | `test_jwt_role_claim_cannot_elevate_database_role` |
| 公开提权 | 公开注册拒绝 ADMIN；注册冲突不暴露账号存在性 | `test_registration_cannot_create_admin_or_cross_user_resources`、`test_registration_conflict_does_not_disclose_account_existence` |
| 管理员创建 | 强密码、明确创建人/原因、重复账号阻断，创建结果只记录安全身份信息 | `test_admin_provisioning_requires_strong_password_and_emits_safe_identity` |
| Token 过期/篡改 | 过期 JWT 和修改签名的 JWT 均返回 `TOKEN_INVALID` | `test_expired_and_tampered_tokens_are_rejected` |
| 发送限流/验证码单次使用 | 发送间隔内返回 `EMAIL_RATE_LIMITED`，验证码重复使用返回 `EMAIL_CODE_EXPIRED` | `test_email_codes_are_rate_limited_and_single_use` |
| 验证码锁定/解锁 | 错误次数达到阈值返回 `EMAIL_CODE_LOCKED`，锁定到期后可重新发送并验证 | `test_email_code_failures_lock_the_challenge`、`test_email_code_lock_expires_and_allows_a_new_attempt` |
| 密码登录锁定/解锁 | 连续密码失败后返回 `AUTH_LOCKED`，锁定到期后允许新尝试 | `test_login_lock_expires_and_allows_a_new_attempt` |
| 验证码摘要 | 摘要使用密钥化 HMAC，不能用公开邮箱和 6 位验证码离线复原 | `test_email_code_digest_is_keyed_and_not_a_plain_sha256_code_hash` |
| 敏感信息 | 响应和 GraphQL 错误日志不包含密码哈希、验证码、异常文本或堆栈 | `test_serialized_user_and_graphql_errors_do_not_leak_secrets`、`test_protected_graphql_field_rejects_missing_auth` |

## 本地执行

在 `server-python` 目录执行：

```bash
UV_CACHE_DIR=/private/tmp/yisu-hotel-uv-cache uv run pytest
UV_CACHE_DIR=/private/tmp/yisu-hotel-uv-cache uv run ruff check app tests scripts
UV_CACHE_DIR=/private/tmp/yisu-hotel-uv-cache uv run ruff format --check app tests scripts
UV_CACHE_DIR=/private/tmp/yisu-hotel-uv-cache uv run mypy app tests scripts
```

预期结果：48 项测试通过，覆盖率不低于 75%，Ruff 和 Mypy 无错误。

管理员创建必须通过显式运维命令，示例：

```bash
UV_CACHE_DIR=/private/tmp/yisu-hotel-uv-cache \
uv run python -m scripts.create_admin \
  --username hotel-admin \
  --actor change-ticket-123 \
  --reason '生产首个管理员账号初始化' \
  --confirm CREATE_ADMIN
```

生产环境还必须增加：

```text
--confirm-production I_UNDERSTAND_PRODUCTION_ADMIN_BOOTSTRAP
```

不要把真实密码写入 shell 历史；生产优先使用交互式密码提示或受控 secret 管道。

## Redis/集成验证

P4 第 3、4 项的真实 MySQL + Redis 验证脚本仍作为前置验收：

```bash
UV_CACHE_DIR=/private/tmp/yisu-hotel-uv-cache \
uv run python -m scripts.verify_auth_rbac_flow
```

该脚本必须连接专用且为空的验证数据库，不能对现有开发库执行。
