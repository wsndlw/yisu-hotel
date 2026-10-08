.PHONY: sync format lint typecheck test audit check dev migration-current migration-up migration-check database-verify compose-up compose-down

sync:
	uv sync --frozen --all-groups

format:
	uv run ruff format .

lint:
	uv run ruff format --check .
	uv run ruff check .

typecheck:
	uv run mypy app tests scripts

test:
	uv run pytest

audit:
	uv run pip-audit

check: lint typecheck test audit

dev:
	uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

migration-current:
	uv run alembic current

migration-up:
	uv run alembic upgrade head

migration-check:
	uv run alembic check

database-verify:
	uv run python -m scripts.verify_database

compose-up:
	docker compose up --build

compose-down:
	docker compose down
