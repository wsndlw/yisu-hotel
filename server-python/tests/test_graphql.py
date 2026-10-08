import hashlib
from pathlib import Path

import pytest
from httpx import AsyncClient

from app.api.graphql.schema import load_schema_source

P1_SCHEMA_SHA256 = "4b74702f126fa217aa1ef4bf68d5ce4fe789d460a80bfa32c72519912c2b8d34"


def test_graphql_uses_the_frozen_p1_schema() -> None:
    source = load_schema_source(Path("../docs/refactor/p1/baseline/schema.graphql"))

    assert hashlib.sha256(source.encode()).hexdigest() == P1_SCHEMA_SHA256


def test_missing_graphql_schema_fails_with_path() -> None:
    with pytest.raises(RuntimeError, match="GraphQL schema not found"):
        load_schema_source(Path("missing-schema.graphql"))


@pytest.mark.asyncio
async def test_graphql_is_served_at_exact_contract_path(client: AsyncClient) -> None:
    response = await client.post(
        "/graphql",
        json={"query": "query P2Smoke { __typename }", "operationName": "P2Smoke"},
    )

    assert response.status_code == 200
    assert response.json() == {"data": {"__typename": "Query"}}
    assert response.headers["X-Request-ID"]
