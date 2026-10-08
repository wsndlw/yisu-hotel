# 易宿酒店 Python 后端

P2 工程骨架，采用 Python 3.12、FastAPI、Ariadne、SQLAlchemy 2、Redis 和 `uv`。GraphQL Schema 直接读取 P1 冻结基线，不在本阶段实现业务 resolver。

## 一条命令启动完整开发环境

安装 Docker Desktop 后，在本目录运行：

```bash
docker compose up --build
```

服务地址：

- GraphQL：`http://localhost:8000/graphql`
- Liveness：`http://localhost:8000/health/live`
- Readiness：`http://localhost:8000/health/ready`
- 开发环境 API 文档：`http://localhost:8000/docs`

Compose 使用 `.env.example` 中明确标记为本地开发专用的值，不能用于 staging 或 production。MySQL 暴露在主机 `3307`，Redis 暴露在主机 `6380`，避免与已有服务冲突。

## 本机运行

要求 Python 3.12 和 `uv`：

```bash
cp .env.example .env
# 本机直连时，将 DB_HOST 改为 localhost、Redis 端口改为 6380 或本机实际端口。
uv sync --frozen --all-groups
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

配置缺失时应用会立即启动失败，并由 Pydantic 明确列出缺少的变量。数据库或 Redis 暂时不可用不会伪装成健康：`/health/live` 仍返回 200，`/health/ready` 返回 503 并标出不可用组件。

## 质量门禁

```bash
make check
```

等价命令：

```bash
uv run ruff format --check .
uv run ruff check .
uv run mypy app tests
uv run pytest
uv run pip-audit
```

更新依赖必须同时提交 `pyproject.toml` 和 `uv.lock`。CI 使用 `uv sync --frozen`，锁文件不一致会直接失败。

在仓库根目录启用提交前门禁：

```bash
uv run --directory server-python pre-commit install --config server-python/.pre-commit-config.yaml
uv run --directory server-python pre-commit run --all-files --config server-python/.pre-commit-config.yaml
```

## 配置规则

必填变量：

- `ENVIRONMENT`
- `DB_HOST`
- `DB_PORT`（1～65535）
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_POOL_SIZE`
- `DB_ECHO`（生产环境必须为 `false`）
- `REDIS_URL`
- `JWT_SECRET`（至少 32 字符；生产环境拒绝开发占位值）
- `JWT_EXPIRES_IN`（例如 `7d`、`12h`、`30m`）
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `CORS_ORIGINS`（JSON 数组）

`.env` 已被 Git 忽略。镜像不会复制 `.env`、测试文件或开发工具，容器以 UID/GID `10001` 的非 root 用户运行，并使用只读根文件系统。
