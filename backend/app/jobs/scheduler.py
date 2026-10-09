"""APScheduler setup for local dev. Production uses Vercel Cron → POST /recap/build."""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.db import AsyncSessionLocal
from app.services.recap_builder import build_recap

scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")


async def _build_recap_job() -> None:
    async with AsyncSessionLocal() as db:
        await build_recap(db)


def start_scheduler() -> None:
    # 06:00 IST — build morning recap from yesterday's data
    scheduler.add_job(_build_recap_job, CronTrigger(hour=6, minute=0, timezone="Asia/Kolkata"), id="build_recap", replace_existing=True)
    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
