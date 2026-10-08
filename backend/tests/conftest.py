import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import delete

from app.main import app
from app.core.db import AsyncSessionLocal
from app.models.models import SyllabusItem


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def seeded_sd1(client):
    """Ensures at least one sd1 syllabus item exists; cleans up test-only items after."""
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select, func
        result = await session.execute(
            select(func.count(SyllabusItem.id)).where(SyllabusItem.track == "sd1")
        )
        if result.scalar():
            yield
            return

        item = SyllabusItem(track="sd1", day_no=1, title="Test Item", description="Test description")
        session.add(item)
        await session.commit()
        item_id = item.id

    yield

    async with AsyncSessionLocal() as session:
        await session.execute(delete(SyllabusItem).where(SyllabusItem.id == item_id))
        await session.commit()
