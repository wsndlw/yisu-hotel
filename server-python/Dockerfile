# syntax=docker/dockerfile:1.7
FROM ghcr.io/astral-sh/uv:0.11.13 AS uv

FROM python:3.12-slim AS builder
COPY --from=uv /uv /uvx /bin/
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0
WORKDIR /workspace/server-python
COPY server-python/pyproject.toml server-python/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

FROM python:3.12-slim AS runtime
ENV PATH="/workspace/server-python/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
RUN groupadd --system --gid 10001 appgroup \
    && useradd --system --uid 10001 --gid appgroup --home-dir /nonexistent appuser
WORKDIR /workspace/server-python
COPY --from=builder --chown=appuser:appgroup /workspace/server-python/.venv .venv
COPY --chown=appuser:appgroup server-python/app app
COPY --chown=appuser:appgroup docs/refactor/p1/baseline/schema.graphql \
    /workspace/docs/refactor/p1/baseline/schema.graphql
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health/live', timeout=2)"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
