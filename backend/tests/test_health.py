import pytest
from httpx import AsyncClient


async def test_health_returns_ok(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


async def test_health_is_fast(client: AsyncClient):
    import time
    start = time.perf_counter()
    resp = await client.get("/health")
    elapsed = time.perf_counter() - start
    assert resp.status_code == 200
    assert elapsed < 1.0
