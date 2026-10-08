from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.models import ProjectTask, ProjectLog
from app.schemas.project import (
    ProjectTaskCreate,
    ProjectTaskUpdate,
    ProjectTaskOut,
    ProjectLogUpsert,
    ProjectLogOut,
)

router = APIRouter(prefix="/project", tags=["project"])


@router.get("/tasks", response_model=list[ProjectTaskOut])
async def list_tasks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProjectTask).order_by(ProjectTask.created_at))
    return result.scalars().all()


@router.post("/tasks", response_model=ProjectTaskOut, status_code=201)
async def create_task(body: ProjectTaskCreate, db: AsyncSession = Depends(get_db)):
    task = ProjectTask(**body.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=ProjectTaskOut)
async def update_task(
    task_id: int, body: ProjectTaskUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ProjectTask).where(ProjectTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProjectTask).where(ProjectTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    await db.delete(task)
    await db.commit()


@router.get("/log/today", response_model=ProjectLogOut | None)
async def get_today_log(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProjectLog).where(ProjectLog.date == date.today())
    )
    return result.scalar_one_or_none()


@router.put("/log/today", response_model=ProjectLogOut)
async def upsert_today_log(body: ProjectLogUpsert, db: AsyncSession = Depends(get_db)):
    today = date.today()
    result = await db.execute(select(ProjectLog).where(ProjectLog.date == today))
    log = result.scalar_one_or_none()

    if log:
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(log, field, value)
    else:
        log = ProjectLog(date=today, **body.model_dump())
        db.add(log)

    await db.commit()
    await db.refresh(log)
    return log
