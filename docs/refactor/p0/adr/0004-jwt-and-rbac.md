# ADR-0004：JWT 兼容与服务端 RBAC

- 状态：Accepted（阿格尼评审通过，2026-10-07）
- 日期：2026-10-07

## 背景

现有客户端使用 Bearer JWT，旧 token 至少包含 `sub` 和 `role`，使用共享 HMAC 密钥。当前注册流程可由客户端选择管理员角色，存在提权风险。

## 决策

继续使用 `Authorization: Bearer` 和 JWT。切换窗口内复用旧 HMAC 密钥验证未过期 token，并通过 `sub` 加载数据库用户；授权以数据库当前角色和资源归属为准。

新 token 增加 `iss`、`aud`、`iat`、`exp`、`jti`。旧 token 的宽松验证只允许通过带截止时间的兼容开关。自助注册只能创建 CUSTOMER/MERCHANT，ADMIN 由受审计运维命令创建。

## 后果

- 用户在切换窗口内无需全部重新登录。
- P11 必须给出旧 token 兼容截止日和密钥轮换方案。
- 每个受保护 resolver 都要有角色和对象归属的拒绝测试。
