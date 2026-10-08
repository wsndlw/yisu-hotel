# P2：Python 工程骨架和质量门禁

> 状态：READY FOR REVIEW（远程 CI 证据待补）
> 启动日期：2026-10-07
> 负责人：厉飞雨

## 交付物

| 项目 | 实现位置 | 当前状态 |
|---|---|---|
| FastAPI + Ariadne 服务 | `server-python/app` | 已实现并通过本机冒烟验证 |
| P1 GraphQL Schema 加载 | `app/api/graphql/schema.py` | 已实现，禁止静默改写 |
| 强类型配置 | `app/core/config.py` | 已实现，关键变量无生产默认值 |
| 请求 ID 与 JSON 日志 | `app/core/request_id.py`、`app/core/logging.py` | 已实现 |
| 统一 REST 错误 | `app/core/errors.py` | 已实现 |
| Liveness/Readiness | `app/api/health.py` | 已实现 |
| MySQL/Redis 异步连接检查 | `app/core/runtime.py` | 已实现 |
| Ruff/Mypy/Pytest/Coverage/pip-audit | `pyproject.toml`、`uv.lock` | 本机门禁通过 |
| 非 root 多阶段镜像 | `server-python/Dockerfile` | 已构建验证，运行用户为 UID/GID 10001 |
| Compose 开发环境 | `server-python/compose.yaml` | 已启动验证，API/MySQL/Redis 均健康 |
| CI 门禁 | `.github/workflows/python-backend.yml` | 已实现，待远程运行 |

## P2 出口条件

- [x] `uv.lock` 已生成且 `uv sync --frozen` 可重复。
- [x] Ruff 格式和规则检查通过。
- [x] Mypy strict 通过。
- [x] Pytest 与覆盖率门禁通过。
- [x] 依赖安全扫描无已知漏洞。
- [x] 缺失必需配置的失败路径有自动化测试。
- [x] `/health/live` 和 `/health/ready` 的成功/失败路径有自动化测试。
- [x] Docker 镜像成功构建并确认以非 root 用户运行。
- [x] 本地等价质量门禁有可审计验证证据；远程 CI 首次运行待提交后确认。

P2 已完成本地质量与容器门禁并进入 `READY FOR REVIEW`。代码提交并取得远程 CI 成功记录后，可标记 `DONE`。

## 2026-10-07 本地验证证据

| 门禁 | 结果 |
|---|---|
| Python 运行时 | CPython 3.12.15 |
| 锁文件复现 | `uv sync --frozen --all-groups`，78 个包检查通过 |
| Ruff | 18 个文件格式检查通过，lint 通过 |
| Mypy | strict 模式，17 个源文件通过 |
| Pytest/Coverage | 16 项测试通过；总覆盖率 92.74%，门槛 75% |
| pre-commit | format、lint、mypy、pytest 四个 hook 全部通过 |
| 依赖审计 | `pip-audit`：`No known vulnerabilities found` |
| 缺失配置 | 清空环境后导入应用以退出码 1 失败，并列出 11 个必填变量 |
| 运行时冒烟 | `/health/live` 200；依赖不可用时 `/health/ready` 503；GraphQL `__typename` 200 |
| Docker/Compose | 三个服务均 healthy；`/health/ready` 200，MySQL/Redis 均为 up |
| 镜像安全 | API 以 `10001:10001` 运行；镜像无 `.env`，不含 pytest 等开发依赖 |

安全审计首次发现 `starlette 0.52.1` 存在公开漏洞，因此将 Ariadne 升级到 1.1.1、Starlette 升级到 1.7.0，并在升级后重跑全部门禁。最终锁文件只引用官方 PyPI。

首次 Compose 验证发现 MySQL 8.4 的 `caching_sha2_password` 认证需要 `cryptography`。已增加显式运行时依赖和回归测试，并因安全审计结果将其锁定为无已知漏洞的 50.0.2；修复后 readiness 返回 200。
