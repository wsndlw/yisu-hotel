.PHONY: sync format lint typecheck test audit check dev compose-up compose-down

sync:
	uv sync --frozen --all-groups

format:
	uv run ruff format .

lint:
	uv run ruff format --check .
	uv run ruff check .

typecheck:
	uv run mypy app tests

test:
	uv run pytest

audit:
	uv run pip-audit

check: lint typecheck test audit

dev:
	uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

compose-up:
	docker compose up --build

compose-down:
	docker compose down
