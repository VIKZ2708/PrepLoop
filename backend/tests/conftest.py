import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import delete, select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.core.config import settings
from app.models.models import SyllabusItem

# Separate engine with NullPool so fixtures don't conflict with the app's pool
_engine = create_async_engine(
    settings.DATABASE_URL, poolclass=NullPool, connect_args={"statement_cache_size": 0}
)
_Session = async_sessionmaker(_engine, expire_on_commit=False)


@pytest.fixture(scope="session")
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture(scope="session")
async def seeded_sd1(client):
    """Ensures ≥1 sd1 syllabus item exists; inserts a minimal one only if DB is empty."""
    async with _Session() as session:
        result = await session.execute(
            select(func.count(SyllabusItem.id)).where(SyllabusItem.track == "sd1")
        )
        count = result.scalar()

    if count:
        yield
        return

    # Insert a minimal item so /study/today?track=sd1 has something to anchor to
    async with _Session() as session:
        item = SyllabusItem(track="sd1", day_no=1, title="Test Item", description="Test")
        session.add(item)
        await session.commit()
        inserted_id = item.id

    yield

    async with _Session() as session:
        await session.execute(delete(SyllabusItem).where(SyllabusItem.id == inserted_id))
        await session.commit()
