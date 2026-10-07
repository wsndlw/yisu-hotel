# P1 环境变量与配置现状

> 盘点日期：2026-10-07
> 范围：Node 服务、PC、移动端；不记录任何真实值。

## Node 服务当前读取的变量

| 变量 | 当前默认值/必填性 | 用途 | P1 结论 |
|---|---|---|---|
| `PORT` | 默认 `3000` | HTTP 端口 | 保留 |
| `JWT_SECRET` | 默认 `dev_secret_change_me` | JWT HMAC 密钥 | 默认值为阻断缺陷；P2 改为必填 |
| `JWT_EXPIRES_IN` | 默认 `7d` | JWT 有效期 | 保留并强类型校验 |
| `EMAIL_HOST` | 默认 `smtp.163.com` | SMTP 主机 | 测试使用 fake；真实集成时必填 |
| `EMAIL_PORT` | 默认 `465` | SMTP 端口 | 强类型整数 |
| `EMAIL_SECURE` | 默认非 `true` | SMTP TLS 模式 | 强类型布尔值 |
| `EMAIL_USER` | 默认空 | SMTP 用户 | 敏感，禁止日志 |
| `EMAIL_PASS` | 默认空 | SMTP 密码 | 密钥，禁止仓库/日志 |
| `EMAIL_FROM` | 无默认 | 发件人 | 真实邮件环境必填 |
| `EMAIL_SEND_INTERVAL_SECONDS` | 默认 `60` | 发送间隔 | 转移到 Redis 限流配置 |
| `EMAIL_CODE_EXPIRE_MINUTES` | 默认 `5` | 验证码 TTL | 转移到 Redis TTL |
| `EMAIL_CODE_FAIL_MAX_COUNT` | 默认 `5` | 最大失败次数 | 保留规则 |
| `EMAIL_CODE_FAIL_LOCK_MINUTES` | 默认 `10` | 失败锁定时间 | 保留规则 |
| `EMAIL_CODE_SINGLE_USE` | 仅字符串 `true` 开启 | 单次使用 | Python 生产固定开启 |
| `OSS_ACCESS_KEY_ID` | 无默认 | 阿里云访问密钥 ID | 密钥服务/环境变量 |
| `OSS_ACCESS_KEY_SECRET` | 无默认 | 阿里云访问密钥 | 密钥服务/环境变量 |
| `OSS_STS_ROLE_ARN` | 无默认 | STS 角色 | 必填并限制权限 |
| `OSS_BUCKET` | 无默认 | OSS Bucket | 必填 |
| `OSS_REGION` | 无默认 | OSS Region | 必填 |

## 当前未环境化的服务配置

`server/src/app.module.ts` 目前硬编码：

- MySQL host `localhost`、port `3306`、user `root`、password `123456`、database `yisu_hotel`。
- `synchronize: true` 和 SQL logging。

P2 必须引入 `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`、`DB_POOL_SIZE`、`DB_ECHO`，并彻底禁止运行时自动改表。

JWT 目标配置还需要 `JWT_ISSUER`、`JWT_AUDIENCE` 和旧 token 兼容截止时间；Redis/Celery 需要 `REDIS_URL`、`CELERY_BROKER_URL`、`CELERY_RESULT_BACKEND`。这些是目标新增项，不属于 Node 当前契约。

## PC 当前读取的变量

| 变量 | 当前状态 | P1 结论 |
|---|---|---|
| `VITE_BAIDU_MAP_AK` | 已使用 | 保留；按环境注入 |
| `VITE_GRAPHQL_URL` | 尚未使用 | P9 前必须引入；当前 Apollo 硬编码 `http://localhost:3000/graphql` |

## 移动端当前读取的变量

| 变量 | 当前状态 | P1 结论 |
|---|---|---|
| `EXPO_PUBLIC_GRAPHQL_URL` | 已使用 | 保留；未设置时回退 `http://localhost:3000/graphql` |

## 安全规则

- `.env.example` 只放变量名和非敏感示例，不放可用凭据。
- CI/staging/prod 的密钥由环境或密钥服务注入。
- 启动日志不得输出变量值；缺失必填项时只报告变量名。
- 测试默认使用 Redis 容器、fake SMTP 和 fake OSS。
